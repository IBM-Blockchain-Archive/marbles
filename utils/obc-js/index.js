"use strict";
/* global __dirname */
/* global Buffer */
/*******************************************************************************
 * Copyright (c) 2016 IBM Corp.
 *
 * All rights reserved. 
 *   
 *******************************************************************************/
/*
	Version: 0.2
	Updated: 01/20/2016
*/

//Load modules
var fs = require('fs');
var path = require('path');
var https = require('https');
var async = require('async');
var rest = require(__dirname + "/lib/rest");
var AdmZip = require('adm-zip');

var contract = {
					cc: {
						read: null,
						write: null,
						remove: null,
						deploy: null,
						readNames: null,
						details:{
									deployed_name: '',
									func: [],
									git_dir: '',
									git_url: '',
									peers: [],
									vars: [],
									zip_url: '',
						}
					}
				};

function obc() {}

var tempDirectory = path.join(__dirname, "./temp");								//	./temp

// ============================================================================================================================
// EXTERNAL - load() - load the chaincode and parssssssssse
// 0. Load the github or zip
// 1. Unzip & scan directory for files
// 2. Iter over go files
// 		2a. Find Run() in file, grab variable for *simplechaincode
//		2b. Grab function names that need to be exported
//		2c. Create JS function for golang function
// 3. Call callback()
// ============================================================================================================================
obc.prototype.load = function(options, cb) {	
	var keep_looking = true;
	var zip_dest = path.join(tempDirectory,  '/file.zip');							//	./temp/file.zip
	var unzip_dest = path.join(tempDirectory,  '/unzip');							//	./temp/unzip
	var unzip_cc_dest = path.join(unzip_dest, '/', options.git_dir);				//	./temp/unzip/DIRECTORY
	contract.cc.details.zip_url = options.zip_url;
	contract.cc.details.git_dir = options.git_dir;
	contract.cc.details.git_url = options.git_url;
	if(options.deployed_name) contract.cc.details.deployed_name = options.deployed_name;
	
	// Preflight checklist
	try{fs.mkdirSync(tempDirectory);}
	catch(e){ }
	fs.access(unzip_cc_dest, cb_file_exists);										//check if files exist yet
	function cb_file_exists(e){
		if(e != null){
			download_it();															//nope
		}
		else{
			fs.readdir(unzip_cc_dest, cb_got_names);								//yeppers
		}
	}

	// Step 0.
	function download_it(){
		console.log('[obc-js] downloading zip');
		var file = fs.createWriteStream(zip_dest);
		https.get(options.zip_url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close(cb_downloaded);  										//close() is async
			});
		}).on('error', function(err) {
			console.log('[obc-js] download error');
			fs.unlink(zip_dest); 													//delete the file async
			if (cb) cb(eFmt('fs error', 500, err.message), contract);
		});
	}
	
	// Step 1.
	function cb_downloaded(){
		console.log('[obc-js] unzipping zip');
		var zip = new AdmZip(zip_dest);
		zip.extractAllTo(unzip_dest, /*overwrite*/true);
		console.log('[obc-js] unzip done');
		fs.readdir(unzip_cc_dest, cb_got_names);
		fs.unlink(zip_dest, function(err) {});									//remove zip file, never used again
	}

	// Step 2.
	function cb_got_names(err, obj){
		console.log('[obc-js] scanning files', obj);
		if(err != null) console.log('[obc-js] fs readdir Error', err);
		else{
			for(var i in obj){
				//console.log(i, obj[i]);
				
				//GO FILES
				if(obj[i].indexOf('.go') >= 0){
					if(keep_looking){
						fs.readFile(path.join(unzip_cc_dest, obj[i]), 'utf8', cb_read_go_file);
					}
				}
			}
		}
	}
	
	function cb_read_go_file(err, str){
		if(err != null) console.log('[obc-js] fs readfile Error', err);
		else{
			
			// Step 2a.
			var regex = /func\s+\((\w+)\s+\*SimpleChaincode\)\s+Run/i;					//find the variable name that Run is using for simplechaincode pointer
			var res = str.match(regex);
			if(res[1] == null){
				console.log('[obc-js] error did not find variable name in chaincode');
			}
			else{
				keep_looking = false;
				
				// Step 2b.
				var re = new RegExp('\\s' + res[1] + '\\.(\\w+)\\(', "gi");
				res = str.match(re);
				if(res[1] == null){
					console.log('[obc-js] error did not find function names in chaincode');
				}
				else{
					
					// Step 2c.
					for(var i in res){
						var pos = res[i].indexOf('.');
						var temp = res[i].substring(pos + 1, res[i].length - 1);
						console.log('[obc-js] Found func: ', temp);
						populate_go_contract(temp);
					}
					
					// Step 3.
					obc.prototype.save(tempDirectory);
					contract.cc.read = read;
					contract.cc.write = write;
					contract.cc.remove = remove;
					contract.cc.deploy = deploy;
					if(cb) cb(null, contract);
				}
			}
		}
	}
};

// ============================================================================================================================
// EXTERNAL - network() - setup network configuration to hit a rest peer
// ============================================================================================================================
obc.prototype.network = function(arrayPeers){
	if(arrayPeers.constructor !== Array){
		console.log('[obc-js] Error - network arg should be array of peer objects');
	}
	else{
		for(var i in arrayPeers){
			var pos = arrayPeers[i].id.indexOf('_') + 1;
			arrayPeers[i].name = arrayPeers[i].id.substring(pos) + '-' + arrayPeers[i].api_host + ':' + arrayPeers[i].api_port;
			console.log(arrayPeers[i].name);
		}
		var ssl = true;
		contract.cc.details.peers = arrayPeers;
		if(arrayPeers[0].api_url.indexOf('https') == -1) ssl = false;				//not https, no tls
		
		rest.init({																	//load default values for rest call to peer
					host: contract.cc.details.peers[0].api_host,
					port: contract.cc.details.peers[0].api_port,
					headers: {
								"Content-Type": "application/json",
								"Accept": "application/json",
							},
					ssl: ssl,
					quiet: true
		});
	}
};

// ============================================================================================================================
// EXTERNAL - save() - write contract details to a json file
// ============================================================================================================================
obc.prototype.save =  function(dir, cb){
	var dest = path.join(dir, '/chaincode.json');
	fs.writeFile(dest, JSON.stringify({details: contract.cc.details}), function(e){
		if(e != null){
			console.log(e);
			if(cb) cb(eFmt('fs write error', 500, e), null);
		}
		else {
			console.log('\t- saved ', dest);
			if(cb) cb(null, null);
		}
	});
};

// ============================================================================================================================
// EXTERNAL - clear() - clear the temp directory
// ============================================================================================================================
obc.prototype.clear =  function(cb){
	console.log('[obc-js] removing temp');
	removeThing(tempDirectory, cb);
};

function removeThing(dir, cb){
	//console.log('!', dir);
	fs.readdir(dir, function (err, files) {
		async.each(files, function (file, cb) {						//over each thing
			file = path.join(dir, file);
			fs.stat(file, function(err, stat) {
				if (err) {
					if(cb) cb(err);
					return;
				}
				if (stat.isDirectory()) {
					removeThing(file, cb);							//keep going
				}
				else {
					//console.log('!', dir);
					fs.unlink(file, function(err) {
						if (err) {
							//console.log('error', err);			//dsh - need to rethink this??/ does not always work - to do
							if(cb) cb(err);
							return;
						}
						console.log('good', dir);
						if(cb) cb();
						return;
					});
				}
			});
		}, function (err) {
			if(err){
				if(cb) cb(err);
				return;
			}
			fs.rmdir(dir, function (err) {
				if(cb) cb(err);
				return;
			});
		});
	});
}
module.exports = obc;

//============================================================================================================================
//read() - read generic variable from chaincode state
//============================================================================================================================
function read(name, cb, lvl){						//lvl is for reading past state blocks, tbd exactly
	var options = {
		path: '/devops/query'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.deployed_name,
						},
						ctorMsg: {
							function: "query",
							args: [name]
						}
					}
				};
	//console.log('body', body);
	options.success = function(statusCode, data){
		console.log("[obc-js] Read - success:", data);
		if(cb) cb(null, data.OK);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Read - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
		rest.post(options, '', body);
	
}

//============================================================================================================================
//write() - write generic variable to chaincode state
//============================================================================================================================
function write(name, val, cb){
	var options = {
		path: '/devops/invoke'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.deployed_name,
						},
						ctorMsg: {
							function: 'write',
							args: [name, val]
						}
					}
				};
	
	options.success = function(statusCode, data){
		console.log("[obc-js] Write - success:", data);
		if(cb) cb(null, data);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Write - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.post(options, '', body);
}

//============================================================================================================================
//remove() - delete a generic variable from chaincode state
//============================================================================================================================
function remove(name, cb){
	var options = {
		path: '/devops/invoke'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.deployed_name,
						},
						ctorMsg: {
							function: 'delete',
							args: [name]
						}
					}
				};

	options.success = function(statusCode, data){
		console.log("[obc-js] Remove - success:", data);
		if(cb) cb(null, data);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Remove - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.post(options, '', body);
}

//============================================================================================================================
//deploy() - deploy chaincode and call a cc function
//============================================================================================================================
function deploy(func, args, save_path, cb){
	console.log("[obc-js] Deploying chaincode");
	var options = {path: '/devops/deploy'};
	var body = 	{
					type: "GOLANG",
					chaincodeID: {
							path: contract.cc.details.git_url
						},
					ctorMsg:{
							"function": func,
							"args": args
					}
				};
	options.success = function(statusCode, data){
		console.log("[obc-js] deploy - success [but you should wait 1 minute, callback is delayed a bit]:", data);
		contract.cc.details.deployed_name = data.message;
		obc.prototype.save(tempDirectory);									//save it so we remember we have deployed
		if(save_path != null) obc.prototype.save(save_path);				//user wants the updated file somewhere
		if(cb){
			setTimeout(function(){ cb(null, data);}, 60000);				//wait extra long, not always ready yet
		}
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] deploy - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.post(options, '', body);
}

//============================================================================================================================
//readNames() - read all variable names in chaincode state
//============================================================================================================================
function readNames(cb, lvl){						//lvl is for reading past state blocks, tbd exactly
	read('_all', cb, lvl);
}


//============================================================================================================================
//Helper Functions() 
//============================================================================================================================

//==================================================================
//populate_contract() - create JS call for custom goLang function, store in contract!
//==================================================================
function populate_go_contract(name){
	if(contract[name] != null){
		console.log('[obc-js] \t skip, already exists');
	}
	else {
		contract.cc.details.func.push(name);
		contract[name] = function(args, cb){				//create the functions in contract obj
			var options = {path: '/devops/invoke'};
			var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.deployed_name,
						},
						ctorMsg: {
							function: name,
							args: args
						}
					}
			};

			options.success = function(statusCode, data){
				console.log("[obc-js]", name, " - success:", data);
				if(cb) cb(null, data);
			};
			options.failure = function(statusCode, e){
				console.log("[obc-js]", name, " - failure:", statusCode);
				if(cb) cb(eFmt('http error', statusCode, e), null);
			};
			rest.post(options, '', body);
		};
	}
}

//==================================================================
//eFmt() - format errors
//==================================================================
function eFmt(name, code, details){
	return 	{
		name: String(name),
		code: Number(code),
		details: details
	};
}
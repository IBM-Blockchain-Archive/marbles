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

var chaincode = {
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
				};

function obc() {}

var tempDirectory = path.join(__dirname, "./temp");									//	./temp

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
	var errors = [];
	if(!options.zip_url) errors.push("the option 'zip_url' is required");
	if(!options.git_dir) errors.push("the option 'git_dir' is required");
	if(!options.git_url) errors.push("the option 'git_url' is required");
	if(errors.length > 0){															//check for input errors
		console.log('[obc-js] Input Error - obc.load()', errors);
		if(cb) cb(eFmt('input error', 400, errors));
		return;																		//get out of dodge
	}
	
	var keep_looking = true;
	var zip_dest = path.join(tempDirectory,  '/file.zip');							//	./temp/file.zip
	var unzip_dest = path.join(tempDirectory,  '/unzip');							//	./temp/unzip
	var unzip_cc_dest = path.join(unzip_dest, '/', options.git_dir);				//	./temp/unzip/DIRECTORY
	chaincode.details.zip_url = options.zip_url;
	chaincode.details.git_dir = options.git_dir;
	chaincode.details.git_url = options.git_url;
	if(options.deployed_name) chaincode.details.deployed_name = options.deployed_name;
	
	// Preflight checklist
	try{fs.mkdirSync(tempDirectory);}
	catch(e){ }
	fs.access(unzip_cc_dest, cb_file_exists);										//check if files exist yet
	function cb_file_exists(e){
		if(e != null){
			download_it(options.zip_url);											//nope
		}
		else{
			console.log('[obc-js] found chaincode in local file system');
			fs.readdir(unzip_cc_dest, cb_got_names);								//yeppers
		}
	}
	

	// Step 0.
	function download_it(download_url){
		console.log('[obc-js] downloading zip');
		var file = fs.createWriteStream(zip_dest);
		https.get(download_url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				if(response.headers.status === '302 Found'){
					console.log('redirect...', response.headers.location);
					file.close();
					download_it(response.headers.location);
				}
				else{
					file.close(cb_downloaded);  									//close() is async
				}
			});
		}).on('error', function(err) {
			console.log('[obc-js] download error');
			fs.unlink(zip_dest); 													//delete the file async
			if (cb) cb(eFmt('fs error', 500, err.message), chaincode);
		});
	}
	
	// Step 1.
	function cb_downloaded(){
		console.log('[obc-js] unzipping zip');
		var zip = new AdmZip(zip_dest);
		zip.extractAllTo(unzip_dest, /*overwrite*/true);
		console.log('[obc-js] unzip done');
		fs.readdir(unzip_cc_dest, cb_got_names);
		fs.unlink(zip_dest, function(err) {});										//remove zip file, never used again
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
						console.log('[obc-js] Found cc function: ', temp);
						populate_go_chaincode(temp);
					}
					
					// Step 3.
					obc.prototype.save(tempDirectory);
					chaincode.read = read;
					chaincode.write = write;
					chaincode.remove = remove;
					chaincode.deploy = deploy;
					if(cb) cb(null, chaincode);
				}
			}
		}
	}
};

// ============================================================================================================================
// EXTERNAL - network() - setup network configuration to hit a rest peer
// ============================================================================================================================
obc.prototype.network = function(arrayPeers){
	var errors = [];
	if(!arrayPeers) errors.push("network input arg should be array of peer objects");
	else if(arrayPeers.constructor !== Array) errors.push("network input arg should be array of peer objects");
	if(errors.length > 0){															//check for input errors
		console.log('[obc-js] Input Error - obc.network()', errors);
	}
	else{
		for(var i in arrayPeers){
			var pos = arrayPeers[i].id.indexOf('_') + 1;
			var temp = 	{
							name: '',
							api_host: arrayPeers[i].api_host,
							api_port: arrayPeers[i].api_port,
							id: arrayPeers[i].id,
							ssl: true
						};
			temp.name = arrayPeers[i].id.substring(pos) + '-' + arrayPeers[i].api_host + ':' + arrayPeers[i].api_port;	//build friendly name
			if(arrayPeers[i].api_url.indexOf('https') == -1) temp.ssl = false;
			console.log('[obc-js] Peer: ', temp.name);
			chaincode.details.peers.push(temp);
		}

		rest.init({																	//load default values for rest call to peer
					host: chaincode.details.peers[0].api_host,
					port: chaincode.details.peers[0].api_port,
					headers: {
								"Content-Type": "application/json",
								"Accept": "application/json",
							},
					ssl: chaincode.details.peers[0].ssl,
					quiet: true
		});
	}
};

// ============================================================================================================================
// EXTERNAL - save() - write chaincode details to a json file
// ============================================================================================================================
obc.prototype.save =  function(dir, cb){
	var errors = [];
	if(!dir) errors.push("the option 'dir' is required");
	if(errors.length > 0){																//check for input errors
		console.log('[obc-js] Input Error - obc.save()', errors);
		if(cb) cb(eFmt('input error', 400, errors));
	}
	else{
		var fn = 'chaincode.json';
		if(chaincode.details.deployed_name) fn = chaincode.details.deployed_name + '.json';
		var dest = path.join(dir, fn);
		fs.writeFile(dest, JSON.stringify({details: chaincode.details}), function(e){
			if(e != null){
				console.log(e);
				if(cb) cb(eFmt('fs write error', 500, e), null);
			}
			else {
				//console.log(' - saved ', dest);
				if(cb) cb(null, null);
			}
		});
	}
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
// EXTERNAL chain_stats() - get blockchain stats
//============================================================================================================================
obc.prototype.chain_stats =  function(cb){
	var options = {path: '/chain'};

	options.success = function(statusCode, data){
		console.log("[obc-js] Chain Stats - success");
		if(cb) cb(null, data);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Chain Stats - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.get(options, '');
};

//============================================================================================================================
// EXTERNAL block_stats() - get block meta data
//============================================================================================================================
obc.prototype.block_stats =  function(id, cb){
	var options = {path: '/chain/blocks/' + id};					//i think block IDs start at 0, height starts at 1, fyi
	options.success = function(statusCode, data){
		console.log("[obc-js] Block Stats - success");
		if(cb) cb(null, data);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Block Stats - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.get(options, '');
};


//============================================================================================================================
//read() - read generic variable from chaincode state
//============================================================================================================================
function read(name, cb, lvl){										//lvl is for reading past state blocks, tbd exactly
	var options = {
		path: '/devops/query'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: chaincode.details.deployed_name,
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
							name: chaincode.details.deployed_name,
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
							name: chaincode.details.deployed_name,
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
	console.log("[obc-js] Deploying Chaincode - Start");
	console.log("\n\n\t Waiting...");										//this can take awhile
	var options = {path: '/devops/deploy'};
	var body = 	{
					type: "GOLANG",
					chaincodeID: {
							path: chaincode.details.git_url
						},
					ctorMsg:{
							"function": func,
							"args": args
					}
				};
	options.success = function(statusCode, data){
		console.log("\n\n\t deploy success [wait 1 more minute]");
		chaincode.details.deployed_name = data.message;
		obc.prototype.save(tempDirectory);									//save it so we remember we have deployed
		if(save_path != null) obc.prototype.save(save_path);				//user wants the updated file somewhere
		if(cb){
			setTimeout(function(){
				console.log("[obc-js] Deploying Chaincode - Complete");
				cb(null, data);
			}, 60000);														//wait extra long, not always ready yet
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
function readNames(cb, lvl){												//lvl is for reading past state blocks, tbd exactly
	read('_all', cb, lvl);
}


//============================================================================================================================
//Helper Functions() 
//============================================================================================================================

//==================================================================
//populate_chaincode() - create JS call for custom goLang function, store in chaincode!
//==================================================================
function populate_go_chaincode(name){
	if(chaincode[name] != null){
		console.log('[obc-js] \t skip, already exists');
	}
	else {
		chaincode.details.func.push(name);
		chaincode[name] = function(args, cb){								//create the functions in chaincode obj
			var options = {path: '/devops/invoke'};
			var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: chaincode.details.deployed_name,
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
/* global __dirname */
"use strict";
/* global Buffer */
/*******************************************************************************
 * Copyright (c) 2016 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
/*
	Version: 0.1
	Updated: 01/08/2015
	-----------------------------------------------------------------
	Use:	var obc = require('./obc-js');
			dsh - to do, fill this out
			
	-----------------------------------------------------------------
	Example:
	contract = {
					init: function({args}, cb){},					//example
					invoke: function({args}, cb){},					//example
					cc:{
						read: function(name, cb, lvl),				//use the go code Query() function
						write: function(name, val, cb),				//use the go code Write() function
						deploy: function(func, args, cb),			//if successful will also set cc.details.name, func & args are optional
						readNames: function(cb, lvl),				//read all variables in chaincode state space
						details: {
							host: "",								//peer to hit
							port: "",
							url:  "",								//direct link to .zip of chaincode
							path: "",								//
							name: "",								//hashed name of chaincode, deploy() will set it, else user sets it
							dir: "",								//path to chaincode directory from zip
							func: [],
							vars: []
						}
					}
				}
				
	Error Format:
	{
		name: "short name of error" 
		code: http status code as integer
		details: "long description OR user friendly error OR error obj"
	}

	-----------------------------------------------------------------
*/

//Load modules
var fs = require('fs');
var rest = require("./rest");
var unzip = require("unzip2");

//Globalish
var contract = 	{
					cc: {
						read: read,
						write: write,
						remove: remove,
						deploy: deploy,
						readNames: readNames,
						details:{
									host: "",
									port: 80,
									path: "",
									url: "",
									name: {},
									func: [],
									vars: []
						}
					}
				};

// ============================================================================================================================
// EXTERNAL - network() - setup network configuration to hit a rest peer
// ============================================================================================================================
module.exports.network = function(arrayPeers){
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
		contract.cc.details.host = arrayPeers[0].api_host;
		contract.cc.details.port = arrayPeers[0].api_port;
		contract.cc.details.peers = arrayPeers;
		if(arrayPeers[0].api_url.indexOf('https') == -1) ssl = false;				//not https, no tls
		
		rest.init({																	//load default values for rest call to peer
					host: contract.cc.details.host,
					port: contract.cc.details.port,
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
module.exports.save = function(cb){
	var dest = __dirname + '/temp/cc.json';
	fs.writeFile(dest, JSON.stringify(contract.cc), function(e){

		if (e != null) {
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
// EXTERNAL - load() - load the chaincode and parssssssssse
// 0. Load the github or zip
// 1. Unzip & scan directory for files
// 2. Iter over go files
// 		2a. Find Run() in file, grab variable for *simplechaincode
//		2b. Grab function names that need to be exported
//		2c. Create JS function for golang function
// 3. Call callback()
// ============================================================================================================================
module.exports.load = function(url, dir, cb){
	var keep_looking = true;
	var temp_dest = __dirname + '/temp';										//	./temp
	var dest = __dirname + '/temp/file.zip';									//	./temp/file.zip
	var unzip_dest = temp_dest + '/unzip';										//	./temp/unzip
	var unzip_cc_dest = unzip_dest + '/' + dir;									//	./temp/unzip/DIRECTORY
	var https = require('https');
	contract.cc.details.url = url;
	contract.cc.details.dir = dir;
	
	// Preflight checklist
	try{fs.mkdirSync(temp_dest);}
	catch(e){}
	fs.access(unzip_cc_dest, cb_file_exists);									//does this shit exist yet?
	function cb_file_exists(e){
		if(e != null){
			download_it();														//nope
		}
		else{
			fs.readdir(unzip_cc_dest, cb_got_names);							//yeppers
		}
	}

	// Step 0.
	function download_it(){
		console.log('[obc-js] downloading zip');
		var file = fs.createWriteStream(dest);
		https.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close(cb_downloaded);  									//close() is async
			});
		}).on('error', function(err) {
			console.log('[obc-js] error');
			fs.unlink(dest); 													//delete the file async
			if (cb) cb(eFmt('fs error', 500, err.message), contract);
		});
		
		function cb_downloaded(){
			console.log('[obc-js] unzipping zip');
			
			// Step 1.
			//fs.createReadStream(dest).pipe(unzip.Extract({ path: 'temp/unzip' }, fs.readdir(unzip_cc_dest, cb_got_names)));function(){ fixURLbar(item); }
			fs.createReadStream(dest).pipe(unzip.Extract({ path: unzip_dest }, setTimeout(function(){ fs.readdir(unzip_cc_dest, cb_got_names); }, 5000)));	//this sucks, dsh replace
		}
	}
	
	// Step 2.
	function cb_got_names(err, obj){
		console.log('[obc-js] scanning files');
		if(err != null) console.log('[obc-js] Error', err);
		else{
			for(var i in obj){
				//console.log(i, obj[i]);
				
				//GO FILES
				if(obj[i].indexOf('.go') >= 0){
					if(keep_looking){
						fs.readFile(unzip_cc_dest + '/' + obj[i], 'utf8', cb_read_go_file);
					}
				}
			}
		}
	}
	
	function cb_read_go_file(err, str){
		if(err != null) console.log('[obc-js] Error', err);
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
					module.exports.save();
					if(cb) cb(null, contract);
				}
			}
		}
	}
};

// ============================================================================================================================
// read() - read generic variable from chaincode state
// ============================================================================================================================
function read(name, cb, lvl){						//lvl is for reading past state blocks, tbd exactly
	var options = {
		path: '/devops/query'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.name,
						},
						ctorMsg: {
							function: "query",
							args: [name]
						}
					}
				};
				
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

// ============================================================================================================================
// write() - write generic variable to chaincode state
// ============================================================================================================================
function write(name, val, cb){
	var options = {
		path: '/devops/invoke'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.name,
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

// ============================================================================================================================
// remove() - delete a generic variable from chaincode state
// ============================================================================================================================
function remove(name, cb){
	var options = {
		path: '/devops/invoke'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.name,
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

// ============================================================================================================================
// deply() - deploy chaincode, optional function to run
// ============================================================================================================================
function deploy(func, args, cb){
	var options = {path: '/devops/deploy'};
	var body = 	{
					type: "GOLANG",
					chaincodeID: {
							path: contract.cc.details.path
						}
				};
	
	if(func) {																//if function given, run it
		body.ctorMsg = 	{
							"function": func,
							"args": args
						};
	}
	options.success = function(statusCode, data){
		console.log("[obc-js] deploy - success:", data);
		contract.cc.details.name = data.message;
		if(cb){
			setTimeout( cb(null, data), 5000);								//wait extra long, not always ready yet
		}
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] deploy - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.post(options, '', body);
}

// ============================================================================================================================
// readNames() - read all variable names in chaincode state
// ============================================================================================================================
function readNames(cb, lvl){						//lvl is for reading past state blocks, tbd exactly
	var options = {
		path: '/devops/invoke'
	};
	var body = {
					chaincodeSpec: {
						type: "GOLANG",
						chaincodeID: {
							name: contract.cc.details.name,
						},
						ctorMsg: {
							function: "readnames",
							args: []
						}
					}
				};

	options.success = function(statusCode, data){
		console.log("[obc-js] ReadNames - success:", data);
		if(cb) cb(null, data.OK);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] ReadNames - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
		rest.post(options, '', body);
	
}

// ============================================================================================================================
// 														Helper Functions() 
// ============================================================================================================================

// ==================================================================
// populate_contract() - create JS call for custom goLang function, store in contract!
// ==================================================================
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
									name: contract.cc.details.name,
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


// ==================================================================
// eFmt() - format errors
// ==================================================================
function eFmt(name, code, details){
	return 	{
				name: String(name),
				code: Number(code),
				details: details
			};
}
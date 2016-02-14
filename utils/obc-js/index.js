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
								git_url: '',
								peers: [],
								vars: [],
								unzip_dir: '',
								zip_url: '',
					}
				};

function obc() {}
obc.selectedPeer = 0;
obc.q = [];
obc.lastPoll = 0;
obc.lastBlock = 0;
var tempDirectory = path.join(__dirname, "./temp");									//	./temp directory name


// ============================================================================================================================
// EXTERNAL - load() - wrapper on a standard startup flow.
// 1. load network peer data
// 2. register users with security (if present)
// 3. load chaincode and parse
// ============================================================================================================================
obc.prototype.load = function(options, cb){
	var errors = [];
	if(!options.network || !options.network.peers) errors.push("the option 'network.peers' is required");

	if(!options.chaincode || !options.chaincode.zip_url) errors.push("the option 'chaincode.zip_url' is required");
	if(!options.chaincode || !options.chaincode.unzip_dir) errors.push("the option 'chaincode.unzip_dir' is required");
	if(!options.chaincode || !options.chaincode.git_url) errors.push("the option 'chaincode.git_url' is required");
	if(errors.length > 0){															//check for input errors
		console.log('! [obc-js] Input Error - obc.load()', errors);
		if(cb) cb(eFmt('input error', 400, errors));
		return;																		//get out of dodge
	}
	
	// Step 1
	obc.prototype.network(options.network.peers);
	
	// Step 2 - optional - only for secure networks
	if(options.network.users){
		options.network.users = filter_users(options.network.users);				//do not use ids that are for the peers
		
		var arr = [];
		for(var i in chaincode.details.peers){
			arr.push(i);															//build the list of indexes
		}
		async.each(arr, function(i, a_cb) {
			if(options.network.users[i]){											//make sure we still have a user for this network
				obc.prototype.register(i, options.network.users[i].username, options.network.users[i].secret, a_cb);
			}
			else a_cb();
		}, function(err, data){
			load_cc();
		});
	}
	else{
		load_cc();
	}
	
	// Step 3
	function load_cc(){
		obc.prototype.load_chaincode(options.chaincode, cb);						//download/parse and load chaincode
	}
};

// ============================================================================================================================
// EXTERNAL - load_chaincode() - load the chaincode and parssssssssse
// 0. Load the github or zip
// 1. Unzip & scan directory for files
// 2. Iter over go files
// 		2a. Find Run() in file, grab variable for *simplechaincode
//		2b. Grab function names that need to be exported
//		2c. Create JS function for golang function
// 3. Call callback()
// ============================================================================================================================
obc.prototype.load_chaincode = function(options, cb) {
	var errors = [];
	if(!options.zip_url) errors.push("the option 'zip_url' is required");
	if(!options.unzip_dir) errors.push("the option 'unzip_dir' is required");
	if(!options.git_url) errors.push("the option 'git_url' is required");
	if(errors.length > 0){															//check for input errors
		console.log('! [obc-js] Input Error - obc.load_chaincode()', errors);
		if(cb) cb(eFmt('input error', 400, errors));
		return;																		//get out of dodge
	}
	
	var keep_looking = true;
	var zip_dest = path.join(tempDirectory,  '/file.zip');							//	./temp/file.zip
	var unzip_dest = path.join(tempDirectory,  '/unzip');							//	./temp/unzip
	var unzip_cc_dest = path.join(unzip_dest, '/', options.unzip_dir);				//	./temp/unzip/DIRECTORY
	chaincode.details.zip_url = options.zip_url;
	chaincode.details.unzip_dir = options.unzip_dir;
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
			console.log('[obc-js] Found chaincode in local file system');
			fs.readdir(unzip_cc_dest, cb_got_names);								//yeppers
		}
	}
	

	// Step 0.
	function download_it(download_url){
		console.log('[obc-js] Downloading zip');
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
			console.log('! [obc-js] Download error');
			fs.unlink(zip_dest); 													//delete the file async
			if (cb) cb(eFmt('fs error', 500, err.message), chaincode);
		});
	}
	
	// Step 1.
	function cb_downloaded(){
		console.log('[obc-js] Unzipping zip');
		var zip = new AdmZip(zip_dest);
		zip.extractAllTo(unzip_dest, /*overwrite*/true);
		console.log('[obc-js] Unzip done');
		fs.readdir(unzip_cc_dest, cb_got_names);
		fs.unlink(zip_dest, function(err) {});										//remove zip file, never used again
	}

	// Step 2.
	function cb_got_names(err, obj){
		console.log('[obc-js] Scanning files', obj);
		var foundGo = false;
		if(err != null) console.log('! [obc-js] fs readdir Error', err);
		else{
			for(var i in obj){
				if(obj[i].indexOf('.go') >= 0){										//look for GoLang files
					if(keep_looking){
						foundGo = true;
						fs.readFile(path.join(unzip_cc_dest, obj[i]), 'utf8', cb_read_go_file);
					}
				}
			}
		}
		if(!foundGo){
			var msg = 'did not find any *.go files, cannot continue';
			console.log('! [obc-js] Error - ', msg);
			if(cb) cb(eFmt('no chaincode', 400, msg), null);
		}
	}
	
	function cb_read_go_file(err, str){
		if(err != null) console.log('! [obc-js] fs readfile Error', err);
		else{
			
			// Step 2a.
			var regex = /func\s+\((\w+)\s+\*SimpleChaincode\)\s+Run/i;					//find the variable name that Run is using for simplechaincode pointer
			var res = str.match(regex);
			if(!res || !res[1]){
				var msg = 'did not find Run() function in chaincode, cannot continue';
				console.log('! [obc-js] Error -', msg);
				if(cb) cb(eFmt('missing run', 400, msg), null);
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
						populate_go_chaincode(temp);
					}
					
					// Step 3.
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
		console.log('! [obc-js] Input Error - obc.network()', errors);
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
					timeout: 60000,
					quiet: true
		});
	}
};


// ============================================================================================================================
// EXTERNAL - switchPeer() - switch the default peer to hit
// ============================================================================================================================
obc.prototype.switchPeer = function(index) {
	if(chaincode.details.peers[index]) {
		rest.init({																	//load default values for rest call to peer
					host: chaincode.details.peers[index].api_host,
					port: chaincode.details.peers[index].api_port,
					headers: {
								"Content-Type": "application/json",
								"Accept": "application/json",
							},
					ssl: chaincode.details.peers[index].ssl,
					timeout: 60000,
					quiet: true
		});
		obc.selectedPeer = index;
		return true;
	} else {
		return false;
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
		var fn = 'chaincode.json';														//default name
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
						},
						secureContext: chaincode.details.peers[obc.selectedPeer].user
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
						},
						secureContext: chaincode.details.peers[obc.selectedPeer].user
					}
				};
	
	options.success = function(statusCode, data){
		console.log("[obc-js] Write - success:", data);
		obc.q.push(Date.now());
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
						},
						secureContext: chaincode.details.peers[obc.selectedPeer].user
					}
				};

	options.success = function(statusCode, data){
		console.log("[obc-js] Remove - success:", data);
		obc.q.push(Date.now());
		if(cb) cb(null, data);
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Remove - failure:", statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.post(options, '', body);
}

//============================================================================================================================
//register() - register a username with a peer (only for a secured blockchain network)
//============================================================================================================================
obc.prototype.register = function(index, enrollID, enrollSecret, cb) {
	console.log("[obc-js] Registering ", chaincode.details.peers[index].name, " w/enrollID - " + enrollID);
	var options = {
		path: '/registrar',
		host: chaincode.details.peers[index].api_host,
		port: chaincode.details.peers[index].api_port,
		ssl: chaincode.details.peers[index].ssl
	};

	var body = 	{
					enrollId: enrollID,
					enrollSecret: enrollSecret
				};

	options.success = function(statusCode, data){
		console.log("[obc-js] Registration success:", enrollID);
		chaincode.details.peers[index].user = enrollID;							//remember the user for this peer
		if(cb){
			cb(null, data);
		}
	};
	options.failure = function(statusCode, e){
		console.log("[obc-js] Register - failure:", enrollID, statusCode);
		if(cb) cb(eFmt('http error', statusCode, e), null);
	};
	rest.post(options, '', body);
};

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
					},
					secureContext: chaincode.details.peers[obc.selectedPeer].user
				};
	//console.log('!body', body);
	options.success = function(statusCode, data){
		console.log("\n\n\t deploy success [wait 1 more minute]");
		chaincode.details.deployed_name = data.message;
		obc.prototype.save(tempDirectory);									//save it so we remember we have deployed
		if(save_path != null) obc.prototype.save(save_path);				//user wants the updated file somewhere
		if(cb){
			setTimeout(function(){
				console.log("[obc-js] Deploying Chaincode - Complete");
				cb(null, data);
			}, 35000);														//wait extra long, not always ready yet
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
//heart_beat() - interval function to poll against blockchain height (has fast and slow mode)
//============================================================================================================================
var slow_mode = 10000;
var fast_mode = 500;
function heart_beat(){
	if(obc.lastPoll + slow_mode < Date.now()){								//slow mode poll
		//console.log('[obc-js] Its been awhile, time to poll');
		obc.lastPoll = Date.now();
		obc.prototype.chain_stats(cb_got_stats);
	}
	else{
		for(var i in obc.q){
			var elasped = Date.now() - obc.q[i];
			if(elasped <= 3000){											//fresh unresolved action, fast mode!
				console.log('[obc-js] Unresolved action, must poll');
				obc.lastPoll = Date.now();
				obc.prototype.chain_stats(cb_got_stats);
			}
			else{
				//console.log('[obc-js] Expired, removing');
				obc.q.pop();												//expired action, remove it
			}
		}
	}
}

function cb_got_stats(e, stats){
	if(e == null){
		if(stats && stats.height){
			if(obc.lastBlock != stats.height) {									//this is a new block!
				console.log('[obc-js] New block!', stats.height);
				obc.lastBlock  = stats.height;
				obc.q.pop();													//action is resolved, remove
				if(obc.monitorFunction) obc.monitorFunction(stats);				//call the user's callback
			}
		}
	}
}

obc.prototype.monitor_blockheight = function(cb) {							//hook in your own function, triggers when chain grows
	setInterval(function(){heart_beat();}, fast_mode);
	obc.monitorFunction = cb;												//store it
};



//============================================================================================================================
//													Helper Functions() 
//============================================================================================================================
//populate_chaincode() - create JS call for custom goLang function, stored in chaincode var!
//==================================================================
function populate_go_chaincode(name){
	if(chaincode[name] != null){
		//console.log('[obc-js] \t skip, already exists');					//skip
	}
	else {
		console.log('[obc-js] Found cc function: ', name);
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
						},
						secureContext: chaincode.details.peers[obc.selectedPeer].user
					}
			};

			options.success = function(statusCode, data){
				console.log("[obc-js]", name, " - success:", data);
				obc.q.push(Date.now());
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
//filter_users() - remove users that are for the peers
//==================================================================
function filter_users(users){
	var valid_users = [];
	for(var i = 0; i < users.length; i++) {
		if(users[i].username.indexOf('user') == 0){
			valid_users.push(users[i]);
		}
	}
	return valid_users;
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

var fs = require('fs');
var nodegit = require("nodegit")
var path = require('path');
var rest = require(__dirname + "/lib/rest");
var https = require('https');
var promisify = require("promisify-node");

//PRIVATE!
var contract = null;


function obc() {
	  contract = {
			cc: {
				read: null,
				write: null,
				remove: null,
				deploy: null,
				readNames: null,
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
}

var cacheDirectory = path.normalize(__dirname + "/../../.obc-cache")

obc.prototype.load = function(url, subdir, callback)
{
	var repoDir = encodeURIComponent(url)
	var localDir = cacheDirectory + "/" + repoDir
	try{
		fs.mkdirSync(localDir);
	}
	catch(e)
	{
		if (e.code == "ENOENT")
		{
			console.log("[obc-js] Directory does not exist, cloning repository...")
			nodegit.Clone.clone(url, localDir, {
				fetchOpts: {
					callbacks: {
			            certificateCheck: function() {
			              return 1;
			            }
			          }
			        }
			      })
			  .then(function(repo) {
				  lookForGo(localDir, repo, subdir, callback)
			  })
			  .catch(function(reasonForFailure) {
				  console.log("[obc-js] An error occurred while cloning the repo: " + reasonForFailure)
			  })
		}
		else if (e.code == "EEXIST")
		{
			console.log("[obc-js] Directory exists, opening existing repository...")
			nodegit.Repository.open(localDir).then(function (repo) {
				lookForGo(localDir, repo, subdir, callback)
			})
			.catch(function (reasonForFailure) {
				console.log("An error occurred while opening the repo: " + reasonForFailure)
			});
		}
	}
}

function lookForGo(basePath, repository, subdir, callback) {
	console.log("[obc-js] Looking for Golang files in repository at " + basePath + ", within subdirectory: " + subdir)
	repository.getMasterCommit().then(function(firstCommitOnMaster) {
		return firstCommitOnMaster.getTree()
	})
	.then(function (tree) {
		var walker = tree.walk();
	    walker.on("entry", function(entry) {
	      if (entry.path().indexOf(subdir + "/") != -1 && entry.path().indexOf(".go") != -1)
	      {
	    	  console.log("[obc-js] Scanning file: " + entry.path())
	    	  fs.readFile(basePath + "/" + entry.path(), 'utf8', function (err, str) {
	    			if (err)
	    			{
	    				console.log("Error while reading file: " + err)
	    				return
	    			}
	    			else
	    			{
	    				var regex = /func\s+\((\w+)\s+\*SimpleChaincode\)\s+Run/i;					//find the variable name that Run is using for simplechaincode pointer
	    				var res = str.match(regex);
	    				var keep_looking = true;
	    				if(res[1] == null){
	    					console.log('[obc-js] error did not find variable name in chaincode');
	    				} //beneath here we did find variable names
	    				else{
	    					keep_looking = false;
	    					
	    					var re = new RegExp('\\s' + res[1] + '\\.(\\w+)\\(', "gi");
	    					res = str.match(re);
	    					if(res[1] == null){
	    						console.log('[obc-js] error did not find function names in chaincode');
	    					} //beneath here we did find functions
	    					else{
	    						
	    						for(var i in res){
	    							var pos = res[i].indexOf('.');
	    							var temp = res[i].substring(pos + 1, res[i].length - 1);
	    							console.log('[obc-js] Found function: ', temp);
	    							populate_go_contract(temp);
	    						} //for
	    						
	    						obc.prototype.save(); //save the prototype
	    						contract.cc.read = read
	    						contract.cc.write = write
	    						contract.cc.remove = remove
	    						contract.cc.deploy = deploy
	    						if(callback) 
	    							callback(null, contract);
	    					} //else functions found
	    				} //else variables found
	    			} //else file read successfully
	    		}) //end fs.readfile
	      	} //found go file in relevant subdir
	    }); //on entry

	    // Don't forget to call `start()`!
	    walker.start();
	})
	.catch(function (reasonForFailure) {
		console.log("An error occurred while opening the repo: " + reasonForFailure)
		return;
	})
	.done()
}

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
	}
	
obc.prototype.save =  function(cb){
		var dest = cacheDirectory + '/cc.json';
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
	}

	
module.exports = obc

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

//============================================================================================================================
//deply() - deploy chaincode, optional function to run
//============================================================================================================================
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

//============================================================================================================================
//readNames() - read all variable names in chaincode state
//============================================================================================================================
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


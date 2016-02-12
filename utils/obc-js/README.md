# obc-js
=========

A Node.js library for easier interaction with Open Blockchain chaincode

***

## Installation
- <strike>npm install obc-js --save</strike> [Update] for the time being manually download this directory to any projects, npm will be re-activated later - 1/27/2016

***

## Usage Steps!
(example code also provided below)
1. Require this module
1. Pass network + chaincode parameters to obc.load(options, my_cb):
1. Receive chaincode obj from callback to obc.load(). ie: my_cb(e, chaincode)
1. You can now deploy your chaincode (if needed) with chaincode.deploy(func, args, null, cb)
1. Use dot notation on chaincode to call any of your chaincode functions ie:

		chaincode.read('a', cb);			//will read variable "a" from current chaincode state
		chaincode.write('a', "test", cb)	//will write to vairable "a"
		chaincode.remove('a', cb)			//will delete variable "a"
		chaincode.init_marbles(ARGS, cb);	//calls my custom chaincode function init_marbles() and passes it ARGS
		
## Example

	// Step 1 ==================================
	var Obc1 = require('./utils/obc-js/index');
	var obc = new Obc1();
	var chaincode = {};

	// ==================================
	// configure obc-js sdk
	// ==================================
	var options = 	{
		network:{
			peers:   [{
				"api_host": "xxx.xxx.xxx.xxx",
				"api_port": "xxxxx",
				"id": "xxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx_vpx",
				"api_url": "http://xxx.xxx.xxx.xxx:xxxxx"
			}],
			users:  [{
				"username": "user1",
				"secret": "xxxxxxxx"
			}]
		},
		chaincode:{
			zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
			git_dir: 'marbles-chaincode-master/phase2',
			git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/phase2'
		}
	};
	
	// Step 2 ==================================
	obc.load(options, cb_ready);

	// Step 3 ==================================
	function cb_ready(err, cc){																//response has chaincode functions
		app1.setup(obc, cc);
		app2.setup(obc, cc);
	
	// Step 4 ==================================
		if(cc.details.deployed_name === ""){												//decide if i need to deploy or not
			cc.deploy('init', ['99'], './cc_summaries', cb_deployed);
		}
		else{
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			cb_deployed();
		}
	}

	// Step 5 ==================================
	function cb_deployed(err){
		console.log('sdk has deployed code and waited');
		chaincode.read('a');
	}
	
***
***

##OBC-JS Documentation
### obc.load(options, [callback])
This is a wrapper function that will run a typical startup setup. It will run in order:
1. obc.network()
2. obc.register() (only runs if options.network.users is != null)
3. obc.load_chaincode()
4. cb()

Options Parameter:

	var options = 	{
		network:{
			peers:   [{
				"api_host": "xxx.xxx.xxx.xxx",
				"api_port": "xxxxx",
				"api_url": "http://xxx.xxx.xxx.xxx:xxxxx"
				"id": "xxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx_vpx",
			}],
			users:  [{
				"username": "user1",
				"secret": "xxxxxxxx"
			}]
		},
		chaincode:{
			zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip', //http/https of a link to download zip (to do, change from zip download to git clone)
			git_dir: 'marbles-chaincode-master/phase2',                                        //name/path to folder that contains the chaincode you want to deploy (path relative to unzipped root)
			git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/phase2',             //git https clone URL. should contain the desired chaincode
			
			deployed_name: null                                                                //[optional] this is the hashed name of a deployed chaincode.  if you want to run with chaincode that is already deployed set it now, else it will be set when you deploy with the sdk
		}
	};


### obc.load_chaincode(options, [callback])
Load the chaincode you want to use. 
It wil be downloaded and parsed. 
The callback will receive (e, obj) where e is the error format and obj is the chaincode object.
The chaincode object will have dot notation to the functions in the chaincode.  
Example
	
	var options = 	{
		zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip', //http/https of a link to download zip (to do, change from zip download to git clone)
		git_dir: 'marbles-chaincode-master/phase2',                                        //name/path to folder that contains the chaincode you want to deploy (path relative to unzipped root)
		git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/phase2',             //git https clone URL. should contain the desired chaincode
		
		deployed_name: null                                                                //[optional] this is the hashed name of a deployed chaincode.  if you want to run with chaincode that is already deployed set it now, else it will be set when you deploy with the sdk
	};
	obc.load(options, cb_ready);


### obc.network(arrayPeers)
Set the information about the peers in the network.
This should be an array of peer objects.  
Example:

		var peers = [
			{
				"api_host": "xxx.xxx.xxx.xxx",
				"api_port": "xxxxx",
				"id": "xxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx_vpx",
				"api_url": "http://xxx.xxx.xxx.xxx:xxxxx"
			}
		]
		obc.network(peers);


### obc.save(path [callback])
Save the [Chaincode Summary File](#ccsf) to a path.


### obc.clear([callback])
Clear any loaded chaincode files including the downloaded chaincode repo, and [Chaincode Summary File](#ccsf).


### obc.chain_stats([callback])
Get statistics on the network's chain.  
Example Response:

	{
		"height": 10,
		"currentBlockHash": "n7uMlNMiOSUM8s02cslTRzZQQlVfm8wKT9FtL54o0ywy6BkvPMwSzN5R1tpquvqOwFFHyLSoW44n6rkFyvAsBw==",
		"previousBlockHash": "OESGPzacJO2Xc+5PB2zpmYVM8XlrwnEky0L2Ghok9oK1Lr/DWoxuBo2WwBca5zzJGq0fOeRQ7aOHgCjMupfL+Q=="
	}


### obc.block_stats(id, [callback])
Get statsitics on a particular block in the chain.  
Example Response:

	{
		"transactions": [
			{
				"type": 3,
				"chaincodeID": "EoABNWUzNGJmNWI1MWM1MWZiYzhlMWFmOThkYThhZDg0MGM2OWFjOWM5YTg4ODVlM2U0ZDBlNjNiM2I4MDc0ZWU2NjY2OWFjOTAzNTg4MzE1YTZjOGQ4ODY4M2Y1NjM0MThlMzMwNzQ3ZmVhZmU3ZWYyMGExY2Q1NGZmNzY4NWRhMTk=",
				"payload": "CrABCAESgwESgAE1ZTM0YmY1YjUxYzUxZmJjOGUxYWY5OGRhOGFkODQwYzY5YWM5YzlhODg4NWUzZTRkMGU2M2IzYjgwNzRlZTY2NjY5YWM5MDM1ODgzMTVhNmM4ZDg4NjgzZjU2MzQxOGUzMzA3NDdmZWFmZTdlZjIwYTFjZDU0ZmY3Njg1ZGExORomCgtpbml0X21hcmJsZRIHcng2YXRzcBIFZ3JlZW4SAjM1EgNCb2I=",
				"uuid": "b3da1d08-19b8-4d8c-a116-b46defb07a7c",
				"timestamp": {
					"seconds": 1453997627,
					"nanos": 856894462
				}
			}
		],
		"stateHash": "81ci8IAOeDh0ZwFM6hE/b3SfXt4tnZFemib7sI95cOsNcYMmtRxBWRBA7qnjPOCGU6snBRsFVnAliZXUigQ03w==",
		"previousBlockHash": "tpjUh4sgbaUQFO8wm8S8nrm7yCrBa4rphIiujfaYAlEVfzI8IZ0mjYMf+GiOZ6CZRNWPmf+5bekmGIfr0H6zdw==",
		"nonHashData": {
			"localLedgerCommitTimestamp": {
			"seconds": 1453997627,
			"nanos": 868868790
			}
		}
	}


### obc.switchPeer(peerIndex)
The SDK will default to use peer[0].  This function will switch the default peer to another index.  
Example:
	
	obc.switchPeer(2);
	
	
### obc.register(peerIndex, enrollID, enrollsecret, [callback])
Only applicable oo a network with security enabled. 
register() will register against peer[peerIndex] with the provided credentials.
If successful the peer will now use this enrollID to perform any http requests.
Example:
	
	obc.register(3, 'user1', 'xxxxxx', my_cb);

***
***

##Chaincode Functions
- Chaincode functions are dependent on actually be found inside your Go chaincode
- My advise is to build your chaincode off of the Marble Application one.  This way you get the basic CRUD functions below:

### chaincode.read(name [callback])
Read variable named 'name' from chaincode state

### chaincode.write(name, val, [callback])
Write 'val' to variable named 'name'

### chaincode.remove(name, [callback])
Delete variable named 'name'

### chaincode.deploy(func, args, [save_path], [callback])
Deploy the chaincode. 
Call GoLang function named 'func' and feed it 'args'.
Optionally save [Chaincode Summary File](#ccsf) to 'save_path'.

### chaincode.readNames([callback])
Return list of all known variables names in chaincode state

### chaincode.CUSTOM_FUNCTION_NAME(arg, [callback])
Will invoke your Go function CUSTOM_FUNCTION_NAME and pass it 'arg'

***
***

##Formats
### Chaincode Object

	chaincode = 
		{
			CUSTOM_FUNCTION_NAME1: function(args, cb){etc...};		//call chaincode function and pass it args
			CUSTOM_FUNCTION_NAME2: function(args, cb){etc...};
			CUSTOM_FUNCTION_NAME3: function(args, cb){etc...};
			^^ etc...
			read: function(name, cb, lvl),						//read variable
			write: function(name, value, cb),					//write/create variable
			remove: function(name, cb),							//delete variable
			deploy: function(func, arg, path, cb),				//deploy loaded chaincode
			readNames: function(cb, lvl),						//read all known variable names from state
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
		
### errors

	{
		name: "input error",
		code: 400,
		details: {msg: "did not provide git_url"}
	};
	
### <a name="ccsf"></a>Chaincode Summary File
This file is used internally. 
It is created in obc.load() and updated with chaincode.deploy().
A copy can be saved elsewhere with obc.save(path)

	{
	"details": {
		"deployed_name": "f6c084c42b3bde90c03f214ac6e0426e3e594807901fb1464287f2c3a18ade717bc495298958287594f81bb0d0cfdd3b4346d438d3b587d4fc73cf78ae8f7dfe",
		"func": ["init", "Delete", "Write", "init_marble", "set_user", "open_trade", "perform_trade", "remember_me"],
		"git_dir": 'marbles-chaincode-master/phase2',
		"git_url": 'https://github.com/ibm-blockchain/marbles-chaincode/phase2'
		"peers": [{
			"name": "vp1-xxx.xxx.xxx.xxx",
			"api_host": "xxx.xxx.xxx.xxx",
			"api_port": "xxx",
			"id": "xxxxx_vp1",
			"ssl": false,
			"user": "user1"
		}],
		"vars": [],
		"zip_url": 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
		}
	}

# obc-js.js
=========
(dsh to do - terrible name, change to obc.js)

A JS library for easier interaction with Open Blockchain chaincode

***

## Installation
- <strike>npm install obc-js --save</strike>
- for the time being manually download this directory to any projects, npm will be re-activated later - 1/27/2016

***

## Usage Steps!
(example code in next section below should be glanced at as you read these instructions)

1. Load the module
2. Pass the blockchain network JSON to obj.network() as an array of objects
3. Pass chaincode parameters to obc.load()
	###Option Fields: - obc.load(options, cb)
	- zip_url = [string] http/https of a link to download zip (to do, change from zip download to git clone)
	- git_dir = [string] name/path to folder that contains the chaincode you want to deploy (path relative to unzipped root)
	- git_url = [string] git https clone URL. should contain the desired chaincode
	- deployed_name = [string] [optional] this is the hashed name of a deployed chaincode.  if you want to run with chaincode that is already deployed set it now, else it will be set when you deploy with the sdk
4. receive chaincode obj from callback to obc.load(). ie: your_cb(e, chaincode)
5. use dot notation on chaincode to call any of your chaincode functions ie:

		chaincode.read('a', cb);						//will read variable "a" from current chaincode state
		chaincode.write('a', "test", cb)				//will write to vairable "a"
		chaincode.remove('a', cb)						//will delete variable "a"
		chaincode.init_marbles(ARGS, cb);				//calls my custom chaincode function init_marbles() and passes it ARGS
		
***

## Example

	// Step 1 ==================================
	var Obc1 = require('./utils/obc-js/index');
	var obc = new Obc1();
	var chaincode = {};

	// ==================================
	// load peers manually or from VCAP
	// ==================================
	var peers =     [
		{
			"discovery_host": "158.85.255.239",
			"discovery_port": "33096",
			"api_host": "158.85.255.239",
			"api_port": "33097",
			"id": "b6631eb8-9108-4d53-8202-8492d1d33a45_vp5",
			"api_url": "http://158.85.255.239:33097"
		}
		
		];

	if (process.env.VCAP_SERVICES){
		console.log("We are running in Cloud Foundry!");
		var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
		
		//old
		if(servicesObject && servicesObject['blockchain-staging'] && servicesObject['blockchain-staging'][0] && servicesObject['blockchain-staging'][0].credentials){
			console.log('loading peers from env: blockchain-staging');
			peers = servicesObject['blockchain-staging'][0].credentials.peers;
		}
		//new
		else if(servicesObject && servicesObject['ibm-blockchain-3-staging'] && servicesObject['ibm-blockchain-3-staging'][0] && servicesObject['ibm-blockchain-3-staging'][0].credentials){
			console.log('loading peers from env: ibm-blockchain-3-staging');
			peers = servicesObject['ibm-blockchain-3-staging'][0].credentials.peers;
		}
	}
	// Step 2 ==================================
	obc.network(peers);																		//setup network connection for rest endpoint

	// ==================================
	// configure obc-js sdk
	// ==================================
	var options = 	{
		zip_url: 'https://codeload.github.com/dshuffma-ibm/simplestuff/zip/master',
		git_dir: 'simplestuff-master',																		//subdirectroy name of chaincode after unzipped
		git_url: 'https://github.com/dshuffma-ibm/simplestuff',												//git clone http url
		
		//hashed cc name from prev deploy [IF YOU COMMENT LINE BELOW OUT IT WILL DEPLOY]
		deployed_name: '31bfa10d161e6b10a460335f90787d305f5ae775d83cf20a49f6b187e5e1e253585d6e377cc5386977260ba6144f75e2e334a23dc2a32ab867122a548c3e57c4'
	};
	// Step 3 ==================================
	obc.load(options, cb_ready);															//parse/load chaincode

	// Step 4 ==================================
	function cb_ready(err, cc){																//response has chaincode functions
		chaincode = cc;																		//copy to higher scope
		if(chaincode.details.deployed_name === ""){										//decide if i need to deploy
			chaincode.deploy('init', ['99'], './', cb_deployed);
		}
		else{
			obc.save('./');
			console.log('chaincode details indicates chaincode has been previously deployed');
		}
	}

	// Step 5 ==================================
	function cb_deployed(){
		console.log('sdk has deployed code and waited');
		chaincode.read('a');
	}

##OBC Functions
### obc.load(options, [callback])
Load the chaincode you want to use. 
It wil be downloaded and parsed. 
The callback will receive (e, obj) where e is the error format and obj is the chaincode object.
The chaincode object will have dot notation to the functions in the chaincode.

	var options = 	{
		zip_url: 'https://codeload.github.com/dshuffma-ibm/simplestuff/zip/master',
		git_dir: 'simplestuff-master',																		//subdirectroy name of chaincode after unzipped
		git_url: 'https://github.com/dshuffma-ibm/simplestuff',												//git clone http url
		
		//hashed cc name from prev deploy [IF YOU COMMENT LINE BELOW OUT IT WILL DEPLOY]
		deployed_name: '5e34bf5b51c51fbc8e1af98da8ad840c69ac9c9a8885e3e4d0e63b3b8074ee66669ac903588315a6c8d88683f563418e330747feafe7ef20a1cd54ff7685da19'
	};
	obc.load(options, cb_ready);

### obc.network(arrayPeers)
Set the information about the peers in the network.
This should be an array of peer objects.  
Example:

		var peers = [
			{
				"discovery_host": "xxx.xxx.xxx.xxx",
				"discovery_port": "xxxxx",
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
			"deployed_name": "5e34bf5b51c51fbc8e1af98da8ad840c69ac9c9a8885e3e4d0e63b3b8074ee66669ac903588315a6c8d88683f563418e330747feafe7ef20a1cd54ff7685da19",
			"func": ["init", "Delete", "Write", "ReadNames", "init_marble", "set_user", "remember_me"],
			"git_dir": "simplestuff-master",
			"git_url": "https://github.com/dshuffma-ibm/simplestuff",
			"peers": [
				{
					"discovery_host": "xxx.xxx.xxx.xxx",
					"discovery_port": "xxxxx",
					"api_host": "xxx.xxx.xxx.xxx",
					"api_port": "xxxxx",
					"id": "xxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx_vpx",
					"api_url": "http://xxx.xxx.xxx.xxx:xxxxx"
				}
			]
			"vars": [],
			"zip_url": "https://codeload.github.com/dshuffma-ibm/simplestuff/zip/master"
		}
	}


## SDK ToDo:
- [ ] need multi var read in sdk! ie read(["car1", "car2"]); ... what if we do a lot here, like SQL syntax?
- [x] remember the name of all the saved vars in cc
- [ ] ^^ and export this list so sdk can get it (needed?)
- [x] make sdk proper npm module
- [ ] change downloading zip to git clone
- [ ] mocha test for sdk
- [x] follow redirect on zip download...
- [x] sdk, check inputs on load if they  dne, error
- [x] add block stats to sdk
- [ ] rethink chaincode in general to make more structured, template form?, pick and choose base functions? forced base inheritance?
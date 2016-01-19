obc.js
=========

A set of libraries for easily interacting with Open Block Chain.

*Version*: 0.0.2
*Updated*: 01/15/2016

## Installation

  npm install obc-js --save


## Usage

```
  var obc = require('obc-js')
  
  console.log(obc.hello());

  npm test
```


## Examples

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

## Release History

* 0.0.1 Internal Dev Version
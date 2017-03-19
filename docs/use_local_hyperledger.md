#Use Local Hyperledger Network:

### Creating a Local Hyperledger Network
Use the published fabric docker images and docker-compose script to get a local network quickly.
<strike>
1. Follow the Fabric v1.0 [Hackfest setup instructions](http://hyperledger-fabric.readthedocs.io/en/latest/asset_setup/).
</strike>

^ New instructions coming soon...

### Finished
The network is all setup, right? 
So if you followed the Hackfest instructions exactly then your orderer will be batching new blocks every 10 seconds. 
This is a litttttle long for our application, and may give you unexpected behavior. 
Basicaly if you move a marble the trade will take 10 seconds to settle. 
The **UI may redraw the marble back in its original position**, and then jump to a correct position after some time.
This is normal and is because of a the long batch time. 

Next we need to **pass the location of our peer to our marbles application**.
This is done by editing the `/config/blockchain_creds1.json` file.

There are multiple credential files to show different setups. 
Marbles will open the file found in the environmental variable `creds_filename`. 
Gulp will set this for us based on what gulp task we tell it to do. 

This initial file (`marbles1.json`) points to our blockchain credentials file with the field "cred_filename". Thats the file that holds our network ips/hostnames/ports and other similar data. 

Next we must edit `blockchain_creds1.json` with information about your network.
Below is a sample showing the information that must be in the JSON file. 

__sample blockchain_creds1.json__

```js
{
	"credentials": {
		"network_id": "asdf",                  //not important atm
		"peers": [
			{
				"discovery": "grpc://192.168.99.100:8051", //must match the ip or hostname of your peer
				"events": "grpc://192.168.99.100:8053",    //must match the ip or hostname of your peer
				"msp_id": "Org1MSP"
			}
		],
		"cas": [
			{
				"api": "http://192.168.99.100:8054",    //must match the ip or hostname of your ca
				"msp_id": "Org1MSP",
				 "users": [
					{
						"enrollId": "admin",
						"enrollSecret": "adminpw"
					}
				]
			}
		],
		"orderers": [
			{
				"discovery": "grpc://192.168.99.100",    //must match the ip or hostname of your peer
				"msp_id": "Org1MSP"
			}
		],
		"app": {
			"channel_id": "mychannel",       //name of the blockchain channel
			"chaincode_id": "marbles",       //name of deployed chaincode
			"chaincode_version": "v0"
		}
	}
}
```

Remove any comments in your json file

**Do you see the "credentials" field in your json file?** 
It should be the outter most field like in the sample above. 
If its not there you need to add it such that `peers`, `cas` and etc are inside `credentials`.

Marbles only talks to 1 peer. 
Therefore, you should have 1 entry in the `peers` array and 1 entry in the `users` array. 
You will need to look up the default CA enroll ID/users for your Hyperledger Fabric version to populate the `users` array. 
Fabric version 0.7.0 enroll Ids can be found in the [cop.json](https://github.com/hyperledger/fabric-cop/blob/master/docker/fabric-cop/cop.json) file.

Example cop.json section:

```json
	"alice": {
      "pass": "alicepw",
      "type": "client",
      "group": "bank_a",
      "attrs": [{"name":"hf.Registrar.Roles","value":"client,peer,validator,auditor"}, {"name":"hf.Registrar.DelegateRoles", "value": "client"}]
    }
```

Maps to:

```json
{
	"enrollId": "alice",
	"enrollSecret": "alicepw"
}
```

Once you have edited `blockchain_creds1.json` you are ready to run Marbles. 

1. Continue where you left off in [tutorial 1](./tutorial_start_here.md#hostmarbles).

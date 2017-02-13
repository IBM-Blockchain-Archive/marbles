#Use Local Hyperledger Network:

### Creating a Local Hyperledger Network
There is a convenient docker-compose script that will get you a network very quickly.

1. Follow the docker compose [Setup Instructions](https://github.com/IBM-Blockchain/connectathon).

### Finished
The network is all setup, right?

Next we need to **pass the location of our peer to our marbles application**.
This is done by editing the `/config/mycreds.json` file.

There are multiple credential files to show different setups. 
Marbles will open the file found in the environmental variable `creds_filename`. 
Gulp will set this for us based on what gulp task we tell it to do. 
**Double check that [gulpfile.js](../gulpfile.js#L67) is using the mycreds.json filename.** 

```js
	gulp.task('start_marbles', function () {
		env['creds_filename'] = 'mycreds.json';
		console.log('\n[International Marbles Trading Consortium]\n');
	});
```

Next we must edit `mycreds.json` with information about your network.
Below is a sample showing the information that must be in the JSON file. 

__sample mycreds.json__

```js
{
    "credentials": {
        "network_id": "asdf",                  //not important atm
        "peers": [
            {
                "grpc_host": "192.168.99.100", //must match the ip or hostname of your peer
                "grpc_port": 7051,             //must match the gRPC port on your peer
                "type": "peer",                //leave this as peer
                "network_id": "asdf",          //not important atm
                "id": "peer1"                  //not important atm
            }
        ],
        "cas": [
            {
                "host": "192.168.99.100",    //must match the ip or hostname of your peer
                "port": 8888,                //must match the gRPC port on your peer
                "type": "ca",                //leave this as ca
                "network_id": "asdf"         //not important atm
				"id": "asdf-ca",             //not important atm
            }
        ],
        "orderers": [
            {
                "host": "192.168.99.100",    //must match the ip or hostname of your peer
                "port": 5151,                //must match the gRPC port on your peer
                "type": "orderer",           //leave this as ca
                "network_id": "asdf",        //not important atm
                "id": "orderer-01"           //not important atm
            }
        ],
        "users": [
            {
                "enrollId": "bob",,          //must match enroll ID found in COP
                "enrollSecret": "bobpw"      //must match enroll Secret found in COP
            }
        ],
        "cert": "https://blockchain-certs.mybluemix.net/us.blockchain.ibm.com.cert",
        "marbles": {
            "company": "Marble Market",      //name of marble company
            "chaincode_id": "marbles",       //name of deployed chaincode
            "usernames": [                   //marble owner usernames
                "amy",
                "bill"
            ],
            "port": 3000                     //port for marbles to use
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
You can omit the `users` array entirely if the network does not use a COP. 
The default docker-compose example does use a COP. 
You will need to look up the default COP enroll ID/users for your Hyperledger Fabric version to populate the `users` array. 
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

Once you have edited `mycreds.json` you are ready to run Marbles. 

1. Continue where you left off in [tutorial 1](./tutorial_part1.md#hostmarbles).

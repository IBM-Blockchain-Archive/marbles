#Use Local Hyperledger Network:

### Creating a Local Hyperledger Network
There is a convenient docker-compose image that will get you a network very quickly.

1. Follow the docker compose [Setup Instructions](https://hub.docker.com/r/ibmblockchain/fabric-peer).
1. Make sure your network is alive and reachable by testing the HTTP chain endpoint. To do this open your browser and browse to the peer.
	- If you are running Windows with docker-toolbox then click http://192.168.99.100:7050/chain
	- If you are running Linux/OS X/Windows 10 with native docker then click [http://localhost:7050/chain](http://localhost:7050/chain)
	- If you changed the default port for peer 0 then you will need to edit the URL above to use that port instead of `7050`.
1. You should see a response like:

	```json
	{
		"height": 1,
		"currentBlockHash": "lJ5dfqGBmhpkn1yHgbpbLnK9GEzrzsAnCm0AJZCIr0GaYznWDCt7j9yC09fGUe2MNXS+HEooKBbajHb+T40kIg==",
		"previousBlockHash": "UYTfnosVy6PqW59Gs4roQTLZ5av/t8sMrkWDKetAwFzoueZ3SkIcW6qPVLQPHuxCJO17AxLYsjzmYNN1fNtwFg=="
	}
	```

	- It will not be identical, but as long as you see some JSON response things are good and you can continue
	- If you get a timeout or some other error message then your network is not yet running or you are not entering the correct URL.


### Finished
The network is all setup. 

Next we need to **copy the peer data and pass it to our demo node.js application**.
This is done by editing the `mycreds_docker_compose.json` file which lives in the root of the marbles app.

We have added two mycreds files. 
One as a docker-compose example and one as a bluemix network example. 
Line 154 uses `mycreds_docker_compose.json` and should NOT be commented out. 
Line 155 with `mycreds_bluemix.json` should be commented out. 
**Double check that [app.js](../app.js#L154) is using the correct file.** 

All we must do is edit the file with information about your network.
If you want more details of setup options then take a look at the [SDK's documentation](https://github.com/IBM-Blockchain/ibm-blockchain-js).
Below is a sample showing the information that must be in the JSON file. 

You may see other example JSON files that include much more information. 
Those extra fields are either legacy or simply extra. 
You only need to set the fields that are in the sample below:

__sample mycreds.json__

```js
{
  "credentials": {
    "peers": [
      {
        "api_host": "192.168.99.100",         //replace with your hostname or ip of a peer
        "api_port_tls": 443,                  //replace with your https port (omit if NOT using tls)
        "api_port": 7050,                     //replace with your http port (omit if using tls)
        "id": "12345-_vp0"                    //unique name to identify peer (anything you want)
      }
    ],
    "users": [
      {
        "enrollId": "bob",                    //enroll username
        "enrollSecret": "NOE63pEQbL25 "       //enroll's secret
      }
    ]
  }
}
```

Remove any comments in your json file

**Do you see the "credentials" field in your json file?** 
It should be the outter most field like in the sample above. 
If its not there you need to add it such that `peers` and `users` are inside `credentials`.

Marbles only talks to 1 peer. 
Therefore, you should have 1 entry in the `peers` array and 1 entry in the `users` array. 
You can omit the `users` array entirely if the network does not use Membership Services. 
The default docker-compose example does use Membership Services. 
You will need to look up the default enroll ID/users for your Hyperledger Fabric version to populate the `users` array. 
Fabric version 0.6.1 enroll Ids can be found in the [membersrvc.yaml](https://github.com/hyperledger/fabric/blob/v0.6/membersrvc/membersrvc.yaml#L121) file.
(pick IDs that have a `1` next to the ID, not a `4`) 

Example membersrvc.yaml line:

	alice: 1 CMS10pEQlB16 bank_a

Maps to:

```json
{
	"enrollId": "alice",
	"enrollSecret": "CMS10pEQlB16"
}
```

You can omit the field `api_port_tls` if the network does not support TLS. 
The default docker-compose example does not support TLS. 
Once you have edited `mycreds_docker_compose.json` you are ready to run Marbles. 

1. Continue where you left off in [tutorial 1](./tutorial_part1.md#hostmarbles).

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
        "api_host": "12345678-abcde-_vp0.blockchain.ibm.com",//replace with your hostname or ip of a peer
        "api_port_tls": 443,                                 //replace with your https port (optional, omit if n/a)
        "api_port": 80,                                      //replace with your http port
        "id": "12345-_vp0"                                   //unique name to identify peer (anything you want)
      }
    ],
    "users": [
      {
        "enrollId": "user_type1_1234567890",                 //enroll username
        "enrollSecret": "1234567890"                         //enroll's secret
      }
    ]
  }
}
```

**Do you see the "credentials" field in your json file?** 
It should be the outter most field like in the sample above. 
If its not there you need to add it such that `peers` and `users` are inside `credentials`.

Marbles only talks to 1 peer. 
Therefore, you should have 1 entry in the `peers` array and 1 entry in the `users` array. 
You can omit the `users` array entirely if the network does not use Membership Services. 
If you created your own network, then you should look up the default users for your Hyperledger Fabric version. 
Fabric version 0.6.1 can be found in the [membersrvc.yaml](https://github.com/hyperledger/fabric/blob/v0.6/membersrvc/membersrvc.yaml#L121) file. 

You can omit the field `api_port_tls` if the network does not support TLS. 
If you are not using TLS you should also change the `options.tls` field to `false` on [line 200](../app.js#L221) of app.js.
All networks created with the Bluemix service will have Membership Services and support TLS exclusively. 
Once you have edited `mycreds_bluemix.json` you are ready to run Marbles. 

1. Continue where you left off in [tutorial 1](./tutorial_part1.md#hostmarbles).

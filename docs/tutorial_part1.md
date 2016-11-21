#Marbles Part 1 - Demo

##About Marbles
- The underlying network for this application is the [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), a Linux Foundation project.  You may want to review these instructions to understand a bit about the Hyperledger Fabric.
- **This demo is to aid a developer learn the basics of chaincode and app development with a Hyperledger network.**
- This is a `very simple` asset transfer demonstration. Two users can create and exchange marbles with each other.
- There will be multiple parts. Part 1 and 2 are complete [2/15/2016]

***

##Part 1 Goals
- User can create a marble and store it in the chaincode state
- User can read and display all marbles in the chaincode state
- User can transfer a marble to another user
- User can delete a marble
- Server pushes block/marble updates to client when a new block event has occurred
- Deployable on Bluemix

***

#Prereq:
1. I highly recommend you complete [learn chaincode](https://github.com/IBM-Blockchain/learn-chaincode) first
1. If you want to run Marbles on a local blockchain network (ie. not using Bluemix) you will need to have completed the Hyperledger Fabric [development setup](https://github.com/hyperledger/fabric/blob/master/docs/Setup/Network-setup.md).
1. [Node.js](https://nodejs.org/en/download/) 0.12.0+ and npm v2+ (only needed if you want to run the app locally, npm comes with node.js)
1. Node.js experience. Marbles is a very simple blockchain app but it’s still a fairly involved node app. **You should be comfortable with node** and the express module.
1. GoLang Environment (only needed to build your own chaincode, not needed if you just run the marbles app as is)

###Application Background
Hold on to your hats everyone, this application is going to demonstrate transferring marbles between two users leveraging IBM Blockchain.
We are going to do this in Node.js and a bit of GoLang. 
The backend of this application will be the GoLang code running in our blockchain network. 
From here on out the GoLang code will be referred to as 'chaincode' or 'cc'. 
The chaincode itself will create a marble by storing it to the chaincode state. 
The chaincode itself is able to store data as a string in a key/value pair setup. 
Thus, we will stringify JSON objects to store more complex structures. 

Attributes of a marble:

  1. name (unique string, will be used as key)
  1. color (string, css color names)
  1. size (int, size in mm)
  1. user (string)
	
We are going to create a Web UI that can set these values and pass them to the chaincode. 
Interacting with the cc is done with a HTTP REST call to a peer on the network. 
The ibc-js SDK will abstract the details of the REST calls away.
This allows us to use dot notation to call our GoLang functions (such as `chaincode.invoke.init_marble(args)`).

###Application Communication Flow

![](/doc_images/comm_flow.png)

1. The user will interact with our Node.js application in their browser.
1. This client side JS code will open a websocket to the backend Node.js application. The client JS will send messages to the backend when the user interacts with the site.
1. The backend Node.js will send HTTP requests (via the SDK) to a blockchain peer to carry out the user's actions.
1. The peer will communicate to its chaincode container at its leisure. Note that the previous HTTP request was really a 'submission' of chaincode to be run.  It will actually run at a later date (usually milliseconds).
1. The cc container will carry out the desired operation and record it to the ledger. ie create/transfer a marble.

###Context Clues
There are 3 distinct parts/worlds that you need to keep straight. 
They should be thought of as isolated environments that communicate over HTTP. 
This walk through will jump from one to another as we setup and explain each part. 
It's important to identify which part is which. 
There are certain keywords and context clues to help you identify one from another.

1. The Chaincode Part - This is GoLang code that runs on/with a peer on your blockchain network. Also, called `cc`. Anything blockchain happens here.
1. The Client Side JS Part - This is JavaScript code running in the user's browser. User interaction code happens here.
1. The Server Side JS Part - This is JavaScript code running our application's backend. ie `Node.js` code which is the heart of Marbles! Sometimes referred to as our `node` or `server` code. Functions as the glue between the user and our blockchain.

**It is recommended that you first run through the [Learn Chaincode](https://github.com/IBM-Blockchain/learn-chaincode) demo
to understand what chaincode is and how it's written, and set up your environment to run Marbles.**


# Marbles Setup Options:
Decide if you want to use the deploy to Bluemix button. 
Using the button will bypass all the setup below, but you will not have much control over the application. 
This is great for just seeing what marbles is, but you cannot easily play with the code. 

**Choose 1 option below:**

- **Option 1:**  [Button Instructions](./host_marbles_bluemix_button.md)
- **Option 2:** Follow these machine setup [instructions](https://github.com/IBM-Blockchain/learn-chaincode/blob/v2.0/docs/setup.md) to install **Git, Go** and **Node.js**.
	- When you have finished come back to this tutorial. Start the next section "Download Marbles" below.

### Download Marbles
We need to download marbles to your local system. 
Let’s do this with Git by cloning this repository. 
You will need to do this step even if you plan on hosting marbles in Bluemix.

- Open a command prompt/terminal and browse to your desired working directory
- Run the following command:

```
git clone http://gopkg.in/ibm-blockchain/marbles.v2
```

- This will clone the v2.0 branch to your local system. 

### Get a Network
<a name="getnetwork"></a> Now we need a blockchain network.

**Choose 1 option below:**

- **Option 1:** Create a Bluemix IBM Blockchain network - [instructions](./use_bluemix_hyperledger.md)
- **Option 2:** Use a locally hosted Hyperledger Network (such as one from docker-compose) - [instructions](./use_local_hyperledger.md)

### Host Marbles
<a name="hostmarbles"></a>Finally we need marbles running somewhere.

**Choose 1 option below:**

- **Option 1:** Host marbles on Bluemix - [instructions](./host_marbles_bluemix.md)
- **Option 2:** Host marbles locally - [instructions](./host_marbles_locally.md)

***


#<a name="use"></a>Use Marbles App
1. Open up your browser and browse to [http://localhost:3000](http://localhost:3000) or your Bluemix www route.
1. You should be staring at our Marbles Part 1 application
	- Part 2 can be found at [http://localhost:3000/p2](http://localhost:3000/p2), but lets stay on Part 1 for now  
1. Finally we can test the application. Click the "Create" link on the top navigation bar
1. Fill out all the fields, then click the "Create" button
1. It should have flipped you back to "Home" and you should see that a new marble has been created
	- If not click the "Home" tab again or refresh the page
1. Next let’s trade a marble.  Click and drag one marble from one person's list to another. It should temporary disappear and then auto reload the marbles in their new state. 
	- If not refresh the page
1. Congratulations you have a working marbles application :)!


#SDK / IBM Blockchain Deeper Dive
Before we examine how marbles works let’s examine what the SDK did to get our cc onto the network.
The options argument for `ibc.load(options)` contains many important things. 
An abbreviated version is below:

```js
	//note the marbles code will populates network.peers & network.users from VCAP Services (an env variable when running the app in Bluemix)
	var options = 	{
		network:{
			peers:   [{
				"api_host": "xxx.xxx.xxx.xxx",
				"api_port": "xxxxx",
				"api_url": "http://xxx.xxx.xxx.xxx:xxxxx"
				"id": "xxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx_vpx",
			}],
			users:  [{
				"enrollId": "xxx",
				"enrollSecret": "xxxxxxxx"
			}]
		},
		chaincode:{
			zip_url: 'https://github.com/ibm-blockchain/marbles/archive/v2.0.zip', //http/https of a link to download zip
			unzip_dir: 'marbles-2.0/chaincode',                                    //name/path to folder that contains the chaincode you want to deploy (path relative to unzipped root)
			git_url: 'http://gopkg.in/ibm-blockchain/marbles.v2/chaincode',        //GO get https URL. should point to the desired chaincode repo AND directory
		}
	};
	ibc.load(options, cb);
```

This network has membership security; we can tell because there are enroll IDs/secrets in the `network.users` array. 
This means the peers will be expecting a validated `enrollId` on most API requests. 
Therefore, the first step is we need to use the /registrar API endpoint to register an `enrollId`. 
This creates a binding of sorts between the ID and the peer such that this `enrollId` cannot be used on any other peer. 
It's relatively safe to think of this step as registering an API key with a particular peer. 
The SDK does almost all the work here for us. 
It will first parse `network.peers[]` and `network.users[]` and run 1 POST /registrar HTTP request per peer. 
It will send the first `enrollId` to the first peer, and the second ID to the second peer and so on until every peer has 1 ID. 
The details of all rest calls are taken care of by the SDK but if you are curious we have [Swagger Documentation](https://obc-service-broker-prod.mybluemix.net/swagger) on the IBM Blockchain peer APIs. 
At the end of this step we are ready to deploy our chaincode. 

Before we deploy though, the SDK will download and parse the chaincode. 
This is when it builds up the dot notation we can use to ultimately call cc functions from JS. 
Once it’s done downloading/parsing it runs the deploy HTTP request. 
We should receive a hash in the response that is unique to this chaincode. 
This hash will be used along with the registered `enrollId` in all future invocations / queries against this cc. 


#Marbles Deeper Dive
Hopefully you have successfully traded a marble or two between users. 
Let’s look at how this was done by starting at the chaincode.

__set_user()__

```js
	type Marble struct{
		Name string `json:"name"`
		Color string `json:"color"`
		Size int `json:"size"`
		User string `json:"user"`
	}

	// ============================================================================================================================
	// Set User Permission on Marble
	// ============================================================================================================================
	func (t *SimpleChaincode) set_user(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
		var err error
		
		//   0       1
		// "name", "bob"
		if len(args) < 2 {
			return nil, errors.New("Incorrect number of arguments. Expecting 2")
		}
		
		fmt.Println("- start set user")
		fmt.Println(args[0] + " - " + args[1])
		marbleAsBytes, err := stub.GetState(args[0])
		if err != nil {
			return nil, errors.New("Failed to get thing")
		}
		res := Marble{}
		json.Unmarshal(marbleAsBytes, &res)       //un stringify it aka JSON.parse()
		res.User = args[1]                        //change the user
		
		jsonAsBytes, _ := json.Marshal(res)
		err = stub.PutState(args[0], jsonAsBytes) //rewrite the marble with id as key
		if err != nil {
			return nil, err
		}
		
		fmt.Println("- end set user")
		return nil, nil
	}
```

This `set_user()` function takes in an array of strings argument. 
Within the array the first index should have the name of the marble key/value pair. 
We retrieve the marble's struct with `stub.GetState(args[0])` and then unmarshal it into a Marble structure. 
From there we can index into the structure with `res.User` and overwrite the marble's owner with the new username.
Next we Marshal the structure back up so that we can use `stub.PutState()` to overwrite the marble with its new details. 

This is a `very` simplistic way to change ownership of an asset. 
The concept of an "owner" is simply the value of a string inside the marble's structure. 
We will explore more sophisticated methods in Marbles Part 3.


Let’s take 1 step up and look at how this chaincode was called from our node.js app. 

__/utils/ws_part1.js__

```js
	module.exports.process_msg = function(ws, data){
		if(data.v === 1){
			if(data.type == 'create'){
				console.log('its a create!');
				if(data.name && data.color && data.size && data.user){
					chaincode.invoke.init_marble([data.name, data.color, data.size, data.user], cb_invoked);
				}
			}
			else if(data.type == 'get'){
				console.log('get marbles msg');
				chaincode.query.read(['_marbleindex'], cb_got_index);
			}
			else if(data.type == 'transfer'){
				console.log('transfering msg');
				if(data.name && data.user){
					chaincode.invoke.set_user([data.name, data.user]);
				}
			}
		...
```

The `chaincode.invoke.set_user([data.name, data.user]);` line is where we submit our request to run the chaincode function. 
It is passing to our GoLang `set_user` function an array of strings argument containing the name of the marble and the name of its new owner. 
By "passing" I mean it is really sending a HTTP POST `/chaincode` invoke request to one of the peers in our network. 
This peer will in turn call the chaincode and actually pass the argument to the cc function. 
The details of which peer and the exact rest call are taken care of in our ibc-js SDK. 
For your own curiosity, the details of the Invoke API call can be found [here](https://github.com/hyperledger/fabric/blob/master/docs/API/CoreAPI.md#chaincode)
This code itself was called in response to a websocket message that originated on our user's browser.

Pretty simple, now let’s look 1 more step up to how we sent this websocket message.

__/public/js/part1.js__

```js
	$("#user2wrap").droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER2){
				$(ui.draggable).addClass("invalid");		//make the marble transparent to reflect a pending action
				transfer($(ui.draggable).attr('id'), bag.setup.USER2);
			}
		}
	});

	...

	function transfer(marbleName, user){
		if(marbleName){
			console.log('transfering', marbleName);
			var obj = 	{
							type: "transfer",
							name: marbleName,
							user: user,
							v: 1
						};
			ws.send(JSON.stringify(obj));
			showHomePanel();
		}
	}
```

We used jQuery and jQuery-UI to implement the drag and drop functionality. 
With these tools, we get a droppable event trigger. 
In the above code, we have attached it to #user2wrap and #user1wrap div elements. 
When the event fires we first check to see if this marble actually moved owners, or if it was just picked up and dropped back down. 
If its owner has changed we go off to the `transfer()` function.
This function creates a JSON message with all the needed data and uses our websocket to send it with `ws.send()`.

__Monitor-Blockheight__

Our Node.js SDK has a handy function called. `monitor_blockheight(cb)`. 
To use it we just pass it what function we want to be called whenever the SDK notices a new block has been written to the network. 
The plan is to use this event as a trigger to redraw the marble states. 

The Plan:

1. User trades a marble
1. At some point that event will be written to a block
1. The SDK detects a new block has been written
1. Let’s assume this new block contains our user's trade action, therefore let’s read all marble states
1. Broadcast the marble states to any connected websockets
1. Clients (aka browsers) receive the new marble states and redraw them

__./app.js__ (abbreviated)

```js
	// ========================================================
	// Monitor the height of the blockchain
	// ========================================================
	ibc.monitor_blockheight(function(chain_stats){
		if(chain_stats && chain_stats.height){
			console.log('hey new block, lets refresh and broadcast to all');
			ibc.block_stats(chain_stats.height - 1, cb_blockstats);
			wss.broadcast({msg: 'reset'});
			chaincode.query.read(['_marbleindex'], cb_got_index);
			chaincode.query.read(['_opentrades'], cb_got_trades);
		}
		
		//got the block's stats, lets send the statistics
		function cb_blockstats(e, stats){
			if(e != null) console.log('error:', e);
			else {
				if(chain_stats.height) stats.height = chain_stats.height - 1;
				wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
			}
		}
		
		//got the marble index, lets get each marble
		function cb_got_index(e, index){
			if(e != null) console.log('error:', e);
			else{
				try{
					var json = JSON.parse(index);
					for(var i in json){
						console.log('!', i, json[i]);
						chaincode.query.read([json[i]], cb_got_marble);
					}
				}
				catch(e){
					console.log('marbles index msg error:', e);
				}
			}
		}
		
		//call back for getting a marble, lets send a message
		function cb_got_marble(e, marble){
			if(e != null) console.log('error:', e);
			else {
				try{
					wss.broadcast({msg: 'marbles', marble: JSON.parse(marble)});
				}
				catch(e){
					console.log('marble msg error', e);
				}
			}
		}
		...
	}
```

So this code is using the SDK's function `monitor_blockheight()`. 
It’s a straight forward function in that its only argument is a callback function you want called when the SDK notices a new block. 
Our code then goes off and starts 4 things.

1. It fires off a request to the peer to read the block's stats
1. It sends a reset UI message to all clients through the websocket
1. It fires off a request to the cc to read marble index and then reads each marble
1. It fires off a request to the cc to read the open trades (used in Part 2)

The results will then be sent to the clients via the websocket (in individual messages). 
One more small note is about this line `stats.height = chain_stats.height - 1;`. 
We subtract 1 because the API `/chain` tells me the number of blocks.
But the API `/chain/blocks/<block #>` takes the id of a block which is indexed to 0.
So, if we want details on blockheight #5, we build a request for `/chain/blocks/4`.


That’s it! Hope you had fun trading some marbles in part 1. 
Next up is [Marbles Part 2](./tutorial_part2.md). 
Part 2 adds some new chaincode functions making it a little niftier.

***

#Trouble Shooting
Stuck? Try my handy [trouble shooting guide](./i_lost_my_marbles.md).

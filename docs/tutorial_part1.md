# Marbles - Demo

## About Marbles
- The underlying network for this application is the [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), a Linux Foundation project.  You may want to review these instructions to understand a bit about the Hyperledger Fabric.
- **This demo is to aid a developer learn the basics of chaincode and app development with a Hyperledger network.**
- This is a `very simple` asset transfer demonstration. Two users can create and exchange marbles with each other.

***

##Marbles Goals
- User can create a marble and store it in the chaincode state
- User can read and display all marbles in the chaincode state
- User can transfer a marble to another user
- User can delete a marble
- Server pushes block/marble updates to client when a new block event has occurred
- Deployable on Bluemix

***

# Prereq:
1. I highly recommend you complete [learn chaincode](https://github.com/IBM-Blockchain/learn-chaincode) first
1. If you want to run Marbles on a local blockchain network (ie. not using Bluemix) you will need to have completed the Hyperledger Fabric [development setup](https://github.com/hyperledger/fabric/blob/master/docs/Setup/Network-setup.md).
1. [Node.js](https://nodejs.org/en/download/) 0.12.0+ and npm v2+ (only needed if you want to run the app locally, npm comes with node.js)
1. Node.js experience. Marbles is a very simple blockchain app but it’s still a fairly involved node app. **You should be comfortable with node** and the express module.
1. GoLang Environment (only needed to build your own chaincode, not needed if you just run the marbles app as is)

### Application Background
Hold on to your hats everyone, this application is going to demonstrate transferring marbles between many marble owners leveraging Hyperledger.
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
  1. owner (string)
	
We are going to create a Web based UI that can set these values and store them in our blockchain. 
The marble gets created in the blockchain database aka ledger as a key value pair. 
The `key` is the marble name, and the `value` is a JSON string containing the attributres of the marble (listed above). 
Interacting with the cc is done by using the gRPC proptocol to a peer on the network. 
The details of the gRPC protocol are taken care of by the HFC SDK (Hyperledger Fabric Client SDK). 
Check the picture below for details. 

### Application Communication Flow

![](/doc_images/comm_flow.png)

1. The user will interact with our Node.js application in their browser. 
1. This client side JS code will open a websocket to the backend Node.js application. The client JS will send messages to the backend when the user interacts with the site.
1. A query or invocation is formally known as a proposal.  This proposal is built via the HFC SDK and then sent to a blockchain peer to carry out the user's actions. 
1. The peer will communicate to its chaincode container. It will simulate the invocation and if there are no issues it will endorse the transaction.
1. The peer will send the endorsed proposal to the ordering service.  The orderer will package many proposals into a block.  Then it will broadcast the new block to the peers in the network. 
1. Finally the peer will validate the block and write it to its ledger.

### Context Clues
There are 3 distinct parts/worlds that you need to keep straight. 
They should be thought of as isolated environments that communicate with eachother. 
This walk through will jump from one to another as we setup and explain each part. 
It's important to identify which part is which. 
There are certain keywords and context clues to help you identify one from another.

1. The Chaincode Part - This is GoLang code that runs on/with a peer on your blockchain network. Also, called `cc`. All marbles/blockchain interactions ultimately happen here.
1. The Client Side JS Part - This is JavaScript code running in the user's browser. User interface interaction happens here.
1. The Server Side JS Part - This is JavaScript code running our application's backend. ie `Node.js` code which is the heart of Marbles! Sometimes referred to as our `node` or `server` code. Functions as the glue between the marble admin and our blockchain.

**It is recommended that you first run through the [Learn Chaincode](https://github.com/IBM-Blockchain/learn-chaincode) demo
to understand what chaincode is and how it's written, and set up your environment to run Marbles.**


# Marbles Setup Options:
<strike>
Decide if you want to use the deploy to Bluemix button. 
Using the button will bypass all the setup below, but you will not have much control over the application. 
This is great for just seeing what marbles is, but you cannot easily play with the code. 
</strike> 

**Update:** *this version of marbles is not yet compatible with the deploy to bluemix buttons*

**Choose 1 option below:**

- <strike>**Option 1:**  [Button Instructions](./host_marbles_bluemix_button.md)</strike>
- **Option 2:** Follow these machine setup [instructions](https://github.com/IBM-Blockchain/learn-chaincode/blob/v2.0/docs/setup.md) to install **Git, Go** and **Node.js**.
	- When you have finished come back to this tutorial. Start the next section "Download Marbles" below.

### Download Marbles
We need to download marbles to your local system. 
Let’s do this with Git by cloning this repository. 
You will need to do this step even if you plan on hosting marbles in Bluemix.

- Open a command prompt/terminal and browse to your desired working directory
- Run the following command:

```
git clone http://gopkg.in/ibm-blockchain/marbles.v3
```

- This will clone the v3.0 branch to your local system. 

### Get a Network
<a name="getnetwork"></a> Now we need a blockchain network.

**Choose 1 option below:**

<strike>
- **Option 1:** Create a Bluemix IBM Blockchain network - [instructions](./use_bluemix_hyperledger.md)
</strike>
- **Option 2:** Use a locally hosted Hyperledger Network (such as one from docker-compose) - [instructions](./use_local_hyperledger.md)

### Host Marbles
<a name="hostmarbles"></a>Finally we need marbles running somewhere.

**Choose 1 option below:**

- **Option 1:** Host marbles on Bluemix - [instructions](./host_marbles_bluemix.md)
- **Option 2:** Host marbles locally - [instructions](./host_marbles_locally.md)

***


#<a name="use"></a>Use Marbles App
1. Open up your browser and browse to [http://localhost:3000](http://localhost:3000) or your Bluemix www route.
1. Finally we can test the application. Click the "+" icon on one of your users in the "United Marbles" section

![](/doc_images/use_marbles1.png)

1. Fill out all the fields, then click the "CREATE" button
1. After 1-2 seconds your new marble should have appeared.
	- If not refresh the page
1. Next let’s trade a marble.  Drag and drop a marble from one owner to another. Only trade it to owners within "United Marbles" if you have multiple marble companies. It should temporary disappear and then redraw the marble within its new owner. 
	- If not refresh the page
1. Now lets delete a marble by dragging and dropping it into the trash can. It should disappear after 1-2 seconds.

![](/doc_images/use_marbles2.png)

1. Refresh the page to double check that your actions "stuck". 
1. The search box will filter on marble owners or marble company names.  This is helpful when there are many companies/owners. 
	- The pin icon will prevent that user from being filtered out by the search box. 
1. Congratulations you have a working marbles application :)! 


# Blockchain Background
Before we talk about how Marbles works lets discuss the flow and topology of Hyperledger Fabric. 
Lets get some definitions out of the way first.

###Definitions:

**Peer** - A peer is a member of the blockchain and is running Hyperledger Fabric. From marble's context the peers are owned and operated by my marble company.

**COP** - The COP is responsible for gatekeeping our blockchain network. It will provide transaction certificates for clients such as our marbles node.js application. 

**Orderer** - An orderer or ordering service is a member of the blockchain network who's main reponsoiblity is to package transactions into blocks.

**Users** - A user is an entity that is authorized to interact with the blockchain. In the Marbles context this is our admin. The user can query and write to the ledger.

**Blocks** - Blocks contain transactions and a hash to verify integrity.

**Transactions** or **Proposals** - These represent interactions to the blockchain ledger. A read or write request of the ledger is sent as a transaction/proposal.

**Ledger** - This is the storage for the blockchain on a peer. It contains the actual block data which consist of transaction parameters and key value pairs. It is written by chaincode.

**Assets** - An asset is an entity that exists in the ledger. Its a key value pair. In the context of marbles this is a marble, or a marble owner. 

**Chaincode** - Chaincode is our word for smart contracts. It defines the assets and all rules about assets.

Lets look at the operations involved when creating a new marble.

1. The first thing that happens in marbles is registering our admin `user` with our network's `COP`. If successful the `COP` will send Marbles transaction certificates that the SDK will store for us in our local file system. 
1. When the admin creates a new marble from the user interface the SDK will create an invocation transaction.
1. This create marble transaction gets built as a `proposal` to invoke the chaincode function `init_marble()`. The `proposal` was created in part by signing transaction certificates that were generted from our networks COP.
1. Marbles (via the SDK) will send this `proposal` to a `peer` for endorsement. 
1. The `peer` will simulation the transaction by running the go function `init_marble()` and record any changes it attempted to write to the `ledger`. 
1. If the function returns successfully the `peer` will endorse the `proposal` and send it back to Marbles. Errors will also be sent back, but they will not be endorsed.
1. Marbles (via the SDK), will then send the endorsed `proposal` to the `orderer`. 
1. The `orderer` will organize a sequence of `proposals` from the whole network. It will check the sequence of transactions is valid by looking for transactions that conflict with eachother. Any transactions that cannot be added to the block because of conflicts will be marked as errors. The `orderer` will broadcast the new block to all peers.
1. Our `peer` will receive the new block and validate it by looking at various signatures and hashes. It is then finally committed to the `peer's` `ledger`.
1. At this point the new marble exists in our ledger and should soon exist in all peer's ledgers.


#HFC SDK Deeper Dive
Now lets how we configured the SDK and what it did for us. 
Most of the config options can be found in `/config/mycreds.json`. 
This file list the hostname/ip and port of various components of our blockchain network. 

### Configure HFC (SDK):
Next we need to send these fields to the SDK.

```js
	var utils = require('./utils/hfc/lib/utils.js');    //create instance
	var chain = hfc.newChain('mychain');

	chain.setOrderer(orderer_url);                      //configure
	var keyValueStoreObj =	 {
								path: path.join(__dirname, './keyValStore-' + file_safe_name(process.env.marble_company) + '-' + uuid) 
							};
	chain.setKeyValueStore(hfc.newKeyValueStore(keyValueStoreObj));
	chain.setMemberServicesUrl(cop_url);
```

1. The first thing the code does is create an instance of HFC, our SDK.
1. Next important part is to set the orderer's address.
1. Then set the key value store folder location.
	- the key value store location will be the folder containg our admin's certificates
1. Then set the COP's address.

```js
	chain.enroll(id, secret).then(
		function(enrolledUser) {
			console.log('Successfully enrolled ' + id);
			webUser = enrolledUser;									//push var to higher scope
			broadcast_state('enrolled');
			setTimeout(function(){
				if(cb) cb();
			}, block_delay);
		}
	).catch(
		function(err) {												//error with enrollment
			console.log('Failed to enroll ' + id, err.stack ? err.stack : err);
			broadcast_state('failed_enroll');
			if(cb) cb(err);
		}
	);
```

1. Finally we enroll our admin. This is when we authenticte to the COP with our enroll ID and enroll Secret. The COP will issue transactions certificates which HFC will store in the key value store location.
1. After succssful enrollment HFC is fully configured and ready to interact with the blockchain.


#Marbles Deeper Dive
Hopefully you have successfully traded a marble or two between users. 
Let’s look at how this was done by starting at the chaincode.

__set_user()__

```js
	type Marble struct {
		ObjectType string        `json:"docType"`
		Name       string        `json:"name"`     //the fieldtags are needed to keep case from bouncing around
		Color      string        `json:"color"`
		Size       int           `json:"size"`
		Owner      OwnerRelation `json:"owner"`
	}

	// ============================================================================================================================
	// Set Owner Permission on Marble
	// ============================================================================================================================
	func set_owner(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
		var err error
		fmt.Println("starting set_owner")

		//   0   ,     1  ,        2                 3
		// marble, to user,       to company,  company that auth the transfer
		// "name",   "bob", "united_marbles", "united_mables" 
		if len(args) < 4 {
			return nil, errors.New("Incorrect number of arguments. Expecting 4")
		}

		var marble_id = args[0]
		var new_user = strings.ToLower(args[1])
		var new_company = args[2]
		var authed_by_company = args[3]
		fmt.Println(marble_id + "->" + new_user + " - " + new_company + "|" + authed_by_company)

		// get marble's current state 
		marbleAsBytes, err := stub.GetState(marble_id)
		if err != nil {
			return nil, errors.New("Failed to get marble")
		}
		res := Marble{}
		json.Unmarshal(marbleAsBytes, &res)          //un stringify it aka JSON.parse()

		//check authorizing company
		if res.Owner.Company != authed_by_company{
			return nil, errors.New("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.")
		}

		//transfer the marble
		res.Owner.Username = new_user                 //change the owner
		res.Owner.Company = new_company               //change the owner
		jsonAsBytes, _ := json.Marshal(res)
		err = stub.PutState(args[0], jsonAsBytes)     //rewrite the marble with id as key
		if err != nil {
			return nil, err
		}

		fmt.Println("- end set owner")
		return nil, nil
	}
```

This `set_users()` function will change the owner of a particular marble. 
It takes in an array of strings input argument and returns `nil, nil` if successful. 
Within the array the first index should have the name of the marble which is also the key in the key/value pair. 
We first need to retrieve the current marble struct. 
This is done with `stub.GetState(marble_id)` and then unmarshal it into a marble structure with `json.Unmarshal(marbleAsBytes, &res)`.
From there we can index into the structure with `res.Owner.Username` and overwrite the marble's owner with the new username and company.
Next we Marshal the structure back up so that we can use `stub.PutState()` to overwrite the marble with its new attributes. 

Let’s take 1 step up and look at how this chaincode was called from our node.js app. 

__/utils/websocket_server_side.js__

```js
	ws_server.process_msg = function(ws, data){
		var options = {};
		if(marbles_lib === null) {
			console.log('error! marbles lib is null...');				//can't run in this state
			return;
		}
			
		// create a new marble
		if(data.type == 'create'){
			console.log('[ws] create marbles req');
			options = [data.name, data.color, data.size, data.username, data.company, process.env.marble_company];
			marbles_lib.create_a_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], ws, options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}

		//transfer a marble
		else if(data.type == 'transfer_marble'){
			console.log('[ws] transfering req');
			options = [data.name, data.username, data.company, process.env.marble_company];
			marbles_lib.set_marble_owner(webUser, [hfc.getPeer(helper.getPeersUrl(0))], ws, options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}
		...
```

This function snippet `process_msg()` is sent all websocket messages (code is in app.js). 
`process_msg()` will detect what type of message was sent. 
In our case it should detect a `transfer_marble` type. 
This is the function that will tell the SDK to build the proposal and kick off this whole thing.

__/utils/marbles_cc_lib/marbles.js__

```js
	//-------------------------------------------------------------------
	// Set Marble Owner 
	//-------------------------------------------------------------------
	marbles.set_marble_owner = function (webUser, peerUrls, ws, options, cb) {
		console.log('\nsetting marble owner...');

		// send proposal to endorser
		var request = {
			targets: peerUrls,
			chaincodeId: chaincode_id,
			fcn: 'set_owner',
			args: options               //args == ["name", "bob", "united_marbles", "united_marbles"]
		};
		webUser.sendTransactionProposal(request)
		...
```

The important parts of `set_marble_owner()` are above. 
It is setting the proposals invocation function name to "set_user" with the line `fcn: 'set_user'`. 
It is also setting other imporant fields such as the address/port to our peer, the chaincode id, and the arguments that our chaincode function is expecting. 

Now let’s look 1 more step up to how we sent this websocket message.

__/public/js/ui_building.js__

```js
	$('.innerMarbleWrap').droppable({drop:
		function( event, ui ) {
			var marble_id = $(ui.draggable).attr('id');

			//  ------------ Delete Marble ------------ //
			if($(event.target).attr('id') === 'trashbin'){
				//removed
			}

			//  ------------ Transfer Marble ------------ //
			else{
				var dragged_user = $(ui.draggable).attr('username').toLowerCase();
				var dropped_user = $(event.target).parents('.marblesWrap').attr('username').toLowerCase();
				var dropped_company = $(event.target).parents('.marblesWrap').attr('company');

				console.log('dropped a marble', dragged_user, dropped_user, dropped_company);
				if(dragged_user != dropped_user){              //only transfer marbles that changed owners
					$(ui.draggable).addClass('invalid');
					transfer_marble(marble_id, dropped_user, dropped_company);
					return true;
				}
			}
		}
	});

	...

	function transfer_marble(marbleName, to_username, to_company){
		show_tx_step({state: 'building_proposal'}, function(){
			var obj = 	{                                    //build the websocket message
							type: 'transfer_marble',
							name: marbleName,
							username: to_username,
							company: to_company,
							v: 1
						};
			console.log('[ws] sending transfer marble msg', obj);
			ws.send(JSON.stringify(obj));
			refreshHomePanel();
		});
	}
```

In the first seciton referencing `$('.innerMarbleWrap')` you can see wWe used jQuery and jQuery-UI to implement the drag and drop functionality. 
With this code we get a droppable event trigger. 
Much of the code is spent parsing for the details of the marble that was dropped and the user it was dropped into. 

When the event fires we first check to see if this marble actually moved owners, or if it was just picked up and dropped back down. 
If its owner has changed we go off to the `transfer_marble()` function.
This function creates a JSON message with all the needed data and uses our websocket to send it with `ws.send()`.
Now you know the whole flow. 
The user moved the marble, jQuery detected it, we send a websocket message, we recieve the websocket message, we build a proposal, we endorse a proposal, we send the propsoal to be ordered and finally we commnmit the block.

That’s it! Hope you had fun trading marbles. 

***

#Trouble Shooting
Stuck? Try my handy [trouble shooting guide](./i_lost_my_marbles.md).

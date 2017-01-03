# Marbles Part 1 - Demo

## About Marbles
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


#HFC SDK Deeper Dive
Before we examine how marbles works let’s examine how we configured the SDK and what it did for us.
Most of the config options can be found in `/config/mycreds.json`. 
This file list the hostname/ip and port of various components of our blockchain network.  
An abbreviated version is below:

```js
{
    "credentials": {
        "network_id": "asdf",
        "peers": [
            {
                "grpc_host": "192.168.99.100",
                "grpc_port": 7051,
                "type": "peer",
                "network_id": "asdf",
                "id": "peer1"
            }
        ],
        "memberservices": [
            {
                "id": "asdf-ca",
                "host": "192.168.99.100",
                "port": 8888,
                "type": "ca",
                "network_id": "asdf"
            }
        ],
        "orderers": [
            {
                "host": "192.168.99.100",
                "port": 5151,
                "type": "orderer",
                "network_id": "asdf",
                "id": "orderer-01"
            }
        ],
        "users": [
            {
                "enrollId": "admin",
                "enrollSecret": "adminpw"
            }
        ],
        "cert": "https://blockchain-certs.mybluemix.net/us.blockchain.ibm.com.cert",
        "marbles": {
            "company": "United Marbles",
            "chaincode_id": "marbles",
            "usernames": [
                "amy",
                "alice",
                "amber"
            ],
            "port": 3000
        }
    }
}
```

### Definitions:

**Peer** - A peer is a member of the blockchain and is running Hyperledger Fabric. From marble's context the peers are peers I own/run.

**COP** - The COP is responsible for gatekeeping our blockchain network. It will provide transaction certificates for clients such as our marbles application. 

**Orderer** - An orderer or ordering service is a member of the blockchain network who's main reponsoiblity is to package transactioins into blocks.

**Users** - A user is an entity that is authorized to interact with the blockchain. In the Marbles context this is our admin.

**Usernames** or **Owners** - These are the name of assets that can have ownership of marbles.

**Blocks** - Blocks contain transactions and a hash to verify integrity.

**Transactions** or **Proposals** - These represent interactions to the blockchain ledger. A read or write request of the ledger is sent as a proposal.

**Ledger** - It is the peer's storage for the blockchain. It contains the actual block data.

### Configure HFC:

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

1. The first thing marbles had to do was create an instance of HFC.
1. Next important part is to set the orderer's address.
1. Then set the key value store location.
	- the key value store location will be the file location for our admin's certificates
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
1. After succssful enrollment we are ready to interact with the blockchain.


## (work in progress)

<strike>

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


That’s it! Hope you had fun trading some marbles in part 1. 
Next up is [Marbles Part 2](./tutorial_part2.md). 
Part 2 adds some new chaincode functions making it a little niftier.

***

#Trouble Shooting
Stuck? Try my handy [trouble shooting guide](./i_lost_my_marbles.md).

</strike>
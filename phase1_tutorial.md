#OBC - Node.js "Marbles Phase 1" Demo

##Doc Links
- David's Main Readme Notes - [here](./README.md)
- SDK Doc - [utils/obc-js](./utils/obc-js/README.md)
- Tutorial for Marbles Phase 1 - [here](./phase1_tutorial.md)
- Tutorial for Marbles Phase 2 - coming

##BEFORE YOU RUN
- The expectations of this application are to test the JS SDK and help guide its development.  It will also double as an example to get developers familiar with our SDK + chaincode.
- This is a very simple asset transfer demonstration.  Two users can create and exchange marbles with each other.
- There will be multiple phases, only phase 1 is complete  [1/28/2016]
- The chaincode is not included, it can be found here: [https://github.com/ibm-blockchain/marbles-chaincode](hhttps://github.com/ibm-blockchain/marbles-chaincode)
- As a "tutorial" this doc is incomplete.  As a "how do I run your marble thing" it should be sufficient.

***

##Phase 1 Goals
- User can create a marble and store it in the chaincode state
- User can read and display all marbles in the chaincode state
- User can transfer marble to another user
- User can delete a marble
- User can see when a new block is written to the ledger
- Deployable on Bluemix

***

#Prereq:
1. Bluemix ID https://console.ng.bluemix.net/ (needed to create your OBC network) (stage1 or production)
1. Node JS 0.12+ (needed for this application)
1. GoLang Environment (only needed to build your own chaincode, not needed if you just run the marbles app as is)
1. You are at least partially aware of the term 'chaincode', 'ledger', and 'peer' in a blockchain context. [Blockchain Docs](https://github.com/openblockchain/obc-docs), [Term Help](https://github.com/openblockchain/obc-docs/blob/master/glossary.md)


#Application Background
Our fancy pants application is going to blow minds by creating and transferring marbles between two users. 
We are going to do this in Node.JS and a bit of GoLang. 
The backend of this application will be the GoLang code running in our Open Blockchain Peer network. 
From here on out the GoLang code will be referred to as 'Chaincode' or 'cc'. 
The chaincode itself will create a marble by storing it to the chaincode state. 
The chaincode itself is able to store data as a string in a key/value pair setup. 
Thus we will stringify JSON objects to store more complex structures. 

Attributes of a marble:

	1. name (unique string, will be used as key)
	1. color (string, css color names)
	1. size (int, size in mm)
	1. user (string)
	
We are going to create a Web UI that can set these values and pass them to the chaincode. 
Interacting with the cc is done with a HTTP REST call to a peer on the network. 
The obc.js SDK will abstract the details of the REST calls away.
This allow us to use dot notation to call our GoLang functions (such as `chaincode.init_marble(args)`).

#Application Communication Flow
[flow diagram here]

1. The user will interact with our Node.js application.
1. This client side JS code will open a websocket to the backend Node.js application.
1. The backend Node.js will send HTTP requests (via the SDK) to a OBC Peer (any peer in our network).
1. The peer will communicate to it's chaincode container.
1. The cc container will carry our the desired operation.

#Chaincode
To understand what is going on we need to start looking at the chaincode.  The complete cc code for this example can be found [here](https://github.com/ibm-blockchain/marbles-chaincode/blob/master/phase1/chaincode_ex.go)
	
The first interesting place to look is the Run() function. 
This is our entry point into chaincode. 
IE the peer will call this function for any type of "invocation". 
"Invoking" a function simply means we are attempting to run a cc function and that this event will be recorded to the blockchain ledger.
A counter example to an invoke operation would be a query operation.  Query events do not get recorded to the ledger.

Looking at the example code it should be clear that we can invoke our GoLang functions by detecting the desired function name and passing to that function the argument 'args'.
	
	func (t *SimpleChaincode) Run(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
		fmt.Println("run is running " + function)

		// Handle different functions
		if function == "init" {										// Initialize the entities and their asset holdings
			return t.init(stub, args)
		} else if function == "delete" {							// Deletes an entity from its state
			return t.Delete(stub, args)
		} else if function == "write" {								// Writes a value to the chaincode state
			return t.Write(stub, args)
		} else if function == "init_marble" {						//init_marble
			return t.init_marble(stub, args)
		} else if function == "set_user" {							//set user permissions
			return t.set_user(stub, args)
		}
		fmt.Println("run issues " + function)

		return nil, errors.New("Received unknown function invocation")
	}
	
The SDK we have built will be able to find the names of the functions listed in Run(). 
It will then give you a dot notation to use them in your Node.js application. ie:
	
	chaincode.read("abc")				//calls the Query() function which will read the value of "abc" from the cc state
	chaincode.rule_the_world("tomrrow")	//invokes the chaincode function "rule_the_world" (assuming it exists)


# Setup Options:
(1) Deploy locally using the [Manual] steps [here](#Network) 

`OR`

(2) Deploy to Bluemix using this button &nbsp;&nbsp; 
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/ibm-blockchain/marbles.git)


#[Manual] Network:
So the cc is great and all but first we need a blockchain network.
We have a Bluemix tile that can create you your own personal network at the push of a button.

1. First login to Bluemix [Bluexmix - stage1](https://console.stage1.ng.bluemix.net)
1. Click "Catalog" or click [here](https://console.stage1.ng.bluemix.net/catalog)
1. Scroll to the bottom and click the experimental link or click [here](https://console.stage1.ng.bluemix.net/catalog/labs/)
1. Click the IBM Blockchain - Experimental tile
1. Change the "Service name" to "myblockchain" without the quotes
1. Click the "CREATE" button
1. Wait for it to bring up your network, if all goes well you should be back on you Dashboard and see "myblockchain" square under the "Services" section. Click it.
1. Click the "LAUNCH" button to see the dashboard for your network. You should see 5 peers.
	- from here you can monitor if your peers crash, if the chaincode containers are running, and logs for all


The network is all setup.  Now we need to copy the peer data and pass it to our application (only need this step if we run the app localy, which I recommend. alternative is to run in bluemix).

1. Click the "myblockchain" tile in you Bluemix Dashboard
1. Click the "Service Credentials" link on the left
1. Copy the value of the peer field to app.js at line 131ish. We only need the "peer" array data.

#Setup Local Node.js
Now we are ready to work on the application!

1. First up we need to install our dependencies. Open a command prompt/terminal and browse to the root of this project.
1. In the command prompt type:
	
		> npm install  
		> gulp
		
1. If all goes well you should see this message in the console:
	
		--------------------------------------- Server Up - localhost:3000 ---------------------------------------
		
1. The app is already coded to auto deploy the chaincode.  You should see further message about it deploying. [IMPORTANT] You will need to wait about 90 seconds for the application to fully deploy our cc.
1. Make sure you wait for the all clear message. 
		
		[obc-js] Deploying Chaincode - Complete
		starting websocket
		
#Run Marbles App
1. Open up your browser and browse to [http://localhost:3000](http://localhost:3000/)
1. You should be staring at our Marble Demo application
1. Finally we can test the application. Click the "Create" link
1. Fill out all the fields, then click the "Create" button
1. It should have flipped you back to "Home" and you should see that a new marble has been created
	- If not click the "Home" tab again
	- If its stuck go the the troubleshooting section
1. Next lets trade a marble.  Click and drag one marble from one person's list to another. It should temporary become transulcent and then auto reload the marbles in their new state. 
	- If not refresh the page
	- If its stuck go the the troubleshooting section


#Run Marbles w/Bluemix (manually)
1. This app is already ready to run on bluemix
1. Create a new network from the Bluemix tile, and name it "myblockchain"
1. Edit manifest.yml 
	- change the sevice name to match your network's name, or remove the line if you don't want the app to bind to the service
	- change the app name and host name since "marbles" is taken
1. Push the application by opening a command prompt and browsing to this directory
	
	
	> cf login 
	> (follow the prompts)
	> cf push YOUR_APP_NAME_HERE
	
1. The application will bind to the service "myblockchain" and grab the peer data from VCAP_SERVICES. Code for this is in app.js line 223ish


#Trouble Shooting
1. to do dsh - add things here
1. Slack channel - Bluechain Team - #i_lost_my_marbles

***
dsh todo - make images for things in this tutorial  
dsh todo - add code walk throughs  
dsh toto - a video would be better than this 

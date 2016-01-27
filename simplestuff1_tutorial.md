#OBC - Node.js "SimpleStuff App 1" Demo

##Doc Links
- David's Notes Readme - [here](./README.md)
- SDK Doc - [utils/obc-js](./utils/obc-js/README.md)
- Tutorial for SimpleStuff App 1 - [here](./simplestuff1_tutorial.md)
- Tutorial for SimpleStuff App 2 - [coming](./simplestuff2_tutorial.md)

##BEFORE YOU RUN
- The expectations of this application are to test the JS SDK and help guide its development.  It will also double as an example to get developers familiar with our SDK + chaincode.
- This is a very simple asset transfer demonstration.  Two users can create and exchange marbles with eachother.
- Only phase 1 is complete (well close) 1/27/2016
- The chaincode is not included, it can be found here: [https://github.com/dshuffma-ibm/simplestuff](https://github.com/dshuffma-ibm/simplestuff)

***

##App 1 Goals
- User can create a marble and store it in the chaincode state
- User can read and display all marbles in the chaincode state
- User can transfer marble to another user
- User can delete a marble
- User can see when a new block is written to the ledger

***

#Prereq:
1. Bluemix ID https://console.ng.bluemix.net/ (needed to create your OBC network)
1. Node JS 12+ (needed for this application)
1. GoLang (needed to build your own chaincode, you can tutorial's cc for now)
1. You are at least paritally aware of the term 'chaincode', 'ledger', and 'peer' in a blockchain context


#Application Background
Our fancy pants appliaction is going to blow minds by creating and transfering marbles between two users.
We are going to do this in Node.JS and a little bit of GoLang.  The backend of this application will be the GoLang code running in our Open Blockchain Peer network.  From here on out the GoLang code will be refered to as 'Chaincode' or 'cc'. The chaincode itself will create a marble by storing it to the chaincode state. The chaincode itself is able to store data as a string in a key/value pair setup.  Thus we will stringify JSON objects to store more complex structures.

Attributes of a marble:
	1. name (unique string, marble name will be used as key)
	1. color (w/e is stock css names)
	1. size (large/small)
	1. user (string)
	
We are going to create a Web UI that can set these values and pass them to the chaincode. 

#Application Flow
[flow diagram here]
1. The user will interact with our Node.js application.
1. This client side JS code will open a websocket to the backend Node.js application.
1. The backend Node.js will send HTTP requests (via the SDK) to a OBC Peer (any peer in our network).
1. The peer will communicate to it's chaincode container.
1. The cc container will carry our the desired operation.

#Chaincode
To understand what is going on we need to start looking at the chaincode.  The complete cc code for this example can be found [here](https://github.com/dshuffma-ibm/simplestuff/blob/master/chaincode_ex.go)
	
The first interesting place to look is the Run() function. 
This is our entry point into chaincode. 
IE the peer will call this function for any type of "invocation". 
"Invoking" a function simply means we are attempting to run a cc function and that this event will be recorded to the blockchain ledger.
A counter example to a invoke operation would be a query operation.  Query events do not get recorded to the ledger.

Looking at the example code it should be clear that we can invoke our GoLang functions by detecting the desired function name and passing to that function the arugment 'args'.
	
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
It will then give you a dot notation to use them in your Node.js application.
	
	contract.cc.read("abc")				//this will call the Query() function which will read the value of "abc" from the cc state
	contract.rule_the_world("tomrrow")	//this would invoke the chaincode function "rule_the_world" (assuming it exists)
	
dsh to do - write the tutorial

#Network
First up is to creat a OBC network. Bluemix instructions, images and stuff here

dsh to do - write the tutorial

#Applicaiton
Next we need to install our node.js dependencies

Run:

	> npm install
	> gulp
	> open browser to localhost:3000
	


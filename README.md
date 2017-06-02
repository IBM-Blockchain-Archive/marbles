# Marbles Demo

## About Marbles
- The underlying network for this application is the [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), a Linux Foundation project.  You may want to review these instructions to understand a bit about the Hyperledger Fabric.
- **This demo is to aid a developer learn the basics of chaincode and app development with a Hyperledger network.**
- This is a `very simple` asset transfer demonstration. Multiple users can create and transfer marbles with each other.

	![](/doc_images/marbles-peek.gif)

***

##### Versions and Supported Platforms
Please note there are multiple version of marbles. 
One for each major Hyperledger Fabric release. 
Pick a version of marbles that is compatible with your version of Fabric. 
If you don't have any version of Fabric, then pick the marbles version marked **latest**! 

- Marbles - Branch v3.0 **(Latest)** (You are viewing this branch!)
	- Works with Hyperledger Fabric `v1.0`
	- Works with the IBM Blockchain Bluemix Service - Plan **HSBN vNext**

- [Marbles - Branch v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0)
	- Works with Hyperledger Fabric `v0.6-developer-preview`
	- Works with IBM Blockchain Bluemix Service - Plan **Starter** or **HSBN**

- [Marbles - Branch v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) **(Deprecated)**
	- No longer supported by the IBM Blockchain Bluemix service
	- Works with Hyperledger Fabric `v0.5-developer-preview`

***

# Application Background

Hold on to your hats everyone, this application is going to demonstrate transferring marbles between many marble owners leveraging Hyperledger Fabric.
We are going to do this in Node.js and a bit of GoLang.
The backend of this application will be the GoLang code running in our blockchain network.
From here on out the GoLang code will be referred to as 'chaincode' or 'cc'.
The chaincode itself will create a marble by storing it to the chaincode state.
The chaincode itself can store data as a string in a key/value pair setup.
Thus, we will stringify JSON objects to store more complex structures.

Attributes of a marble:

  1. id (unique string, will be used as key)
  2. color (string, css color names)
  3. size (int, size in mm)
  4. owner (string)

We are going to create a Web based UI that can set these values and store them in our blockchain.
The marble gets created in the blockchain storage aka ledger as a key value pair.
The `key` is the marble id, and the `value` is a JSON string containing the attributes of the marble (listed above).
Interacting with the cc is done by using the gRPC protocol to a peer on the network.
The details of the gRPC protocol are taken care of by an SDK called [Hyperledger Fabric Client](https://www.npmjs.com/package/fabric-client) SDK.
Check the picture below for topology details.

### Application Communication Flow

![](/doc_images/comm_flow.png)

1. The admin will interact with Marbles, our Node.js application, in their browser.
1. This client side JS code will open a websocket to the backend Node.js application. The client JS will send messages to the backend when the admin interacts with the site.
1. Reading or writing the ledger is known as a proposal. This proposal is built by Marbles (via the SDK) and then sent to a blockchain peer.
1. The peer will communicate to its Marbles chaincode container. The chaincode will run/simulate the transaction. If there are no issues it will endorse the transaction and send it back to our Marbles application.
1. Marbles (via the SDK) will then send the endorsed proposal to the ordering service.  The orderer will package many proposals from the whole network into a block.  Then it will broadcast the new block to peers in the network.
1. Finally the peer will validate the block and write it to its ledger. The transaction has now taken effect and any subsequent reads will reflect this change.

### Context Clues
There are 3 distinct parts/worlds that you need to keep straight.
They should be thought of as isolated environments that communicate with each other.
This walk through will jump from one to another as we setup and explain each part.
It's important to identify which part is which.
There are certain keywords and context clues to help you identify one from another.

1. The Chaincode Part - This is GoLang code that runs on/with a peer on your blockchain network. Also, called `cc`. All marbles/blockchain interactions ultimately happen here. These files live in `/chaincode`.
1. The Client Side JS Part - This is JavaScript code running in the user's browser. User interface interaction happens here. These files live in `/public/js.`
1. The Server Side JS Part - This is JavaScript code running our application's backend. ie `Node.js` code which is the heart of Marbles! Sometimes referred to as our `node` or `server` code. Functions as the glue between the marble admin and our blockchain. These files live in `/utils` and `/routes`.

Remember these 3 parts are isolated from each other.
They do not share variables nor functions.
They will communicate via a networking protocol such as gRPC or WebSockets.
***

# Marbles Setup

Follow the steps below to have your own marbles blockchain demo run locally.


## 5. Setup and Run Marbles
Install marbles npm dependencies by navigating back to the root of the marble directory:
```bash
cd ../../
npm install
```

### Install chaincode
Install the marbles chaincode source on the peer's filesystems:
```bash
cd ./scripts
node install_chaincode.js
```

### Instantiate chaincode
Spin up the marbles chaincode on your channel:
```bash
node instantiate_chaincode.js
```

### Run the Marbles App

Navigate to the marbles directory and launch the application:
```bash
cd ../
gulp marbles3
```

### Use the UI
Open a browser and visit localhost:3001. Scroll down to the bottom of the page and login as “admin”. You’re all set! Now you can create and trade marbles.

### See the logs
Open another terminal and view your peer or orderer logs:
```bash
docker logs -f peer0
# control + c will exit the process
docker logs -f orderer0
```

# Use Marbles

1. If you are at this step, you should have your environment setup, blockchain network created, marbles app and chaincode running. Right? If not look up for help (up the page, not literally upwards).
1. Open up your browser and browse to [http://localhost:3001](http://localhost:3001) or your Bluemix www route.
    - If the site does not load, check your node console logs for the hostname/ip and port marbles is using.
1. Finally we can test the application. Click the "+" icon on one of your users in the "United Marbles" section

![](/doc_images/use_marbles1.png)

1. Fill out all the fields, then click the "CREATE" button
1. After a few seconds your new marble should have appeared.
    - If not refresh the page
1. Next let’s trade a marble.  Drag and drop a marble from one owner to another. Only trade it to owners within "United Marbles" if you have multiple marble companies. It should temporary disappear and then redraw the marble within its new owner. That means it worked!
    - If not refresh the page
1. Now let’s delete a marble by dragging and dropping it into the trash can. It should disappear after a few seconds.

![](/doc_images/use_marbles2.png)

1. Refresh the page to double check that your actions "stuck".
1. Use the search box to filter on marble owners or marble company names.  This is helpful when there are many companies/owners.
    - The pin icon will prevent that user from being filtered out by the search box.
1. Congratulations you have a working marbles application :)!


# Additional resources

* [What is Chaincode](http://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html)
* [Fundamentals of IBM Blockchain](https://www.ibm.com/blockchain/what-is-blockchain.html)
* [Hyperledger Fabric Documentation](http://fabric-rtd.readthedocs.io/en/latest/getting_started.html)
* [Hyperledger Fabric code on GitHub](https://github.com/hyperledger/fabric)
* [Todo List Network using Hyperledger Composer](https://github.com/sanjay-saxena/todolist-network-hlfv1)


# Troubleshooting

* If you see a `containerID already exists` upon running docker-compose up, then you need to remove the existing container. This command will remove all containers; NOT your images:
```bash
docker rm -f $(docker ps -aq)
```

* When running `create-channel.js`, if you see an error stating `private key not found`, then try clearing your cached key value stores:
```bash
rm -rf /tmp/hfc-*
rm -rf ~/.hfc-key-store
```

# License
[Apache 2.0](LICENSE)

***

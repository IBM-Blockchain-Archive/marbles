# Marbles Demo

## About Marbles
- The underlying network for this application is the [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), a Linux Foundation project.  You may want to review these instructions to understand a bit about the Hyperledger Fabric.
- **This demo is to aid a developer learn the basics of chaincode and app development with a Hyperledger network.**
- This is a `very simple` asset transfer demonstration. Multiple users can create and transfer marbles with each other.

***

## Marbles Goals
- Admin can create a marble and store it in the chaincode state
- Admin can read and display all marbles in the chaincode state
- Admin can transfer a marble to another marble owner
- Admin can delete a marble

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

## Prerequisite

These instructions have been tested on Ubuntu 14 and OSX.  It may work for Windows 10 if you install the Bash shell.
**Note: Windows 7 users will need a virtual machine running some flavor of Linux.**

* Bash - Bash scripts are needed to setup installation files
* [GoLang](https://golang.org/) - 1.7.0 or highter
* [Docker](https://www.docker.com/products/overview) - v1.13 or higher
* [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
* [Node.js](https://nodejs.org/en/download/) - node v6.2.0 - v6.10.0 **(v7+ not supported)**
* [xcode](https://developer.apple.com/xcode/) - only required for OS X users


## Steps

1. [Clone the repo and download the Docker images](#1-clone-the-repo-and-download-the-docker-images)
2. [Set up the Fabric Node SDK](#2-set-up-the-fabric-node-sdk)
3. [Start your network](#3-start-your-network)
4. [Setup Blockchain Network](#4-setup-blockchain-network)
5. [Setup and Run the Marbles App](#5-setup-and-run-marbles)


## 1. Clone the repo and download the Docker images

Determine a location on your local machine where you want to place the Marbles and SDK libraries.  Next, clone the marbles repo into the folder:

```bash
git clone https://github.com/IBM-Blockchain/marbles.git
git checkout master
```

Next, we will download the docker images required to setup the network for running Hyperledger Fabric V1.
From your workspace, make the shell script an executable:

```bash
cd marbles/scripts
chmod +x download-dockerimages.sh
```

Now run the script. Make sure you have docker running before executing this script. This process will take a few minutes so be patient:

```bash
sudo ./download-dockerimages.sh
```

Once the script has completed, you should see the following in your terminal:

```bash
===> List out hyperledger docker images
hyperledger/fabric-ca          latest               35311d8617b4        3 weeks ago         240 MB
hyperledger/fabric-ca          x86_64-1.0.0-alpha   35311d8617b4        3 weeks ago         240 MB
hyperledger/fabric-couchdb     latest               f3ce31e25872        3 weeks ago         1.51 GB
hyperledger/fabric-couchdb     x86_64-1.0.0-alpha   f3ce31e25872        3 weeks ago         1.51 GB
hyperledger/fabric-kafka       latest               589dad0b93fc        3 weeks ago         1.3 GB
hyperledger/fabric-kafka       x86_64-1.0.0-alpha   589dad0b93fc        3 weeks ago         1.3 GB
hyperledger/fabric-zookeeper   latest               9a51f5be29c1        3 weeks ago         1.31 GB
hyperledger/fabric-zookeeper   x86_64-1.0.0-alpha   9a51f5be29c1        3 weeks ago         1.31 GB
hyperledger/fabric-orderer     latest               5685fd77ab7c        3 weeks ago         182 MB
hyperledger/fabric-orderer     x86_64-1.0.0-alpha   5685fd77ab7c        3 weeks ago         182 MB
hyperledger/fabric-peer        latest               784c5d41ac1d        3 weeks ago         184 MB
hyperledger/fabric-peer        x86_64-1.0.0-alpha   784c5d41ac1d        3 weeks ago         184 MB
hyperledger/fabric-javaenv     latest               a08f85d8f0a9        3 weeks ago         1.42 GB
hyperledger/fabric-javaenv     x86_64-1.0.0-alpha   a08f85d8f0a9        3 weeks ago         1.42 GB
hyperledger/fabric-ccenv       latest               91792014b61f        3 weeks ago         1.29 GB
hyperledger/fabric-ccenv       x86_64-1.0.0-alpha   91792014b61f        3 weeks ago         1.29 GB
```

## 2. Set up the Fabric Node SDK

From your `marbles/scripts` folder, run the `setup_sdk.sh` script:
```bash
sudo bash setup_sdk.sh
```

## 3. Start your network

Navigate to the test/fixtures folder in the fabric-sdk-node directory and run the docker-compose file:

```bash
cd ./fabric-sdk-node/test/fixtures
sudo docker-compose -f docker-compose-marblesv3.yaml up -d
```

Once complete, issue a `docker ps` command to view your currently running containers. You should see the following:
```bash
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS                       PORTS                                            NAMES
e61cf829f171        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 2 minutes        0.0.0.0:7056->7051/tcp, 0.0.0.0:7058->7053/tcp   peer1
0cc1f5ac24da        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 2 minutes        0.0.0.0:8056->7051/tcp, 0.0.0.0:8058->7053/tcp   peer3
7ab3106e5076        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 3 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0
2bc5c6606e6c        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 3 minutes        0.0.0.0:8051->7051/tcp, 0.0.0.0:8053->7053/tcp   peer2
513be1b46467        hyperledger/fabric-ca        "sh -c 'fabric-ca-..."   3 minutes ago       Up 3 minutes        0.0.0.0:8054->7054/tcp                           ca_peerOrg2
741c363ba34a        hyperledger/fabric-orderer   "orderer"                3 minutes ago       Up 3 minutes        0.0.0.0:7050->7050/tcp                           orderer0
abaae883eb13        couchdb                      "tini -- /docker-e..."   3 minutes ago       Up 3 minutes        0.0.0.0:5984->5984/tcp                           couchdb
2c2d51fe88c0        hyperledger/fabric-ca        "sh -c 'fabric-ca-..."   3 minutes ago       Up 3 minutes        0.0.0.0:7054->7054/tcp                           ca_peerOrg1
```

## 4. Setup Blockchain Network

A Hyperledger Fabric channel is a private “subnet” of communication between two or more specific network members, for the purpose of conducting private and confidential transactions. A channel is defined by members (organizations), anchor peers per member, the shared ledger, chaincode application(s) and the ordering service node(s). Each transaction on the network is executed on a channel, where each party must be authenticated and authorized to transact on that channel. Each peer that joins a channel, has its own identity given by a membership services provider (MSP), which authenticates each peer to its channel peers and services.

Before starting let’s remove the key value stores and hfc artifacts that may have cached during previous runs:
```bash
rm -rf /tmp/hfc-*
rm -rf ~/.hfc-key-store
```

### Create channel

Now, leverage the SDK test program to create a channel named `mychannel`. From the `scripts` directory:
```bash
cd ../fabric-sdk-node/
node test/integration/e2e/create-channel.js
```

### Join channel
Pass the genesis block - `mychannel.block` - to the ordering service and join the peers to your channel:
```bash
node test/integration/e2e/join-channel.js
```

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

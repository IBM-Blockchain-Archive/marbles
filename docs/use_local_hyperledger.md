# Use Local Hyperledger Network:

## Prerequisite

These instructions have been tested on Ubuntu 14 and OSX.  It may work for Windows 10 if you install the Bash shell.
**Note: Windows 7 users will need a virtual machine running some flavor of Linux.**

* Bash - Bash scripts are needed to setup installation files
* [GoLang](https://golang.org/) - 1.7.0 or higher
* [Docker](https://www.docker.com/products/overview) - v1.13 or higher
* [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
* [Node.js](https://nodejs.org/en/download/) - node v6.2.0 - v6.10.0 **(v7+ not supported)**
* [xcode](https://developer.apple.com/xcode/) - only required for OS X users


### Creating a Local Hyperledger Fabric Network

1. [Clone the repo and download the Docker images](#1-clone-the-repo-and-download-the-docker-images)
2. [Set up the Fabric Node SDK](#2-set-up-the-fabric-node-sdk)
3. [Start your network](#3-start-your-network)
4. [Setup Blockchain Network](#4-setup-blockchain-network)
5. [Setup and Run the Marbles App](#5-setup-and-run-marbles)


## 1. Download Docker images

Download the docker images required to setup the network for running Hyperledger Fabric V1.
From your marbles directory navigate to the scripts folder and make the shell script an executable:

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

We are going to use the SDK's test environment to run our network. 
The following script will clone their repo and set it up for us. 
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

* If you do not see all 8 containers running, then something is wrong. 
You will need to troubleshoot this before moving on. 
I'd suggest getting into the logs of one of the stopped containers with `sudo docker logs peer0` (replace peer0 with w/e name is stopped).
 
* If you see a `containerID already exists` upon running docker-compose up, then you need to remove the existing container. This command will remove all containers `docker rm -f $(docker ps -aq)`

## 4. Setup Blockchain Network

A Hyperledger Fabric channel is a private “subnet” of communication between two or more specific network members, for the purpose of conducting private and confidential transactions. 
A channel is defined by members (organizations), peers, the shared ledger, chaincode application(s) and the ordering service node(s). 
Each transaction on the network is executed on a channel, where each party must be authenticated and authorized to transact on that channel. 
Each peer that joins a channel, has its own identity given by a membership services provider (MSP), which authenticates each peer to its channel peers and services.

Before starting let’s remove any key value stores and SDK artifacts that may have cached during previous runs:
```bash
rm -rf /tmp/hfc-*
rm -rf ~/.hfc-key-store
```

### Create channel

Now, leverage the SDK test script to create a channel named `mychannel`. 
Navigate back to the `scripts` directory and enter these commands: 
```bash
cd ../fabric-sdk-node/
node test/integration/e2e/create-channel.js
```

* When running `create-channel.js`, if you see an error stating `private key not found`, then try clearing your cached key value stores:
```bash
rm -rf /tmp/hfc-*
rm -rf ~/.hfc-key-store
```

### Join channel
Great so you created a channel. 
The next task is to join your peers to the channel. 
Send the genesis block with the command: 
```bash
node test/integration/e2e/join-channel.js
```

### See the logs
Viewing the logs of docker containers is helpful to troubleshoot issues. 
While there is nothing important to see yet, it is a useful command to know. 
Open another terminal and view your peer or orderer logs: 
```bash
sudo docker logs -f peer0
# control + c will exit the process
sudo docker logs -f orderer0
```

### Finished
Nice work! The network is all setup. Right? I guess we will find out together. 
If you followed the instructions then your orderer will be batching new blocks every 10 seconds. 
This is a litttttle long for our application, and may give you undesired UI behavior, sometimes. 
Essentially if you move a marble the trade will take 10 seconds to settle. 
Thus the  **UI may redraw the marble back in its original position**, and then jump to a correct position after some time. 
This is a known issue and is because of the long batch time. 
If you use the Bluemix service, the batch time is only 1 second and this is the delay the app has been optimized for. 

Next up we need to **pass the address and other info of our peer to our marbles application**. 
This is done with the **blockchain creds** file. 
Configuration of this file can be tricky. 

Select one option below:

If you plan to run marbles on the **same** machine as the docker containers then this step is already done for you. 
Choose option 1, else choose option 2. 

1. **Option 1:** :lollipop: - Fabric and Marbles on same machine -  [next](../README.md#installchaincode)
2. **Option 2:** - Fabric and Marbles on different machines - [edit config file](./config_file.md)

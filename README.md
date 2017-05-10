# Marbles Demo

##### Versions and Supported Platforms
Please note there are multiple version of marbles.
One for each major Hyperledger Fabric release.
You must pick a version of marbles that is compatible with your version of Fabric.

- [Marbles - Branch v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) **(Deprecated)**
	- No longer supported by the IBM Blockchain Bluemix service
	- Works with Hyperledger Fabric `v0.5-developer-preview`

- [Marbles - Branch v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0)
	- Works with Hyperledger Fabric `v0.6-developer-preview`
	- Works with IBM Blockchain Bluemix Service - Plan **Starter** or **HSBN**

- [Marbles - Branch v3.0](https://github.com/ibm-blockchain/marbles/tree/v3.0) **(New)**
	- Works with Hyperledger Fabric `v1.0` (getting started tutorial coming soon!)
	- Works with the IBM Blockchain Bluemix Service - Plan **HSBN vNext**

***

__Marbles__

![](/doc_images/marbles.png)

## Application Background

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

Follow the steps below to have your own marbles blockchain demo run locally and review the [tutorial](/docs/tutorial_start_here.md) for background, using the application and deeper dives!
Looking for chaincode documentation? Check out the [What is Chaincode](http://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html) doc

## Prerequisite

* [Go](https://golang.org/) - most recent version
* [Docker](https://www.docker.com/products/overview) - v1.13 or higher
* [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
* [Node.js & npm](https://nodejs.org/en/download/) - node v6.2.0 - v6.10.0 (v7+ not supported); npm comes with your node installation.
* [xcode](https://developer.apple.com/xcode/) - only required for OS X users
* [nvm](https://github.com/creationix/nvm/blob/master/README.markdown) - if you want to use the nvm install command to retrieve a node version


## Steps

1. [Clone the repo and download the Docker images](#1-clone-the-repose-and-download-the-docker-images)
2. [Set up the Fabric Node SDK](#2-set-up-the-fabric-node-sdk)
3. [Edit the configuration](#3-edit-the-configuration)
4. [Start your network](#4-start-your-network)
5. [Use the Node SDK](#5-use-the-node-sdk)
6. [Run the Marbles App](#6-run-the-marbles-app)


# 1. Clone the repos and download the docker images

Determine a location on your local machine where you want to place the Marbles and SDK libraries.  Next, clone this github repo into the folder:

```bash
git clone https://github.com/IBM-Blockchain/marbles.git
```

Download the [cURL](https://curl.haxx.se/download.html) tool if not already installed. Next, from your chosen workspace, execute the following command:
```bash
curl -OO https://raw.githubusercontent.com/bmos299/fabric/rtd1/examples/e2e_cli/{download-dockerimages.sh,docker-compose-marblesv3.yaml}
```

This command pulls a shell script that will download and extract the necessary docker images. It also pulls the docker-compose file that we will use to spawn our network.

`download-dockerimages.sh` contains the code for downloading the docker images required to setup the network for running Hyperledger Fabric V1.

From your workspace, make the shell script an executable:

```bash
chmod +x download-dockerimages.sh
```

Now run the script. Make sure you have docker running before executing this script. This process will take a few minutes so be patient:

```bash
./download-dockerimages.sh
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

# 2. Set up the Fabric Node SDK

In the same folder, clone the repo for fabric node sdk:
```bash
git clone https://github.com/hyperledger/fabric-sdk-node.git
```

First, checkout the alpha branch of the `fabric-sdk-node` repository:
```bash
cd fabric-sdk-node
git checkout v1.0.0-alpha
```

Ensure that you are on the correct branch:
```bash
git branch
```

You should see the following:
```bash
* (HEAD detached at v1.0.0-alpha)
  master
```

Now hop back to your workspace directory:
```bash
cd ..
```

From your workspace, move the docker-compose-marblesv3.yaml to the test/fixtures folder in the fabric-sdk-node directory:

```bash
mv docker-compose-networksetup.yaml fabric-sdk-node/test/fixtures
```

Still from your workspace, empty the example chaincode source from the fabric-sdk-node directory:

```bash
rm -rf fabric-sdk-node/test/fixtures/src/github.com/example_cc/*
```

Now copy the todo list chaincode to the same folder:
```bash
cp todo-list-fabric-server/chaincode/* fabric-sdk-node/test/fixtures/src/github.com/example_cc/
```
> **Note:** If you want to run your own code on hyperledger fabric V1, just copy the chaincode code in fabric-sdk-node/test/fixtures/src/github.com/example_cc directory.

# 3. Edit the configuration

Update the `config.json` and `instantiate-chaincode.js` files in the fabric-sdk-node directory:

```bash
cd fabric-sdk-node/test/integration/e2e
```

Use an editor to open the `config.json` and replace all instances of `grpcs` with `grpc`.

Use an editor to open `instantiate-chaincode.js` and replace line 147 with:
```bash
args: ['100'],
```

In the fabric-sdk-node directory, edit the package.json file. Add grpc dependency `"grpc": "1.1.2"` to package.json under `dependencies`.
```bash
cd ../../../
```

Navigate to the marbles repo and edit the credentials file:
```bash
cd ../../../../marbles/config/
```

Use an editor to open blockchain_creds1.json. Replace the “network_id” field with a name of your choice. Change “chaincode_id” field to end2end. Change the “chaincode_version” field to v1.

Make sure to save all of your changes before continuing.

# 4. Start your network

`docker-compose-marblesv3.yaml` contains the configuration to setup the network.

Navigate to the test/fixtures folder in the fabric-sdk-node directory and run the docker-compose file:

```bash
cd ../../fabric-sdk-node/test/fixtures
docker-compose -f docker-compose-marblesv3.yaml up -d
```

Once complete, issue a docker ps command to view your currently running containers. You should see the following:
```bash
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS                       PORTS                                            NAMES
e61cf829f171        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 2 minutes           0.0.0.0:7056->7051/tcp, 0.0.0.0:7058->7053/tcp   peer1
0cc1f5ac24da        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 2 minutes        0.0.0.0:8056->7051/tcp, 0.0.0.0:8058->7053/tcp   peer3
7ab3106e5076        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 3 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0
2bc5c6606e6c        hyperledger/fabric-peer      "peer node start -..."   3 minutes ago       Up 3 minutes        0.0.0.0:8051->7051/tcp, 0.0.0.0:8053->7053/tcp   peer2
513be1b46467        hyperledger/fabric-ca        "sh -c 'fabric-ca-..."   3 minutes ago       Up 3 minutes        0.0.0.0:8054->7054/tcp                           ca_peerOrg2
741c363ba34a        hyperledger/fabric-orderer   "orderer"                3 minutes ago       Up 3 minutes        0.0.0.0:7050->7050/tcp                           orderer0
abaae883eb13        couchdb                      "tini -- /docker-e..."   3 minutes ago       Up 3 minutes        0.0.0.0:5984->5984/tcp                           couchdb
2c2d51fe88c0        hyperledger/fabric-ca        "sh -c 'fabric-ca-..."   3 minutes ago       Up 3 minutes        0.0.0.0:7054->7054/tcp                           ca_peerOrg1

```

# 5. Use the Node SDK

Go back to the root of the `fabric-sdk-node` directory.

Install node modules in your SDK repo.
```bash
npm install
npm install -g gulp
# if you get a "permission denied" error, then try with sudo
sudo npm install -g gulp
```
Finally, build the fabric-ca client:
```bash
gulp ca
```

Remove the key value stores and hfc artifacts that may have cached during previous runs:
```bash
rm -rf /tmp/hfc-*
rm -rf ~/.hfc-key-store
```


### Create channel

A Hyperledger Fabric channel is a private “subnet” of communication between two or more specific network members, for the purpose of conducting private and confidential transactions. A channel is defined by members (organizations), anchor peers per member, the shared ledger, chaincode application(s) and the ordering service node(s). Each transaction on the network is executed on a channel, where each party must be authenticated and authorized to transact on that channel. Each peer that joins a channel, has its own identity given by a membership services provider (MSP), which authenticates each peer to its channel peers and services.

Now, leverage the SDK test program to create a channel named `mychannel`. From the `fabric-sdk-node` directory:
```bash
node test/integration/e2e/create-channel.js
```

### Join channel
Pass the genesis block - `mychannel.block` - to the ordering service and join the peers to your channel:
```bash
node test/integration/e2e/join-channel.js
```

### Install chaincode
Install the todo list source code on the peer's filesystems:
```bash
node test/integration/e2e/install-chaincode.js
```

### Instantiate chaincode
Spin up the todo list containers:
```bash
node test/integration/e2e/instantiate-chaincode.js
```

# 6. Run the Marbles app

Navigate to the marbles directory and install node modules:
```bash
cd ../marbles
npm install
```

Now launch the application:
```bash
gulp marbles1
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


# Additional resources
Following is a list of additional blockchain resources:
* [Tutorial for Marbles](/docs/tutorial_start_here.md)
* [What is Chaincode](http://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html)
* [Fundamentals of IBM Blockchain](https://www.ibm.com/blockchain/what-is-blockchain.html)
* [Hyperledger Fabric Documentation](http://fabric-rtd.readthedocs.io/en/latest/getting_started.html)
* [Hyperledger Fabric code on GitHub](https://github.com/hyperledger/fabric)
* [Hyperledger Fabric Composer](https://hyperledger.github.io/composer/)


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

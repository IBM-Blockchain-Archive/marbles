# Use Local Hyperledger Network:

## Prerequisite

These instructions have been tested on Ubuntu 14 and OSX.  It may work for Windows 10 if you install the Bash shell.
**Note: Windows 7 users will need a virtual machine running some flavor of Linux.**

* Bash - Bash scripts are needed to setup installation files
* [GoLang](https://golang.org/) - 1.7.0 or higher
* [Docker](https://www.docker.com/products/overview) - v1.13 or higher
* [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
* [Node.js](https://nodejs.org/en/download/) - node v6.2.0 - v6.11.1 **(v7+ not supported)**
* [xcode](https://developer.apple.com/xcode/) - only required for **OS X** users

## 1. Download Fabric Samples

We are going to hijack the [Hyperledger Fabric samples](http://hyperledger-fabric.readthedocs.io/en/latest/samples.html) to run a local network. 
Their code has the setup for a Fabric network as well as example chaincode. 
We will only be using the network setup part.

Download their samples with the command:

```bash
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
```

Once you have cloned the repository start downloading the docker images of the various fabric components.

```bash
curl -sSL https://goo.gl/iX9dek -o setup_script.sh
sudo bash setup_script.sh
```

Be sure to add these binaries to your PATH variable by running the following command or pasting it into you .profile file.

```bash
export PATH=$PWD/bin:$PATH
```

## 2. Install the Dependencies

Next we are going to install node.js dependencies for the `fabcar` sample. 
It's not critical to do this step, but it is useful to test if the network is working before moving on. 
Thus we will use the fabcar example to make sure everything is working as desired. 

```bash
    cd fabcar
    sudo npm install
```

## 3. Start your network

Next we need to start up the Fabric. 
Run the script below to get everything going. 

```bash
    ./startFabric.sh
```

Once complete, run the command `docker ps` to view your currently running docker containers. You should see something similar to the following:

```bash
CONTAINER ID        IMAGE                                     COMMAND                  CREATED              STATUS              PORTS                                            NAMES
8bfa753977b1        dev-peer0.org1.example.com-fabcar-1.0     "chaincode -peer.a..."   About a minute ago   Up About a minute                                                    dev-peer0.org1.example.com-fabcar-1.0
56a7a5f0fb4d        hyperledger/fabric-tools:x86_64-1.0.0     "/bin/bash"              2 minutes ago        Up 2 minutes                                                         cli
b1600301db8f        hyperledger/fabric-peer:x86_64-1.0.0      "peer node start"        2 minutes ago        Up 2 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.org1.example.com
16c045817270        hyperledger/fabric-orderer:x86_64-1.0.0   "orderer"                2 minutes ago        Up 2 minutes        0.0.0.0:7050->7050/tcp                           orderer.example.com
36fcbc7d2a44        hyperledger/fabric-couchdb:x86_64-1.0.0   "tini -- /docker-e..."   2 minutes ago        Up 2 minutes        4369/tcp, 9100/tcp, 0.0.0.0:5984->5984/tcp       couchdb
a7bd6802bcf4        hyperledger/fabric-ca:x86_64-1.0.0        "sh -c 'fabric-ca-..."   2 minutes ago        Up 2 minutes        0.0.0.0:7054->7054/tcp                           ca.example.com
```

* If you do not see all 6 containers running, then something is wrong. 
You will need to troubleshoot this before moving on. 
I'd suggest getting into the logs of one of the stopped containers with `sudo docker logs peer0` (replace peer0 with w/e name is stopped).
 
* If you see a `containerID already exists` upon running docker-compose up, then you need to remove the existing container. This command will remove all containers `docker rm -f $(docker ps -aq)`

## Handy Tips:

### Test Network
- To test the network before we run marbles, run a query with the command:

```bash
    node query.js
```

The correct response will look similar to:

```
Create a client and set the wallet location
Set wallet path, and associate user  PeerAdmin  with application
Check user is enrolled, and set a query URL in the network
Make query
Assigning transaction_id:  d7cb048ebca9d1da2e3f1474e898fc2627e9ea04130941e6a91246dc36972ba7
returned from query
Query result count =  1
Response is  [{"Key":"CAR0", "Record":{"colour":"blue","make":"Toyota","model":"Prius","owner":"Tomoko"}},{"Key":"CAR1", "Record":{"colour":"red","make":"Ford","model":"Mustang","owner":"Brad"}},{"Key":"CAR2", "Record":{"colour":"green","make":"Hyundai","model":"Tucson","owner":"Jin Soo"}},{"Key":"CAR3", "Record":{"colour":"yellow","make":"Volkswagen","model":"Passat","owner":"Max"}},{"Key":"CAR4", "Record":{"colour":"black","make":"Tesla","model":"S","owner":"Adriana"}},{"Key":"CAR5", "Record":{"colour":"purple","make":"Peugeot","model":"205","owner":"Michel"}},{"Key":"CAR6", "Record":{"colour":"white","make":"Chery","model":"S22L","owner":"Aarav"}},{"Key":"CAR7", "Record":{"colour":"violet","make":"Fiat","model":"Punto","owner":"Pari"}},{"Key":"CAR8", "Record":{"colour":"indigo","make":"Tata","model":"Nano","owner":"Valeria"}},{"Key":"CAR9", "Record":{"colour":"brown","make":"Holden","model":"Barina","owner":"Shotaro"}}]
```

### Stop Network
- To stop the network processes run the commands:

```bash
    cd ../basic-network
    ./stop.sh
```


### Start Over
- To start over you can wipe the network by deleting the containers.
	- After deleting you can create the network again with the script `./startFabric.sh`. 

```bash
    cd ../basic-network
    ./teardown.sh
```

### See the logs
- Viewing the logs of docker containers is helpful to troubleshoot issues. 
While there is nothing important to see yet, it is a useful command to know. 
You do not have to specify the entire container name in the command. 
You only need enough characters of the name such that docker knows which container you want. 
Open another terminal and view your peer or orderer logs: 

```bash
sudo docker logs -f peer0
# control + c will exit the process
sudo docker logs -f orderer0
```

### Finished
Nice work! The network is all setup. Right? I guess we will find out together. 
If you followed the instructions then your orderer will be batching new blocks every 10 seconds. 
This is a litttttle long for our application. 
If you use the Bluemix service, the batch time is only 1 second and this is the delay the app has been optimized for. 
The application will continue to work with a 10 sec batch time, but you will have excess idle time to contemplate your life choices. 

Next up we need to **pass network info (such as IP addresses)** to our marbles application. 
This is a critical step. That is sadly error prone. 
We will accomplish it with a JSON **blockchain creds** file. 

Select one option below:

If you plan to run marbles on the **same** machine as the docker containers then this step is already done for you. 
Choose option 1, else choose option 2. 

1. **Option 1:** :lollipop: - Fabric and Marbles on same machine -  [next](../README.md#installchaincode)
2. **Option 2:** - Fabric and Marbles on different machines - [edit config file](./config_file.md)

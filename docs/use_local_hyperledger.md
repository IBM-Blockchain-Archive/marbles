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


### Creating a Local Hyperledger Fabric Network

1. [Clone the repo and download the Fabric samples](#1-download-fabric-samples)
2. [Install the Dependencies](#2-install-the-dependencies)
3. [Start your network](#3-start-your-network)

## 1. Download Fabric Samples

We are going to hijack the [Hyperledger Fabric samples](http://hyperledger-fabric.readthedocs.io/en/latest/samples.html) to run a local network. 
They already did all the work, so we just need to rip it off to get the network going.

Download the samples with the command:

```bash
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
```

Once you have clones the repository, install the platform specific binaries:

```bash
url -sSL https://goo.gl/iX9dek | sudo bash
```

Be sure to add these binaries to your PATH variable by running the following command or pasting it into you .profile file.

```bash
export PATH=<path to download location>/bin:$PATH
```

## 2. Install the Dependencies

Next we need to install node.js dependencies for the `fabcar` sample.

```bash
    cd fabcar
    npm install
```

## 3. Start your network

Next we need to start up the Fabric. 
Run the script below to get everything going. 

```bash
    ./startFabric.sh
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

## Tips:

### Test Network
- To test the network before we run marbles, run a query by:

```bash
    node query.js
```

### Stop Network
- To stop the network processes run the commands:

```bash
    cd ../basic-network
    ./stop.sh
```


### Start Over
- To delete the network to start fresh:

```bash
    ./teardown.sh
```

### See the logs
- Viewing the logs of docker containers is helpful to troubleshoot issues. 
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
The **UI may redraw the marble back in its original position**, and then jump to the correct position after some time. 
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

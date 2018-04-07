# Use Local Hyperledger Network:

## Prerequisite

These instructions have been tested on Ubuntu 14 and OSX.  It may work for Windows 10 if you install the Bash shell.
**Note: Windows 7 users will need a virtual machine running some flavor of Linux.**

* Bash - Bash scripts are needed to setup installation files
* [GoLang](https://golang.org/) - 1.7.0 or higher
* [Docker CE](https://www.docker.com/get-docker) - v1.13 or higher
* [Docker Compose](https://docs.docker.com/compose/install/) - v1.8 or higher
* [Node.js](https://nodejs.org/en/download/) - node v6.2+ or v8.1+ **(v9 is not supported, v7 support is unknown)**
* [xcode](https://developer.apple.com/xcode/) - only required for **OS X** users

## 1. Download Fabric Samples

We are going to hijack the [Hyperledger Fabric samples](http://hyperledger-fabric.readthedocs.io/en/latest/samples.html) to run a local network.
Their code has the setup for a Fabric network as well as example chaincode.
We will only be using the network setup part.

Download their node samples with the command:

```bash
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
```

Once you have cloned the repository start downloading the docker images of the various fabric components.

```bash
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/release-1.1/scripts/bootstrap-1.1.0-preview.sh -o setup_script.sh
sudo bash setup_script.sh
```

Be sure to add these binaries to your PATH variable by running the following command or pasting it into you .profile file.

```bash
export PATH=$PWD/bin:$PATH
```

## 2. Start your network

Next we need to start up the Fabric.
Run the script below to get everything going.

```bash
    cd ./fabcar
    sudo ./startFabric.sh
```

After a minute or two the command prompt will return.
Now run the command `docker ps` to view your currently running docker containers. You should see something _similar_ to the following:

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

## 3. Install Dependencies for a Test

Next we are going to install node.js dependencies for the `fabcar` sample.
It's not critical to do this step, but it is useful to test if the network is working before moving on.
Before we run `fabcar` we need to install its npm dependencies:

```bash
    sudo npm install
```

 - If you get a permission error such as `Error: EACCES: permission denied` on a `pkcs11js` folder try running this command `sudo npm install pkcs11js --unsafe-perm=true --allow-root`.  Then re-run `sudo npm install`.

It's important that the install returned with no errors (warnings are fine).
If you have npm installation errors you will have to decipher those on your own!
Good luck.

## 4. Test Network with Fabcar
Finally lets test the network before we run marbles.
Run query via `fabcar` with the commands:

Run the command __node enrollAdmin.js__. The response should be _similar_ to:
```
Store path:/home/ibmadmin/fabric-samples/fabcar/hfc-key-store
Successfully enrolled admin user "admin"
Assigned the admin user to the fabric client ::{"name":"admin","mspid":"Org1MSP","roles":null,"affiliation":"","enrollmentSecret":"",390e3bbbcfa819e338","identity":{"certificate":"-----BEGIN CERTIFICATE-----\nMIIB8TCCAZegAwIBAgIUENLgPE9seEysP/jBDTdmRCUyR30wCgYIKoZIzcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcxMjIyMTYxMDAwWhcNMTgxMjIyMTYx\nMDAwWoAFxMrB3wQ98E/bvqi3s2ilWee3p/mkyc98EtzGFDPzuw7\ne+A6kiPjkuaeeRteWqNsjaijbDBqMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8E\nAjAAMB0GA1UdDgQWBBRrGpXNl5JfDAKBggqhkjOPQQDAgNIADBF\nAiEAkraZL5xVq/GBysqdcB+yD0T6eMWZoN/DFLbS4W5O+7gCIC675hXxxcfIe4aD\njM8ikcptiP9V4I3nE/RVB8qqtAV7\n---
```

Run the command __node registerUser.js__. The response should be _similar_ to:
```
 Store path:/home/ibmadmin/fabric-samples/fabcar/hfc-key-store
Successfully loaded admin from persistence
Successfully registered user1 - secret:OOhIHrBLqZei
Successfully enrolled member user "user1"
User1 was successfully registered and enrolled and is ready to intreact with the fabric network
```

Run the command __node query.js__. The response should be _similar_ to:
```
Store path:/home/ibmadmin/fabric-samples/fabcar/hfc-key-store
Successfully loaded user1 from persistence
Query has completed, checking results
Response is  [{"Key":"CAR0", "Record":{"colour":"blue","make":"Toyota","model":"Prius","owner":"Tomoko"}},{"Key":"CAR1", "Record":{"colour":"red","make":"Ford","model":"Mustang","owner":"Brad"}},{"Key":"CAR2", "Record":{"colour":"green","make":"Hyundai","model":"Tucson","owner":"Jin Soo"}},{"Key":"CAR3", "Record":{"colour":"yellow","make":"Volkswagen","model":"Passat","owner":"Max"}},{"Key":"CAR4", "Record":{"colour":"black","make":"Tesla","model":"S","owner":"Adriana"}},{"Key":"CAR5", "Record":{"colour":"purple","make":"Peugeot","model":"205","owner":"Michel"}},{"Key":"CAR6", "Record":{"colour":"white","make":"Chery","model":"S22L","owner":"Aarav"}},{"Key":"CAR7", "Record":{"colour":"violet","make":"Fiat","model":"Punto","owner":"Pari"}},{"Key":"CAR8", "Record":{"colour":"indigo","make":"Tata","model":"Nano","owner":"Valeria"}},{"Key":"CAR9", "Record":{"colour":"brown","make":"Holden","model":"Barina","owner":"Shotaro"}}]
```

## Handy Tips:

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

## 5. Finished
Nice work! The network is all setup. Right? I guess we will find out together.
If you followed the instructions then your orderer will be batching new blocks every 10 seconds.
This is a litttttle long for our application.
If you use the IBM Cloud Blockchain service, the batch time is only 1 second and this is the delay the app has been optimized for.
The application will continue to work with a 10 sec batch time, but you will have excess idle time to contemplate your life choices.

Next up we need to **pass network info (such as IP addresses)** to our marbles application.
This is a critical step. That is sadly error prone.
We will accomplish it with a JSON **blockchain creds** file.

Select one option below:

If you plan to run marbles on the **same** machine as the docker containers then this step is already done for you.
Choose option 1, else choose option 2.

1. **Option 1:** :lollipop: - Fabric and Marbles on same machine -  [next](../README.md#3-install-and-instantiate-chaincode)
2. **Option 2:** - Fabric and Marbles on different machines - [edit config file](./config_file.md)

# Install and Instantiate Chaincode w/Local Hyperledger Fabric

## Setup Marbles
We need some marbles dependencies in order to run the install/instantiate scripts.
Install marbles npm dependencies by navigating back to the root of the marble directory and entering these commands. 
If you already ran these commands, it's safe to run them again.
```bash
cd ../../
npm install
```

### Install chaincode
With that done, we need to get the chaincode onto the peer's filesystem. 
Remember chaincode defines what marbles (assets) are and has our business  logic for our marble transactions. 
For reference the marbles chaincode can be found in this directory `<marbles root>/chaincode/src/`. 
There are several files, which is fine since our script will send the directory. 
Install the marbles chaincode source files with the commands below: 

```bash
cd ./scripts
node install_chaincode.js
```

### Instantiate chaincode
Next we need to instantiate the chaincode. 
This will have the peer spin up the marbles chaincode for your channel `mychannel`. 
Once this is complete we are ready to use the blockchain network to record our marble activities. 
Use the commands below:
```bash
node instantiate_chaincode.js
```

### Finish Up

Congrats! The network is all setup and marbles chaincode is running. 

- Continue where you left off in the [tutorial](../README.md#hostmarbles).
# Install and Instantiate Chaincode w/Local Hyperledger Fabric

## Setup Marbles
We need some marbles dependecies in order to run the install/instantiate scripts.
Install marbles npm dependencies by navigating back to the root of the marble directory and entering these commands:
```bash
cd ../../
npm install
```

### Install chaincode
With that done, we need to get the chaincode onto the peer's filesystem. 
For reference the marbles chaincode can be found in this directory `<marbles root>/chaincode/src/`. 
There are several files, which is fine since our script will send the directory. 
Install the marbles chaincode source files with the commands below: 

```bash
cd ./scripts
node install_chaincode.js
```

### Instantiate chaincode
Next we need to instantiate the chaincode. 
This will spin up the marbles chaincode on your channel. 
use the commands below:
```bash
node instantiate_chaincode.js
```

### Finish Up

Congrats! The network is all setup and marbles chaincode is running. 

- Continue where you left off in the [tutorial](../README.md#hostmarbles).
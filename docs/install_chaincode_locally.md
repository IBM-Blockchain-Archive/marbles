# Install and Instantiate Chaincode w/Local Hyperledger

## Setup Marbles
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

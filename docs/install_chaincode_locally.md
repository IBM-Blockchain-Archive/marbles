# Install and Instantiate Chaincode w/Local Hyperledger Fabric

### Setup
We need some marbles dependencies in order to run the install/instantiate scripts.
Install marbles npm dependencies by navigating back to the root of the marble directory and entering these commands.
If you already ran these commands, it's safe to run them again.

```bash
cd ../../marbles
npm install
```

It's important that the install returned with no errors (warnings are fine).
If you have npm installation errors you will have to decipher and fix these before moving on.

### Get Crypto Material
**Important Step!** The install and instantiate operations require an admin certificate and private key.
If these files are not found you will be unable to run either operation.

**Choose 1 option below to create these files:**

- **Option 1:** :lollipop: Use crypto files from a **locally hosted Hyperledger Fabric Network**. These certificates will be created with the `fabric-samples` example called `fabcar`. If you have already created the certs you should still re-run this step - [Create Crypto Files with Fabcar](./use_fabcar_crypto.md)
- **Option 2:** Create the certificate and public key files manually.  Use this option when your Fabric network was not created from `fabric-samples` such as the IBM Cloud service. - [Generate Crypto Manually](https://console.bluemix.net/docs/services/blockchain/v10_application.html#generating-the-client-side-certificates) - Instructions
	- Once you are done add the private key and signed certificate files to this folder: `<marbles root>/config/crypto/`

<a name="installChaincode"></a>

### Install chaincode
With that done, we need to get the chaincode onto the peer's filesystem.
Remember chaincode defines what marbles (assets) are and has our business  logic for our marble transactions.
For reference the marbles chaincode can be found in this directory `<marbles root>/chaincode/src/`.
There are several files, which is fine since our script will send the directory.

The script we will use is `install_chaincode.js` in the `scripts` folder.
It will read in our marbles config file and the blockchain creds file.
You can change the marbles chaincode ID or version by editing the `install_chaincode.js` file.
Open the configuration and credential file readme below if you would like to edit these files and want more information on their contents.
If you are okay with the defaults, then simply leave these files alone and run the command below.

- [Configuration and Credential File Help](./config_file.md)

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

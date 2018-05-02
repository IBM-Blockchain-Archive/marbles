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

- **Option 1:** :lollipop: Use crypto files from a **locally hosted Hyperledger Fabric Network**. These certificates/keys will be created with the `fabric-samples` example called `fabcar`. If you have already created the certs you can/should still re-run these steps.
 	- If you followed the earlier instructions you should already have `fabric-samples` installed. If not go back to [Download Fabric Samples](./use_local_hyperledger.md)
	- Step 1: In your terminal/command prompt change your path to the `fabric-samples/fabcar` directory:
		-  `cd ../fabric-samples/fabcar`
	- Step 2: Run the command:
		- `node enrollAdmin.js`
	- Step 3: Run the command:
		- `node registerUser.js`
	- Step 4: Double check that a few key and cert files were created in the folder `fabric-samples/fabcar/hfc-key-store`
	- Step 5: **Next we need to verify that the file paths in the connection profile match your installation.**
		- Open up your connection profile file `<marbles root>/config/connection_profile_local.json`.
		- Inside this JSON navigate to these **three** fields:
			- `organizations -> x-adminCert -> path`
			- `organizations -> x-adminKeyStore -> path`
			- `client -> credentialStore -> path`
		- The value of `path` listed in each field needs to be reflect your environment (your directory structure).
			- Try browsing to these folders and files to verify they exist.
			- You may need to change these values depending on where you put the `fabric-samples` directory and where your key store data lives. Once the paths are valid you can continue.
	- Step 6: You are done! Change your path back to the marbles root directory: `cd ../../marbles` and continue with the **Install chaincode** instructions below.
- **Option 2:** Create the certificate and public key files manually.  Use this option when your Fabric network was **not** created from `fabric-samples`. [Generate Crypto Manually](https://console.bluemix.net/docs/services/blockchain/v10_application.html#generating-the-client-side-certificates)
	- Step 1: Once you are done add the private key and signed certificate files to the folder `<marbles root>/config/crypto/`
	- Step 2: Next append the cert/key path information to your connection profile:
		1. Open your connection profile file in the `<marbles root>/config/` folder
		2. In the `organizations` field append these fields:
		```
		"adminPrivateKey": {
			"path": "./crypto/private.pem"
		},
		"signedCert": {
			"path": "./crypto/cert.pem",
			"x-name": "default"
		}
		```
		3. Double check the `path` fields above. Each field should match the name of the file you created.
		4. I've left you an example key and cert file in `<marbles root>/config/crypto/example` to reference. These will **not** work with your network, but you can reference them to see the expected PEM format of each file type.
	- Step 3: You are done! Continue with the **Install chaincode** instructions below.


<a name="installChaincode"></a>

### Install chaincode
With that done, we need to get the chaincode onto the peer's filesystem.
Remember chaincode defines what marbles (assets) are and has our business  logic for our marble transactions.
For reference the marbles chaincode can be found in this directory `<marbles root>/chaincode/src/`.
There are several files, which is fine since our script will send the directory.

The script we will use is `install_chaincode.js` in the `scripts` folder.
It will read in our marbles config file and the connection profile data.
You can change the marbles chaincode ID or version by editing the `install_chaincode.js` file.
Open the configuration and connection profile file readme below if you would like to edit these files and want more information on their contents.
If you are okay with the defaults, then simply leave these files alone and run the command below.

- [Configuration and Connection Profile Format Help](./config_file.md)

Install the marbles chaincode files with the commands below:

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

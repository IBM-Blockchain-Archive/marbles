# Configuration

Configuration of marbles happens with two files. 
These files can be found in the folder `<marbles directory>/config`. 
You usually need to edit them from their default state. 
Especially the creds file (section 2) since it has the IPs and other network details that are specific to your network. 

**You will need to restart the application after editing either file.**

### 1. The Config File:

- This is the file that has settings for the marble company you are pretending to be.
	- Such as the name of your marbles company, list of marble owners, port for the app, etc.. 
- It can be found in `<marbles directory>/config/marbles_tls.json`. 
- You only need to edit/create 1 file. Details below.
	- Tip: Create a new file for each Marble company you want to pretend to be.

**Example JSON**

```json
{
    "cred_filename": "blockchain_creds_tls.json",
    "use_events": true,
    "keep_alive_secs": 120,
    "company": "United Marbles",
    "usernames": [
        "amy",
        "alice",
        "ava"
    ],
    "port": 3001
}

```

Your config file must have all the fields listed above. 
There is already an example file in the config folder you can use. 
- **Make sure** the `cred_filename` field is set to the correct creds file. (open the creds file and look it over)

**Field Details**

- `cred_filename` - The name of the `Credential File` to use for your network. See the `Credential File` section for details.
- `use_events` - When `true` it will use EventHub.js in the SDK to be notified when tx are committed to the ledger. When `false` it will wait/sleep for a block to be created.
- `keep_alive_secs` - How often to periodically re-enroll in seconds.  This keeps the gRPC connections alive. Recommended value is 120 seconds.
- `company` - The name of your marbles company.
- `usernames` - The list of marbles owners that should be created on initial startup.
- `port` - The port to use when hosting the marbles application.

### 2. The Creds File:

- This file has settings for your blockchain network such as IPs, port numbers, and certificates. 
- This can be found in `<marbles>/config/blockchain_creds_tls.json`. 
- You only need to edit/create 1 file. Details below.
	- Tip: Use separate files for separate blockchain networks.

**If you are using the Bluemix Blockchain Service you will not need to manually edit these files**. 
You should have already downloaded this file from the service during the [install chaincode tutorial](./install_chaincode.md). 

**Example JSON**

```json
{
	"name": "Docker Compose Network",
	"x-networkId": "not-important",
	"x-type": "hlfv1",
	"description": "Connection Profile for an Hyperledger Fabric network on a local machine",
	"version": "1.0.0",
	"client": {
		"organization": "Org1MSP",
		"credentialStore": {
			"path": "./crypto/prebaked"
		}
	},
	"channels": {
		"mychannel": {
			"orderers": [
				"fabric-orderer"
			],
			"peers": {
				"fabric-peer-org1": {
					"endorsingPeer": true,
					"chaincodeQuery": true,
					"ledgerQuery": true,
					"eventSource": true
				}
			},
			"chaincodes": {
				"marbles": "v4"
			},
			"x-blockDelay": 10000
		}
	},
	"organizations": {
		"Org1MSP": {
			"mspid": "Org1MSP",
			"peers": [
				"fabric-peer-org1"
			],
			"certificateAuthorities": [
				"fabric-ca"
			],
			"adminPrivateKey": {
				"path": "./crypto/prebaked/cd96d5260ad4757551ed4a5a991e62130f8008a0bf996e4e4b84cd097a747fec-priv"
			},
			"signedCert": {
				"path": "./crypto/prebaked/PeerAdminCert.pem"
			}
		}
	},
	"orderers": {
		"fabric-orderer": {
			"url": "grpc://localhost:7050"
		}
	},
	"peers": {
		"fabric-peer-org1": {
			"url": "grpc://localhost:7051",
			"eventUrl": "grpc://localhost:7053"
		}
	},
	"certificateAuthorities": {
		"fabric-ca": {
			"url": "http://localhost:7054",
			"httpOptions": {
				"verify": true
			},
			"registrar": [
				{
					"enrollId": "PeerAdmin",
					"enrollSecret": "-"
				}
			],
			"caName": null
		}
	}
}
```

**Field Details**

- `name` - The main purpose of this is to detect when people try to use the default file w/o editing! Set it to anything other than `Place Holder Network Name` to get past the startup check.
- `client`
	- `organization` = The name of the org to use for our application. This name will match an entry in the `organizations` object.
	- `credentialStore` - (Optional)
		- `path` - The path of a key value store for the SDK to use.  Stores crypto material.
- `channels`
	- `orderers` - An array of names of a orderers that have joined this channel. Each name will match an entry in the `orderers` object.
	- `peers` - An array of names of peers that has joined this channel. Each name will match an entry in the `peers` object.
	- `chaincodes` - An object of instantiated chaincode IDs on this channel.  The key is a chaincode id, the value is the chaincode version.
	- `x-blockDelay` - Time in ms for a block to be created by the orderer. This is a setting for the channel.
- `organizations` 
	- `peers` - The key name of a peer that is owned by this org. This name will match an entry in the `peers` object.
	- `certificateAuthorities` - The key name of a ca that is owned by this org. This name will match an entry in the `certificateAuthorities` object.
	- `peers` - The key name of a peer that is owned by this org. This name will match an entry in the `peers` object.
	- `adminPrivateKey` - Note this object can contain `path` **or** `pem` fields.
		- `path`- The path to an admin private key. Used during install and instantiated.
		- `pem` - The admin private key. Used during install and instantiated.
	- `signedCert` - Note this object can contain `path` **or** `pem` fields.
		- `path` - The path to an admin signed certificate. Used during install and instantiate.
		- `pem` - The admin signed certificate. Used during install and instantiate.
- `orderers` - An object. Must have at least 1 entry. You can add more, but currently only the first one will be used.
	- `url` - The gRPC url to reach the orderer. It must include the port.
- `peers` - An object. Must have at least 1 entry. You can add more, but currently only the first one will be used.
	- `url` - The gRPC url to reach the peer. It must include the port.
	- `eventUrl` - The gRPC url to reach event endpoint of the peer. It must include the port and it is different than the discovery port!
- `certificateAuthorities` - An object. Must have at least 1 entry. You can add more, but currently only the first one will be used.
	- `url` - The gRPC url to reach the ca. It must include the port.
	- `registrar` - An object of enroll IDs and secrets for this org.  Used for invokes and queries on chaincode.
		- `enrollId` - A registered user's id on the CA. Can be found in the CA's yaml file.
		- `enrollSecret` - A registered user's secret on the CA. Can be found in the CA's yaml file. 
	- `caName` - The CA to use to authenticate the enroll ID.

Once you have edited `blockchain_creds_tls.json` you are ready to install/instantiate Marbles. 

1. Continue where you left off in the [tutorial](../README.md#installchaincode). 

# Configuration

Configuration of marbles happens with two files or one file and a env variable.
If you set both Marbles will use the env variable over the files.
If you are unsure which one Marbles is loading check the logs when marbles starts.
You will either see `Loaded connection profile from an environmental variable` or `Loaded connection profile file <some name here>`.

A default setup will not have the env variable set, thus Marbles will load the cp from the folder: `<marbles directory>/config/`.
This is the approach I recommend.

If you are using the files you will likely need to edit them from their default state (more on this in section 2).

**You will need to restart the application after editing either a cp file or env variable.**

### 1. The Config File:

- This file is small and has settings for the marble company you are pretending to be.
	- Its got the name of your marbles company, list of marble owners, port for the app, etc..
- It can be found in `<marbles directory>/config/marbles_tls.json`.
- You only need to edit/create 1 file. Details below.
	- Tip: Create a new file for each Marble company you want to pretend to be.

**Example JSON**

```json
{
    "cred_filename": "connection_profile_tls.json",
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

### 2. The Connection Profile:

- This data contains the settings for your blockchain network such as IPs, port numbers, and certificates.
- The file version can be found in `<marbles>/config/connection_profile_tls.json`.
- If you are using the env version you must set this yourself.
	- `> export CONNECTION_PROFILE="{JSON GOES IN HERE}"`
- Tip: Use separate files for separate blockchain networks.

**If you are using the IBM Cloud Blockchain Service you will not need to manually edit these files**.
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
			"path": "./crypto/example"
		}
	},
	"channels": {
		"mychannel": {
			"orderers": [
				"fabric-orderer"
			],
			"peers": {
				"fabric-peer-org1": {
					"x-chaincode": {}
				}
			},
			"chaincodes": [
				"marbles:v4"
			],
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
				"path": "./crypto/example/private.pem"
			},
			"signedCert": {
				"path": "./crypto/example/cert.pem",
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
- `x-networkId` - Unique id of the network set by the IBM Blockchain Platform service. Not necessary for a local hyperledger fabric network..
- `x-type` - Used by Hyperledger Composer to indicate what connector to use. Typically `hlfv1`. Only necessary if using Composer.
- `client`
	- `organization` - The name of the org to use for our application. This name will match an entry in the `organizations` object.
	- `credentialStore` - (Optional)
		- `path` - The path of a key value store for the SDK to use.  Stores crypto material.
- `channels`
	- `orderers` - An array of names of a orderers that have joined this channel. Each name will match an entry in the `orderers` object.
	- `peers` - A dictionary of peers that has joined this channel.
	- `chaincodes` - An array of strings representing instantiated chaincode on this channel. The id and version are separated by a colon.
	- `x-blockDelay` - Time in ms for a block to be created by the orderer. This is a setting for the channel that marbles will use to set timeouts.
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

Once you have edited `connection_profile_tls.json` you are ready to install/instantiate Marbles.

1. Continue where you left off in the [tutorial](../README.md#installchaincode).

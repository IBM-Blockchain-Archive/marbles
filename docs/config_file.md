# Configuration

Configuration of marbles happens with two files. 
These files can be found in the folder `<marbles directory>/config`. 
You must edit them from their default state. 

### 1. Config File:

- This is the file that has settings for the marble company you are pretending to be.
	- Such as the name of your marbles company, list of marble owners, port for the app, etc.. 
- It can be found in `<marbles directory>/config/marbles1.json`. 
- You only need to edit/create 1 file. Details below.
	- Tip: Create a new file for each Marble company you want to pretend to be.

**Example JSON**

```json
{
    "cred_filename": "blockchain_creds4.json",
    "use_events": true,
    "keep_alive_secs": 120,
    "company": "United Marbles",
    "usernames": [
        "amy",
        "alice",
        "ava"
    ],
    "port": 3001,
    "last_startup_hash": "db9c62e3b6a3dabfd1d108a99342185f1cac92c7"
}

```

Your config file must have all the fields listed above. 
There is already an example file in the config folder you can use. 

**Details**

- cred_filename - The name of the `Credential File` to use for your network. See the `Credential File` section for details.
- use_events - When `true` it will use EventHub.js in the SDK to be notified when tx are committed to the ledger. When `false` it will wait/sleep for a block to be created.
- keep_alive_secs - How often to periodically re-enroll in seconds.  This keeps the gRPC connections alive. Recomended value is 120 seconds.
- company - The name of your marbles company.
- usernames - The list of marbles owners that should be created on initial startup.
- port - The port to use when hosting the marbles application.
- last_start_hash - You do not need to modify/create this field. Its created internally when marbles successfully starts up. It is a hash of the network credentials file. It is used to detect when you are trying to re-run marbles with a new network and we should go through the  initial startup again.


### 2. Creds File:

- This file has settings for your blockchain network. 
- This can be found in `<marbles>/config/blockchain_creds1.json`. 
- You only need to edit/create 1 file. Details below.
	- Tip: Use seperate files for seperate blockchain networks.

**Example JSON**

```json
{
    "credentials": {
        "network_id": "FakeNetworkId",
        "orderers": [
            {
                "discovery": "grpc://localhost:7050",
                "msp_id": "Org1MSP",
                "tls_certificate": "cert_1"
            }
        ],
        "cas": [
            {
                "api": "http://localhost:7054",
                "msp_id": "Org1MSP",
                "users": [
                    {
                        "enrollId": "admin",
                        "enrollSecret": "adminpw"
                    }
                ],
                "tls_certificate": "cert_1"
            }
        ],
        "peers": [
            {
                "discovery": "grpc://localhost:7051",
                "events": "grpc://localhost:7053",
                "msp_id": "Org1MSP",
                "tls_certificate": "cert_1"
            }
        ],
        "app": {
            "channel_id": "mychannel",
            "chaincode_id": "marbles",
            "chaincode_version": "v0",
            "block_delay": 1000
        },
        "tls_certificates": {
            "cert_1": {
                "common_name": null,
                "pem": "-----BEGIN CERTIFICATE----- <removed> -----END CERTIFICATE-----\r\n"
            }
        }
    }
}
```

**Details**

- network_id - The main purpose of this is to detect when people try to use the default file w/o any editing! Set it to anything other than `FakeNetworkId`.
- orderers - An Array. Must have at least 1 entry. You can add more, but currently only the first one will be used.
	- discovery - The gRPC url to reach the orderer. It must include the port.
	- msp_id - The ID associated with the orderer. See fabric documentation for MSP information.
- cas - An Array. Must have at least 1 entry. You can add more, but currently only the first one will be used.
	- api - The gRPC url to reach the ca. It must include the port.
	- msp_id - The ID associated with the ca.
	- users - An array of object containing the `enrollId` and `enrollSecret`.
		- enrollId - A registered user's id on the CA. Can be found in the CA's yaml file.
		- enrollSecret - A registered user's secret on the CA. Can be found in the CA's yaml file. 
- peers - An array. Must have at least 1 entry. You can add more, but currently only the first one will be used.
	- discovery - The gRPC url to reach the peer. It must include the port.
	- events - The gRPC url to reach event endpoint of the peer. It must include the port and it is different than the discovery port!
	- msp_id - The ID associated with the peer.
- app - This is an object
	- channel_id - Name of the channel where marbles chaincode has been instantiated.
	- chaincode_id - Name of the chaincode installed.
	- chaincode_version - Version of the chaincode installed.
	- block_delay - Time in ms for a block to be created by the orderer. This is a setting in the orderer's yaml.
- tls_certificates - TLS certificate options.
	- common_name - Only needed when using self signed certs. It will override the common name.
	- pem - Can be either the complete PEM file that has line breaks encoded as `\n` **OR** a relative file path to a PEM file inside the `config` folder.

Once you have edited `blockchain_creds1.json` you are ready to install/instantiate Marbles. 

1. Continue where you left off in the [tutorial](./tutorial_start_here.md#installchaincode). 

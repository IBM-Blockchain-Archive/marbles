# Marbles Demo

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/ibm-blockchain/marbles.git)

***

##### Versions and Supported Platforms
On November 9th, 2016, we released the IBM Blockchain Service v1.0 based on HyperLedger fabric v0.6.  All new networks created in bluemix will be this version.  Support of the v0.4.2.x Bluemix Service based on the 0.5.3 Hyperledger Fabric has been deprecated.  It is strongly recommended that if you have an existing network based on 0.5.3, you redeploy a new network and follow the instructions in the 2.0 branch.

- [Marbles - Branch v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0)
	- Works with Hyperledger fabric `v0.6-developer-preview`

If for some reason you need instructions for the v0.4.2+ level of the service, they are here, but support of these instructions is
best effort only.

- [Marbles - Branch v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) (Deprecated)
	- Works with Hyperledger fabric `v0.5-developer-preview`
	- IBM Bluemix Blockchain Service `v0.4.2+`

# Application Background

Hold on to your hats everyone, this application is going to demonstrate transferring marbles between two users leveraging IBM Blockchain.
We are going to do this in Node.js and a bit of GoLang. 
The backend of this application will be the GoLang code running in our blockchain network. 
The chaincode itself will create a marble by storing it to the chaincode state. 
The chaincode itself is able to store data as a string in a key/value pair setup. 
Thus we will stringify JSON objects to store more complex structures. 

Attributes of a marble:

	1. name (unique string, will be used as key)
	1. color (string, css color names)
	1. size (int, size in mm)
	1. user (string)
	
We are going to create a Web UI that can set these values and pass them to the chaincode. 
Interacting with the chaincode is done with a HTTP REST call to a peer on the network. 
The ibc-js SDK will abstract the details of the REST calls away.
This allow us to use dot notation to call our GoLang functions (such as `chaincode.init_marble(args)`). 

Start the tutorials below to have your own marbles blockchain demo!

## Tutorial / Documentation
- Looking for chaincode documentation? Check out the [learn chaincode](https://github.com/IBM-Blockchain/learn-chaincode) repo - **start here!**
- Tutorial for Marbles [Part 1](/docs/tutorial_part1.md)
- Tutorial for Marbles [Part 2](/docs/tutorial_part2.md) 
- Documentation for IBM Blockchain [IBC-JS SDK](https://github.com/IBM-Blockchain/ibm-blockchain-js) (our REST based SDK)

***

## Projects Contents

If you **run marbles on local host** you will have these two urls:

1. Marbles Part 1   -	[http://localhost:3000/p1](http://localhost:3000/p1)
1. Marbles Part 2   -	[http://localhost:3000/p2](http://localhost:3000/p2)


## Privacy Notice

This web application includes code to track deployments to [IBM Bluemix](https://www.bluemix.net/) and other Cloud Foundry platforms. The following information is sent to a [Deployment Tracker](https://github.com/cloudant-labs/deployment-tracker) service on each deployment:

* Application Name (`application_name`)
* Space ID (`space_id`)
* Application Version (`application_version`)
* Application URIs (`application_uris`)

This data is used by IBM to track metrics around deployments of sample applications to IBM Bluemix to measure the usefulness of our examples, so that we can continuously improve the content we offer to you. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

**Deployment tracking can be disabled by deleting the 'Deployment Tracking' section in [app.js.](app.js#L120)**

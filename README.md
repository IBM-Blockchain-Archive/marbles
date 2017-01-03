# Marbles Demo

## Work In Progress! 
- **This branch does not have complete documentation!** 12/14/2016
- This branch is **only** for Hyperledger v0.7+

***

##### Versions and Supported Platforms
On November 9th, 2016, we released the IBM Blockchain Service v1.0.0 based on HyperLedger fabric v0.6.3 
All new networks created in Bluemix will use this version. 
Support of the v0.4.2.x Bluemix Service (based on the v0.5.3 Hyperledger Fabric) has been deprecated. 
It is strongly recommended that if you have an existing network based on v0.5.3, you create a new network and follow the instructions in the 2.0 branch. 

- [Marbles - Branch v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) **(Deprecated)**
	- This is an old version that is no longer supported by the Bluemix service
	- Works with Hyperledger fabric `v0.5-developer-preview`

- [Marbles - Branch v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0)
	- Works with Hyperledger fabric `v0.6-developer-preview`
	- Works with IBM Blockchain Bluemix Service `v1.0.0+`


- [Marbles - Branch v3.0](https://github.com/ibm-blockchain/marbles/tree/v3.0) **(Experimental)**
	- Works with Hyperledger fabric `v0.7.x` aka `v1`
	- Does not work with the IBM Blockchain Bluemix Service

***

## Application Background

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
- Tutorial for Marbles (coming soon)
- Tutorial for Marbles [Part 1](/docs/tutorial_part1.md)
<strike>
- Tutorial for Marbles [Part 2](/docs/tutorial_part2.md)
</strike>

***

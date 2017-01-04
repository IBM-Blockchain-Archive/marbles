# Marbles Demo

## Warning 
- This is an experimental version of marbles using the Hyperledger Fabric v0.7. It is not compatible with other Hyperledger Fabric versions.
- It uses HFC to communicate to the blockchain's peers
- **This branch does not have complete documentation!** 12/14/2016

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

__Marbles__

![](/doc_images/marbles.png)

## Application Background

Hold on to your hats everyone, this application is going to demonstrate transferring marbles between many marble owners leveraging Hyperledger.
We are going to do this in Node.js and a bit of GoLang. 
The backend of this application will be the GoLang code running in our blockchain network. 
From here on out the GoLang code will be referred to as 'chaincode' or 'cc'. 
The chaincode itself will create a marble by storing it to the chaincode state. 
The chaincode itself is able to store data as a string in a key/value pair setup. 
Thus, we will stringify JSON objects to store more complex structures. 

Attributes of a marble:

	1. name (unique string, will be used as key)
	1. color (string, css color names)
	1. size (int, size in mm)
	1. owner (string)
	
We are going to create a Web based UI that can set these values and store them in our blockchain. 
Start the tutorials below to have your own marbles blockchain demo!

## Tutorial / Documentation
- Looking for chaincode documentation? Check out the [learn chaincode](https://github.com/IBM-Blockchain/learn-chaincode) repo - **start here!**
- [Tutorial for Marbles](/docs/tutorial_part1.md)

***

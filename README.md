# Marbles Demo

##### Versions and Supported Platforms
Please note there are multiple version of marbles. 
One for each major Hyperledger Fabric release. 
You must pick a version of marbles that is compatible with your version of Fabric. 

- [Marbles - Branch v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) **(Deprecated)**
	- No longer supported by the IBM Blockchain Bluemix service
	- Works with Hyperledger Fabric `v0.5-developer-preview`

- [Marbles - Branch v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0)
	- Works with Hyperledger Fabric `v0.6-developer-preview`
	- Works with IBM Blockchain Bluemix Service - Plan **Starter** or **HSBN**

- [Marbles - Branch v3.0](https://github.com/ibm-blockchain/marbles/tree/v3.0) **(New)**
	- Works with Hyperledger Fabric `v1.0` (getting started tutorial coming soon!)
	- Works with the IBM Blockchain Bluemix Service - Plan **HSBN vNext**

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
- Looking for chaincode documentation?
	- Check out the [learn chaincode](https://github.com/IBM-Blockchain/learn-chaincode) repo
- [Tutorial for Marbles](/docs/tutorial_start_here.md)
	- covers how to set it up and how to use it

***

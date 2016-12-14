# Marbles Demo

## Work In Progress! 
**This branch does not have complete documentation!** 12/14/2016

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

***

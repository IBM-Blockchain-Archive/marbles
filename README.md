# Marbles Demo

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/ibm-blockchain/marbles.git)

#Application Background
This sample app is meant to demonstrate how to create and transfer marbles between two users. 
We are going to do this in Node.JS and a bit of GoLang. 
The backend of this application will be the GoLang code running in our blockchain network. 
From here on out the GoLang code will be referred to as 'chaincode' or 'cc'. 
The chaincode itself will create a marble by storing it to the chaincode state. 
The chaincode itself is able to store data as a string in a key/value pair setup. 
Thus we will stringify JSON objects to store more complex structures. 

Attributes of a marble:

	1. name (unique string, will be used as key)
	1. color (string, css color names)
	1. size (int, size in mm)
	1. user (string)
	
We are going to create a Web UI that can set these values and pass them to the chaincode. 
Interacting with the cc is done with a HTTP REST call to a peer on the network. 
The ibc-js SDK will abstract the details of the REST calls away.
This allow us to use dot notation to call our GoLang functions (such as `chaincode.init_marble(args)`). 

Start the tutorial below to have your own marbles blockchain demo.

## Doc Links
- Tutorial for Marbles Part 1 - [here](./tutorial_part1.md) (start here)
- Tutorial for Marbles Part 2 - [here](./tutorial_part2.md) 
- IBM Blockchain JS Doc - [https://github.com/IBM-Blockchain/ibm-blockchain-js](https://github.com/IBM-Blockchain/ibm-blockchain-js)

***

## Projects Contents
1. **Marbles Part 1**   -	http://localhost:3000/p1
1. **Marbles Part 2**   -	http://localhost:3000/p2

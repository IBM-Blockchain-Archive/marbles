#Marbles Part 2 - Demo

***
<center>
! __Work in progress__ !  
Please use [Part 1](./tutorial_part1.md) until this message is gone
</center>
***

##BEFORE YOU RUN
- This tutorial assumes you have completed [Part 1](./tutorial_part1.md)
- The underlying network for this applicaiton is the open blockchain fabric code that was contributed by IBM to the Linux Foundation's Hyperledger project. They have extensive [Fabric Documentation](https://github.com/openblockchain/obc-docs)
- The expectations of this application are to test the JS SDK, guide its development and to aid a developer become familiar with our SDK + chaincode.
- This is a `very simple` asset transfer demonstration.  Two users can create and exchange marbles with each other.
- The chaincode is not in this repo, it can be found here: [https://github.com/ibm-blockchain/marbles-chaincode](hhttps://github.com/ibm-blockchain/marbles-chaincode)

***

##Part 2 Goals
- Server pushes block/marble updates to client when a new block event has occured (polling based)
- User's can advertise to trade/exchange their marbles (ie willing to trade large red for large blue/yellow/green)
- User can remove their pending open trades
- User identity (fake login as user1 or user2)

***

#Prereq:
1. You have completed [Part 1](./tutorial_part1.md)
1. Bluemix ID https://console.ng.bluemix.net/ (needed to create your IBM Blockchain network)
1. Node JS 0.12+ (only needed if you want to run the app locally)
1. GoLang Environment (only needed to build your own chaincode, not needed if you just run the marbles app as is)
1. You are at least partially aware of the term 'chaincode', 'ledger', and 'peer' in a blockchain context. [Term Help](https://github.com/openblockchain/obc-docs/blob/master/glossary.md)


#Summary
Wow great so you completed [Part 1](./tutorial_part1.md) and you came back to try part 2. 
Now I know there are 4 goals listed above, but really there are only 2 major changes we are going to do this time around. 
We are going to (1) leverge the SDK to monitor when a new block gets written. 
This will allows us to push an update to our clients via the websocket, no more setTimeout(). 
(2) Users can now create an 'open trade'. Meaning they can create a contract of sorts that says "I am willing to give up my Large Blue marble for a Large Green marble". 
Another user can "login" our app and execute the trade if he has a green marble and wants a blue one.
This is still a simplistic asset transfer demo using a monolithic chaincode model. 
There will be no user security, crypto signatures or privacy until Part 3.


#Chaincode

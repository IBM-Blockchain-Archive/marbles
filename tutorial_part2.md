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

#Monitor Blockheight
Our Node.js SDK has a handy function called. `monitor_blockheight(cb)`. 
To use it we just pass it what function we want to be called whenever the SDK notices a new block has been written to the network. 
The plan is to use this event as a trigger to redraw the marble states. 

__The Plan__
1. User trades a marble
1. At somepoint that event will be written to a block
1. The SDK detects a new block has been written
1. Lets assume this new block contains our user's trade action, therefore lets read all marble states
	- this assumption is temporary
1. Broadcast the marble states to any connected peers
1. Clients receive the new marble states and redraw them

__./app.js__ (abbreviated)

```js
	//there is a new block, lets refresh everything that has a state
	obc.monitor_blockheight(function(chain_stats){
		if(chain_stats && chain_stats.height){
			console.log('hey new block, lets refresh and broadcast to all');
			obc.block_stats(chain_stats.height - 1, cb_blockstats);
			wss.broadcast({msg: 'reset'});
			chaincode.read('marbleIndex', cb_got_index);
		}
			
		//got the marble index, lets get each marble
		function cb_got_index(e, index){
			if(e != null) console.log('error:', e);
			else{
				try{
					var json = JSON.parse(index);
					for(var i in json){
						console.log('!', i, json[i]);
						chaincode.read(json[i], cb_got_marble);	//iter over each, read their values
					}
				}
				catch(e){
					console.log('error:', e);
				}
			}
		}
		
		//call back for getting a marble, lets send a message
		function cb_got_marble(e, marble){
			if(e != null) console.log('error:', e);
			else {
				wss.broadcast({msg: 'marbles', marble: marble});
			}
		}
		...
	}
```
The code above should look familiar. 
Its the same strategy as before just this time wrapped inside our monitor_blockheight function and using `wss.brodcast()` instead of `ws.send()`
The client side code doesn't even need to change. 
Well except now we can remove the setTimeout() staggering we used before. 
Test it out yourself at [http://localhost:3000/p2](http://localhost:3000/p2).

#Identity
If you tried out the link above you've probably seen the new "Trade" navigation link and the new login section. 
The trading example we are building to requires knowing which user we are impersonating so we have built a fake login. 
Click the HI USER part in the top right and you can select which user you want to be. 
We will not be building any type of security mechanism yet. 
The client side JS will be in control of keeping track of which user is logged in. 
There is a global variable called user and it will have a username field with an all lowercase string value. 
The JS that controls this is in `/public/part2.js`.

```js
	var user = {username: "bob"};
```

#Trading

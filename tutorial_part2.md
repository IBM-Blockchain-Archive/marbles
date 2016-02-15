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
Ok lets do some real work again. 
Now last time we created stuff to be stored we created individual key/value pairs for each marble. 
Lets try something different this time and use 1 key/value pair to track all known trades. 
To setup trades we need a chaincode function, lets call it `open_trade`. 
At the top is going to be an array of open trades. 
Open trades themself will be a structure of things like the username, timestamp, what they are willing to trade away and what they want in return.

__Open Trade Internal Structure__
```js
	type Description struct{
		Color string `json:"color"`
		Size int `json:"size"`
	}

	type AnOpenTrade struct{
		User string `json:"user"`					//user who created the open trade order
		Timestamp int64 `json:"timestamp"`			//utc timestamp of creation
		Want Description  `json:"want"`				//description of desired marble
		Willing []Description `json:"willing"`		//array of marbles willing to trade away
	}

	type AllTrades struct{
		OpenTrades []AnOpenTrade `json:"open_trades"`
	}

	var trades AllTrades

```

I think it is easier to read the above code from the bottom up.

To setup trades we need a chaincode function, lets call it `open_trade`. 
First things first we need to list this in the bottom of our `Run()` function like so:

__Run()__
```js
	func (t *SimpleChaincode) Run(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
		fmt.Println("run is running " + function)

		// Handle different functions
		if function == "init" {                  //initialize the chaincode state, used as reset
			return t.init(stub, args)
		} else if function == "delete" {         //deletes an entity from its state
			res, err := t.Delete(stub, args)
			cleanTrades(stub)                    //lets make sure all open trades are still valid
			return res, err
		} else if function == "write" {          //writes a value to the chaincode state
			return t.Write(stub, args)
		} else if function == "init_marble" {    //create a new marble
			return t.init_marble(stub, args)
		} else if function == "set_user" {       //change owner of a marble
			res, err := t.set_user(stub, args)
			cleanTrades(stub)                    //lets make sure all open trades are still valid
			return res, err
		} else if function == "open_trade" {     //create a new trade order
			return t.open_trade(stub, args)
		}
		fmt.Println("run did not find func: " + function) //error

		return nil, errors.New("Received unknown function invocation")
	}
```

Next build up the function itself.

**open_trade()**
```js
// ============================================================================================================================
// Open Trade - create an open trade for a marble you want with marbles you have 
// ============================================================================================================================
func (t *SimpleChaincode) open_trade(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var err error
	var will_size int
	var trade_away Description
	
	//	0        1      2     3      4      5       6
	//["bob", "blue", "16", "red", "16"] *"blue", "35*
	if len(args) < 5 {
		return nil, errors.New("Incorrect number of arguments. Expecting like 5?")
	}
	if len(args)%2 == 0{
		return nil, errors.New("Incorrect number of arguments. Expecting an odd number")
	}

	size1, err := strconv.Atoi(args[2])
	if err != nil {
		return nil, errors.New("3rd argument must be a numeric string")
	}

	open := AnOpenTrade{}
	open.User = args[0]
	open.Timestamp = makeTimestamp()                      //use timestamp as an ID
	open.Want.Color = args[1]
	open.Want.Size =  size1
	fmt.Println("- start open trade")
	jsonAsBytes, _ := json.Marshal(open)
	err = stub.PutState("_debug1", jsonAsBytes)

	for i:=3; i < len(args); i++ {                       //create and append each willing trade
		will_size, err = strconv.Atoi(args[i + 1])
		if err != nil {
			msg := "is not a numeric string " + args[i + 1]
			fmt.Println(msg)
			return nil, errors.New(msg)
		}
		
		trade_away = Description{}
		trade_away.Color = args[i]
		trade_away.Size =  will_size
		fmt.Println("! created trade_away: " + args[i])
		jsonAsBytes, _ = json.Marshal(trade_away)
		err = stub.PutState("_debug2", jsonAsBytes)
		
		open.Willing = append(open.Willing, trade_away)
		fmt.Println("! appended willing to open")
		i++;
	}
	
	trades.OpenTrades = append(trades.OpenTrades, open);    //append to open trades
	fmt.Println("! appended open to trades")
	jsonAsBytes, _ = json.Marshal(trades)
	err = stub.PutState("_opentrades", jsonAsBytes)         //rewrite open orders
	if err != nil {
		return nil, err
	}
	fmt.Println("- end open trade")
	return nil, nil
}
```

I've left  a lot of debug prints and even some debug key/value pairs so you can inspect the code flow yourself. 
Its essential the same as our `init_marble()` function just this one has nested structures. 
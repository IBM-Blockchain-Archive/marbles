#Marbles Part 2 - Demo

##BEFORE YOU RUN
- This tutorial assumes you have completed [Part 1](./tutorial_part1.md)
- The underlying network for this application is the open blockchain fabric code that was contributed by IBM to the Linux Foundation's Hyperledger project. They have extensive [Fabric Documentation](https://github.com/openblockchain/obc-docs)
- The expectations of this application are to test the JS SDK, guide its development and to aid a developer become familiar with our SDK + chaincode.
- This is a `very simple` asset transfer demonstration.  Two users can create and exchange marbles with each other.
- The chaincode is not in this repo, it can be found here: [https://github.com/ibm-blockchain/marbles-chaincode](hhttps://github.com/ibm-blockchain/marbles-chaincode)

***

##Part 2 Goals
- Server pushes block/marble updates to client when a new block event has occurred (polling based)
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
We are going to (1) leverage the SDK to monitor when a new block gets written. 
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
1. At some point that event will be written to a block
1. The SDK detects a new block has been written
1. Let’s assume this new block contains our user's trade action, therefore let’s read all marble states
	- this assumption is temporary
1. Broadcast the marble states to any connected peers
1. Clients receive the new marble states and redraw them

__./app.js__ (abbreviated)

```js
	//there is a new block, lets refresh everything that has a state
	ibc.monitor_blockheight(function(chain_stats){
		if(chain_stats && chain_stats.height){
			console.log('hey new block, lets refresh and broadcast to all');
			ibc.block_stats(chain_stats.height - 1, cb_blockstats);
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
It’s the same strategy as before just this time wrapped inside our `monitor_blockheight()` function and using `wss.brodcast()` instead of `ws.send()`
The client side code doesn't even need to change. 
Well except now we can remove the setTimeout() staggering we used before. 
Test it out yourself at [http://localhost:3000/p2](http://localhost:3000/p2).

#Identity
If you tried out the link above, you've probably seen the new "Trade" navigation link and the new login section. 
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
Ok let’s do some real work again. 
Now last time we created stuff to be stored we created individual key/value pairs for each marble. 
Let’s try something different this time and use 1 key/value pair to track all known trades. 
This will be an array of open trade structs. 
The open trades themselves will be a struct of things like the username, timestamp, what they are willing to trade away and what they want in return. 
The whole data layout is below.

__Open Trade Internal Structure__

```js
	var trades AllTrades
	
	type AllTrades struct{
		OpenTrades []AnOpenTrade `json:"open_trades"`
	}
	
	type AnOpenTrade struct{
		User string `json:"user"`					//user who created the open trade order
		Timestamp int64 `json:"timestamp"`			//utc timestamp of creation
		Want Description  `json:"want"`				//description of desired marble
		Willing []Description `json:"willing"`		//array of marbles willing to trade away
	}
	
	type Description struct{
		Color string `json:"color"`
		Size int `json:"size"`
	}
```

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

I've left a lot of debug prints and even some debug key/value pairs so you can inspect the code flow yourself. 
Its essentialy the same as our `init_marble()` function just this one has nested structures. 
We build up each individual struct and then append them into the array name `trades`. 
One non-obviouse decision I made here is that we will find trades again by looking at its timestamp field. 
ie. a unix timestamp in milliseconds is my unique ID for this trade.

The last thing we need to do is close a trade. 
I created another GoLang function named `perform_trade`. 
This function will take in the ID of a trade (its timestamp), the user who is closing the trade, the name of a marble they are willing to give up and finally the color/size marble they would like in return. 


**perform_trade()**

```js
	// ============================================================================================================================
	// Perform Trade - close an open trade and move ownership
	// ============================================================================================================================
	func (t *SimpleChaincode) perform_trade(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
		var err error
		
		//	0		1					2					3				4					5
		//[data.id, data.closer.user, data.closer.name, data.opener.user, data.opener.color, data.opener.size]
		if len(args) < 6 {
			return nil, errors.New("Incorrect number of arguments. Expecting 6")
		}
		
		fmt.Println("- start close trade")
		timestamp, err := strconv.ParseInt(args[0], 10, 64)
		if err != nil {
			return nil, errors.New("1st argument must be a numeric string")
		}
		
		size, err := strconv.Atoi(args[5])
		if err != nil {
			return nil, errors.New("6th argument must be a numeric string")
		}
		
		for i := range trades.OpenTrades{                                                        //look for the trade
			fmt.Println("looking at " + strconv.FormatInt(trades.OpenTrades[i].Timestamp, 10) + " for " + strconv.FormatInt(timestamp, 10))
			if trades.OpenTrades[i].Timestamp == timestamp{
				fmt.Println("found the trade");
				
				marble, e := findMarble4Trade(stub, trades.OpenTrades[i].User, args[4], size)    //find a marble that is suitable from opener
				if(e == nil){
					fmt.Println("! no errors, proceeding")

					t.set_user(stub, []string{args[2], trades.OpenTrades[i].User})	             //change owner of selected marble, closer -> opener
					t.set_user(stub, []string{marble.Name, args[1]})                             //change owner of selected marble, opener -> closer
				
					trades.OpenTrades = append(trades.OpenTrades[:i], trades.OpenTrades[i+1:]...)//remove trade
					jsonAsBytes, _ := json.Marshal(trades)
					err = stub.PutState("_opentrades", jsonAsBytes)                              //rewrite open orders
					if err != nil {
						return nil, err
					}
				}
			}
		}
		fmt.Println("- end close trade")
		return nil, nil
	}
```

One of the first thing this function does is find the trade based on its timestamp. 
Next it tries to find a marble that matches what the person that closed the trade desires. 
It does this with the function `findMarble4Trade`. 
`findMarble4Trade` will return the marble itself if it found one. 
We then feed this marble into our previously created `set_user` function and complete the trade. 
Lastly we close out the trade by removing it from the array of open trades.

That’s it! Now we can call this cc code from our Node.js like we did in Part 1. 
Simply use `chaincode.open_trade(args)` in our server side JS to create the trade and `chaincode.perform_trade(args)` to close it out. 
This code can be found in `/utils/ws_part2.js`.

With these new additions we can close out Part 2. 
There are a few more 'niceties' that I created such as removing open trades or options from an open trade if the user no longer has such a marble. 
There is also a `remove_trade()` cc function to allow the user to cancel his trade. 
The code for this is included in this repo.

In part 3 we will discuss authentication/authorization, but in the meantime feel free to build off this demo and share your results!

#Marbles Part 2 - Demo

##About Marbles
- This tutorial assumes you have completed [Part 1](./tutorial_part1.md)
- The underlying network for this application is the [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), a Linux Foundation project.  You may want to review these instructions to understand a bit about the Hyperledger Fabric.
- **This demo is to aid a developer learn the basics of chaincode and app development with a Hyperledger network.**
- This is a `very simple` asset transfer demonstration. Two users can create and exchange marbles with each other.
- There will be multiple parts. Part 1 and 2 are complete [2/15/2016]

***

##Part 2 Goals
- Users can advertise to trade/exchange their marbles (ie willing to trade large red for large blue/yellow/green)
- User can remove their pending open trades
- User identity (fake login as "bob" or "leroy")
- User actions are restricted based on their identity

***

#Prereq:
1. I highly recommend you complete [learn chaincode](https://github.com/IBM-Blockchain/learn-chaincode) first
1. If you want to run Marbles on a local blockchain network (ie. not using Bluemix) you will need to have completed the Hyperledger Fabric [development setup](https://github.com/hyperledger/fabric/blob/master/docs/Setup/Network-setup.md).
1. [Node.js](https://nodejs.org/en/download/) 0.12.0+ and npm v2+ (only needed if you want to run the app locally, npm comes with node.js)
1. Node.js experience. Marbles is a very simple blockchain app but it’s still a fairly involved node app. **You should be comfortable with node** and the express module.
1. GoLang Environment (only needed to build your own chaincode, not needed if you just run the marbles app as is)


#Summary
Wow so you completed [Part 1](./tutorial_part1.md) and you came back to try part 2? Great stuff. 
Now I know there are 4 goals listed above, but really there are only 2 major changes/additions we are going to do this time around. 
We are going to (1) create a "login" for each user. 
"Login" is in quotes because we will not be requiring any password to login. 
The user's selection of the desired username will be sufficient. 
Having an identify will allows us to prefill this user's actions with their username as well as allow the app to restrict their actions. 
ie. The user Bob should not be able to simply take a marble from Leroy, though he will be free to give away a marble to Leroy. 
(2) Users can now create an 'open trade'. Meaning they can create a contract of sorts that says "I am willing to give up my Large Blue marble for a Large Green marble". 
Another user can "login" our app and execute the trade if he has a green marble and wants a blue one.
This is still a simplistic asset transfer demo using a monolithic chaincode model. 
There will be no user security, crypto signatures or privacy until Part 3 [TBA].

#Identity
If you have already seen Part 2 on accident, then you've probably saw the new trade navigation link and the new "login" section. 
The trading example we are building to requires knowing which user we are impersonating so we have built a fake login. 
Go ahead and browse to your Part 2's url.
If you are running marbles locally this will be [http://localhost:3000/p2](http://localhost:3000/p2). 
If you are running marbles somewhere else it will be your hostname with a `/p2` at the end of your domain or IP.

Click the "HI [USERNAME]" part in the top right and you can select which user you want to be. 
We will not be building any type of security mechanism yet. 
The client side JS will be in control of keeping track of which user is logged in. 
There is a global variable in this JS code called `user`.
Its an object  and it will have a username string field in lowercase. 
The JS that controls this is in `/public/part2.js`.

__./public/part2.js__

```js
	var user = {username: "bob"};
```

That’s it for now. 
Just keep this in mind as we leverage who the user is and accomplish some actions later. 

#Trading
Ok let’s do some real work again and look at chaincode. 
Now last time we created stuff to be stored we created **individual** key/value pairs **for each** marble. 
Let’s try something different this time and use **one** key/value pair to track **all** known trades. 
This will be an array of open trade structs. 
The open trades themselves will be a struct of things like the username, timestamp, what they are willing to trade away and what they want in return. 
The whole data layout is below.

__Open Trade Internal Structure__

```js
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

To setup trades we need a chaincode function, let’s call it `open_trade`. 
First things first we need to list this in the bottom of our `Invoke()` function like so:

__Invoke()__

```js
	// ============================================================================================================================
	// Invoke - Our entry point for Invocations
	// ============================================================================================================================
	func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
		fmt.Println("invoke is running " + function)

		// Handle different functions
		if function == "init" {                 //initialize the chaincode state, used as reset
			return t.Init(stub, "init", args)
		} else if function == "delete" {        //deletes an entity from its state
			res, err := t.Delete(stub, args)
			cleanTrades(stub)                   //lets make sure all open trades are still valid
			return res, err
		} else if function == "write" {         //writes a value to the chaincode state
			return t.Write(stub, args)
		} else if function == "init_marble" {   //create a new marble
			return t.init_marble(stub, args)
		} else if function == "set_user" {      //change owner of a marble
			res, err := t.set_user(stub, args)
			cleanTrades(stub)                   //lets make sure all open trades are still valid
			return res, err
		} else if function == "open_trade" {    //create a new trade order
			return t.open_trade(stub, args)
		} else if function == "perform_trade" { //forfill an open trade order
			res, err := t.perform_trade(stub, args)
			cleanTrades(stub)                   //lets clean just in case
			return res, err
		} else if function == "remove_trade" {  //cancel an open trade order
			return t.remove_trade(stub, args)
		}
		fmt.Println("invoke did not find func: " + function) //error

		return nil, errors.New("Received unknown function invocation")
	}
```

Next we write the function itself.

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
		open.Timestamp = makeTimestamp()                     //use timestamp as an ID
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
		
		//get the open trade struct
		tradesAsBytes, err := stub.GetState(openTradesStr)
		if err != nil {
			return nil, errors.New("Failed to get opentrades")
		}
		var trades AllTrades
		json.Unmarshal(tradesAsBytes, &trades)                 //un stringify it aka JSON.parse()
		
		trades.OpenTrades = append(trades.OpenTrades, open);   //append to open trades
		fmt.Println("! appended open to trades")
		jsonAsBytes, _ = json.Marshal(trades)
		err = stub.PutState(openTradesStr, jsonAsBytes)        //rewrite open orders
		if err != nil {
			return nil, err
		}
		fmt.Println("- end open trade")
		return nil, nil
	}
```

I've left a lot of debug prints and even some debug key/value pairs so you can inspect the code flow yourself. 
It’s essentially the same as our `init_marble()` function we covered in Part 1. 
It’s just this one has nested structures. 
We build up each individual struct and then append them into the array name `trades`. 
One non-obvious decision I made here is that we will find trades again by looking at its timestamp field. 
ie. a unix timestamp in milliseconds is my unique ID for a particular trade.

The next thing we need to do is close a trade. 
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
		
		//get the open trade struct
		tradesAsBytes, err := stub.GetState(openTradesStr)
		if err != nil {
			return nil, errors.New("Failed to get opentrades")
		}
		var trades AllTrades
		json.Unmarshal(tradesAsBytes, &trades)																	//un stringify it aka JSON.parse()
		
		for i := range trades.OpenTrades{																		//look for the trade
			fmt.Println("looking at " + strconv.FormatInt(trades.OpenTrades[i].Timestamp, 10) + " for " + strconv.FormatInt(timestamp, 10))
			if trades.OpenTrades[i].Timestamp == timestamp{
				fmt.Println("found the trade");
				
				marble, e := findMarble4Trade(stub, trades.OpenTrades[i].User, args[4], size)					//find a marble that is suitable from opener
				if(e == nil){
					fmt.Println("! no errors, proceeding")

					t.set_user(stub, []string{args[2], trades.OpenTrades[i].User})								//change owner of selected marble, closer -> opener
					t.set_user(stub, []string{marble.Name, args[1]})											//change owner of selected marble, opener -> closer
				
					trades.OpenTrades = append(trades.OpenTrades[:i], trades.OpenTrades[i+1:]...)				//remove trade
					jsonAsBytes, _ := json.Marshal(trades)
					err = stub.PutState(openTradesStr, jsonAsBytes)												//rewrite open orders
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

The code above uses a function called `findMarble4Trade()`. 
Let’s look at that in more detail.

**findMarble4Trade()**

```js
	// ============================================================================================================================
	// findMarble4Trade - look for a matching marble that this user owns and return it
	// ============================================================================================================================
	func findMarble4Trade(stub *shim.ChaincodeStub, user string, color string, size int )(m Marble, err error){
		var fail Marble;
		fmt.Println("- start find marble 4 trade")
		fmt.Println("looking for " + user + ", " + color + ", " + strconv.Itoa(size));

		//get the marble index
		marblesAsBytes, err := stub.GetState(marbleIndexStr)
		if err != nil {
			return fail, errors.New("Failed to get marble index")
		}
		var marbleIndex []string
		json.Unmarshal(marblesAsBytes, &marbleIndex)								//un stringify it aka JSON.parse()
		
		for i:= range marbleIndex{													//iter through all the marbles
			//fmt.Println("looking @ marble name: " + marbleIndex[i]);

			marbleAsBytes, err := stub.GetState(marbleIndex[i])						//grab this marble
			if err != nil {
				return fail, errors.New("Failed to get marble")
			}
			res := Marble{}
			json.Unmarshal(marbleAsBytes, &res)										//un stringify it aka JSON.parse()
			//fmt.Println("looking @ " + res.User + ", " + res.Color + ", " + strconv.Itoa(res.Size));
			
			//check for user && color && size
			if strings.ToLower(res.User) == strings.ToLower(user) && strings.ToLower(res.Color) == strings.ToLower(color) && res.Size == size{
				fmt.Println("found a marble: " + res.Name)
				fmt.Println("! end find marble 4 trade")
				return res, nil
			}
		}
		
		fmt.Println("- end find marble 4 trade - error")
		return fail, errors.New("Did not find marble to use in this trade")
	}
```

I hope the point of `findMarble4Trade()` is rather obvious...
It is tasked with finding a suitable marble that will be used to perform a trade. 
The cc function `performTrade()` calls this function to find a marble from the user who **opened** the trade. 
This function should return the marble to `performTrade()` or an error if no suitable marble is found. 
The reason we need such a function is because the arguments to `perform_trade()` do not describe the marble we are going to give away to the user  **closing** the trade. 
We are relying on the cc to find such a marble, and that’s exactly what `findMarble4Trade()` will do for us. 
The actual code is straight forward. 
We `getState()` on `marbleIndexStr` then iter and read the state of each marble. 
Once we find a marble that fits the requirements (owner, size and color are okay) we return the marble. 
Else we return an error and `perform_trade()` will fail as expected.

That’s it! Now we can call this cc code from our Node.js like we did in Part 1. 
Simply use `chaincode.invoke.open_trade(args)` in our server side JS to create the trade and `chaincode.invoke.perform_trade(args)` to close it out. 
This code can be found in `/utils/ws_part2.js`.

With these new additions we can close out Part 2. 
There are a few more 'niceties' that I created such as removing open trades or options from an open trade if the user no longer has such a marble. 
The reason we need such functionality is because it is possible for a user to lose a marble he was once willing to give away. 
Thus he is no longer able to for fill a trade he previously created. 
The current cc code will find such events and remove the option from the trade and if the trade has no more willing options it will remove the whole trade.

There is also a `remove_trade()` cc function to allow the user to cancel his trade. 
The code for these functions can be found in the [chaincode](/chaincode) folder.

In Part 3 we will discuss authentication/authorization, but in the meantime feel free to build off this demo and share your results!

***

#Trouble Shooting
Stuck? Try my handy [trouble shooting guide](./i_lost_my_marbles.md).

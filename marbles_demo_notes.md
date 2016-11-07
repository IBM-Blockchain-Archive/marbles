# Marbles Demo Notes

- IBM Blockchain JS SDK Doc - [https://github.com/IBM-Blockchain/ibm-blockchain-js](https://github.com/IBM-Blockchain/ibm-blockchain-js)

***

## Demo Part 1 Goals
- [x] User can create a marble and store it in the chaincode state
- [x] User can read all marbles in the chaincode state
- [x] User can transfer marble to another user
- [x] See block stats
- [x] User can delete a marble
- [x] Deployable on bluemix

## Demo Part 2 Goals
- [x] Server pushes block/marble updates to client when a new block event has occured (polling based)
- [x] User's can advertise to trade/exchange their marbles (ie willing to trade large red for large blue/yellow/green)
- [x] User can remove their open trades
- [x] User identity (fake login as user1 or user2)
- [x] Ability to see past blocks details and some sort of animation on new blocks

## Demo Part 3 Goals
- [ ] User can see more block stats
- [ ] Server pushes block/marble updates to client when any new block event has occured (push based)
- [ ] User autentication (crypto signing of transactions)
- [ ] All operations prove ownership ^^ before exe
- [ ] User registration
- [ ] Drop down on leroy's panel to switch to any user (just a view)

## Demo Part 4 Goals
- [ ] Transaction privacy


***

## ToDos:
- [x] Write("name", "val", cb);
- [x] ReadNames(cb)
- [x] init_marble(json);
- [ ] check permissions of requesting user in cc
- [ ] verify user identity, ie public private key stuff
- [x] website to test cc, real basic
- [x] demo app website
- [x] make sdk proper npm module
- [x] custom custom function on UI
- [x] load json in UI
- [x] structured error reponse
- [ ] mocha test for sdk
- [ ] browsify sdk and tie cci into it (not sure if i want to)
- [ ] change downloading zip to git clone
- [ ] the regex to find golang functions needs improving, has false positives
- [x] follow redirect on zip download
- [x] auto deploy, correctly!
- [x] get delete to update marbleIndex
- [x] sdk, check inputs on load if they  dne, error
- [o] poll after chain deploy for cc up in peer [can't, future auth will prevent]
- [x] add block stats to sdk
- [x] write tutorial on part 1
- [x] change test var "a" to "abc" in cc
- [x] make advanced link in cci and hide ip/port fields, hide all things under tool like categories
- [x] make CCI work for multiple apps, pick which cc to load (even custom functions)
- [x] block history UI
- [ ] CCI video
- [ ] CCI screens with filled out info
- [x] restyle marbles to match new design
- [x] multi marble on willing list
- [ ] marble quanity in trade
- [x] remove/edit trades that are no longer possible in CC
- [x] check requirments of trade before exe, in CC
- [x] error checking on arguements before invoking... do not let e blank named marble in (in CC)
- [x] url routing mapper
- [ ] improve marble redraw so we don't have to blank the marble divs
- [x] tutorial for p2
- [x] re-parallelize the queryies
- [x] show open trades made by user
- [x] ability to remove open trades by user
- [x] make layout adaptive
- [x] better error messages
- [x] rename to jerry and ginni
- [x] point out that there is individual chaincode for part 1 and part2 in the tutorial
- [x] delete the temp dir if no deploy_name in sdk
- [ ] add check transID in sdk, like monitor_height
- [ ] redesign CCI
- [ ] move cci into its own repo, uses the SDK

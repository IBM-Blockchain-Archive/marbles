# SimpleStuff Demo Notes

## Doc Links
- obc.js SDK Doc - [utils/obc-js](./utils/obc-js/README.md)
- Tutorial for SimpleStuff App 1 - [here](./simplestuff1_tutorial.md) (start here)
- Tutorial for SimpleStuff App 2 - coming

***

## Projects Contents
1. **JS sdk** - `./utils/obc-js`
1. **SimpelStuff App1** (marbles demo)	-	http://localhost:3000
1. **Chaincode Investigator** (tool)	-	http://localhost:3000/cci

***

## Demo Phase 1 Goals
- [x] User can create a marble and store it in the chaincode state
- [x] User can read all marbles in the chaincode state
- [x] User can transfer marble to another user
- [x] See block stats
- [x] User can delete a marble
- [x] Deployable on bluemix

## Demo Phase 2 Goals
- [ ] New block events trigger a marble page update
- [ ] Can transfer/delete multiple marbles at once
- [ ] User's can advertise to trade their marbles (ie willing to trade large red for large blue/yellow/green)
- [x] User identity (fake login as bob or leroy)
- [x] Ability to see past blocks details and some sort of animation on new blocks

## Demo Phase 3 Goals
- [ ] User autentication (crypto signing of transactions)
- [ ] User registration
- [ ] Transacation privacy

***

## ChainCode / SDK ToDo:
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
- [x] follow redirect on zip download
- [x] auto deploy, correctly!
- [x] get delete to update marbleIndex
- [x] sdk, check inputs on load if they  dne, error
- [o] poll after chain deploy for cc up in peer [can't, future auth will prevent]
- [x] add block stats to sdk
- [x] write tutorial on phase 1
- [ ] move to socket.io (unsure, postpone)
- [ ] change test var "a" to "test" in cc
- [ ] make advanced link in cci and hide ip/port fields, hide all things under tool like categories
- [ ] make CCI work for multiple apps, pick which cc to load (even custom functions)
- [x] block history UI
- [ ] CCI video
- [ ] CCI screens with filled out info
- [ ] restyle marbles to match new design
- [ ] multi marble on willing list
- [ ] remove named marble argument on perform_trade message/golang func, replace with color/size thing
- [ ] check requirments of trade before exe, in CC
- [ ] error checking on arguements before invoking... do not let e blank named marble in
-

- I changed a if(e != null) to if(e == null) and it didn't create a new hash...?


### ChainCode Notes:
1. Due to performance issues, we probably want resuable chaincode contracts.  ie 1 chaincode describe/constrains multiple people assets. ie ie many people and cars exist in 1 chaincode
1. Any functionality that parties need to agree on should be in the chaincode.  ie do not move it to the application b/c this then the moving parts become unenforceable.
1. Chaincode should keep track of all key's that get their state saved.  Have init clear these

### Junk Notes:
- npm install git+ssh://git@github.ibm.com:openblockchain/obc-js.git
- phase two changes websocket msg structure!
	- UI no longer tracks ledger updates and sets a local timer to request the new marble states
	- backend will send a clear msg and then the new marble states whenever a request was made that would touch the ledger
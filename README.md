#OBC - Node.js "SimpleStuff" Demo
- examples of using the sdk are in app.js near the bottom

##Doc Links
- David's Notes Readme - [here](./README.md)
- SDK Doc - [utils/obc-js](./utils/obc-js/README.md)
- Tutorial for SimpleStuff App 1 - [here](./simplestuff1_tutorial.md)
- Tutorial for SimpleStuff App 2 - coming

***

##Projects Contents
1. sdk, obc-js.js
1. chaincode investigator			http://localhost:3000/cci
1. obc demo aka SimpelStuff App1	http://localhost:3000

***

##Phase 1 Goals
- [x] User can create a marble and store it in the chaincode state
- [x] User can read all marbles in the chaincode state
- [x] User can transfer marble to another user
- [x] See block stats
- [x] User can delete a marble

##Phase 2 Goals
- [ ] New block events trigger a marble page update
- [ ] Can trade/delete multiple marbles at once
- [ ] User's can advertise to trade their marbles (ie willing to trade large red for large blue/yellow/green)

##Phase 3 Goals
- [ ] User identity and autentication (crypto signing of transactions)
- [ ] Transacation privacy


---

##ChainCode / SDK To Do:
- [x] Write("name", "val", cb);
- [x] ReadNames(cb)
- [x] init_marble(json);
- [ ] check permissions of requesting user in cc
- [ ] verify user identityf, ie public private key stuff
- [x] website to test cc, real basic
- [x] demo app website
- [x] make sdk proper npm module
- [ ] change downloading zip to git clone
- [x] custom custom function on UI
- [x] load json in UI
- [x] structured error reponse
- [ ] mocha test for sdk
- [ ] browsify sdk and tie cci into it (not sure if i want to)
- [ ] follow redirect on zip download...
- [x] auto deploy, correctly!
- [x] get delete to update marbleIndex
- [ ] unzip may have project name as root... need to go down 1 lvl
- [x] sdk, check inputs on load if they  dne, error
- [o] poll after chain deploy for cc up in peer [can't, future auth will prevent]
- [ ] add block event to sdk
- [ ] write tutorial on phase 1
- [ ] move to socket.io


###ChainCode Notes:
1. Due to performance issues, we probably want resuable chaincode contracts.  ie 1 chaincode describe/constrains multiple people assets. ie ie many people and cars exist in 1 chaincode
1. Any functionality that parties need to agree on should be in the chaincode.  ie do not move it to the application b/c this then the moving parts beomce unenforceable.
1. Chaincode should keep track of all key's that get their state saved.  Have init clear these

###Junk Notes:
- npm install git+ssh://git@github.ibm.com:openblockchain/obc-js.git
- https://broker.obchain.com/api/peer/#network_id_peer_id/chaincode/#cc_name/logs
- National Business Merchandise
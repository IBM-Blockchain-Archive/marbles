#SimpleStuff <div style="font-size:12px;">an NBM Company</div>

##OBC - Javascript Demo
- examples of using sdk are in app.js near bottom

Run:

	> npm install
	> gulp
	> open browser to localhost:3000
	
	
Alternative Run:

	> npm install
	> node app.js
	> open browser to localhost:3000
	
	
##Projects Contents
1. sdk, obc-js.js
1. chaincode investigator
1. obc demo aka SimpelStuff
	
##Demo Description
This is a simple asset transfer and asset permission example.

##Goals Phase 1
- [x] User can create a marble and store it in the chaincode state
- [x] User can read all marbles in the chaincode state
- [x] User can transfer marble to another user
- [ ] See live block updates
- [ ] User can delete a marble

##Goals Phase 2
- [ ] ^^
- [ ] Can trade multiple marbles at once
- [ ] User's can advertise to trade their marbles (ie willing to trade large red for large blue/yellow/green)
- [ ] User identity and autentication


###Permissions:
1. Owner – can add/remove all permissions to the marble

###Attributes of a marble:
1. name
1. color
1. size
1. user

---

##ChainCode / SDK To Do:
- [x] Write("name", "val", cb);
- [?] ReadNames(cb)
- [x] init_thing(json);
- [ ] edit_thing(json);
- [ ] need multi var read in sdk! ie read(["car1", "car2"]); ... what if we do a lot here, like SQL syntax?
- [?] remember the name of all the saved vars in cc, and export this list so sdk can get it
- [ ] check permissions of requesting user in cc
- [ ] verify user identityf, ie public private key stuff
- [x] website to test cc, real basic
- [x] demo app website
- [x] make sdk proper npm module
- [ ] change downloading zip to git clone
- [x] custom custom function on UI
- [x] load json in UI
- [ ] mocha test for sdk
- [ ] browsify sdk and tie cci into it
- [ ] follow redirect on zip download...
- [ ] unzip may have project name as root... need to go down 1 lvl
- [ ] sdk, check inputs on load if they  dne, error
- [ ] poll after chain deploy for cc up in peer
- [ ] add block event to sdk


###ChainCode Notes:
1. Due to performance issues, we probably want resuable chaincode contracts.  ie 1 chaincode describe/constrains multiple people assets. ie ie many people and cars exist in 1 chaincode
1. Any functionality that parties need to agree on should be in the chaincode.  ie do not move it to the application b/c this then the moving parts beomce unenforceable.
1. Chaincode should keep track of all key's that get their state saved.  Have init clear these

###Junk Notes:
- npm install git+ssh://git@github.ibm.com:openblockchain/obc-js.git
- https://broker.obchain.com/api/peer/#network_id_peer_id/chaincode/#cc_name/logs
- National Business Merchandise
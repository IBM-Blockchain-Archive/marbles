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
1. User can create a ball and store it in the chaincode state
1. User can read all balls in the chaincode state
1. User can transfer ball to another user
1. User can see the owner of a ball
1. See live block updates

##Goals Phase 2
1. ^^
1. Can trade multiple balls at once
1. User's can advertise to trade their balls (ie willing to trade large red for large blue/yellow/green)


###Permissions:
1. Owner – can add/remove all permissions to the ball

###Attributes of a ball:
1. name
1. color
1. size
1. user

---

##ChainCode / SDK To Do:
- [x] Write("name", "val", cb);
- [?] ReadNames(cb)
- [ ] init_thing(json);
- [ ] edit_thing(json);
- [ ] need multi var read in sdk! ie read(["car1", "car2"]); ... what if we do a lot here, like SQL syntax?
- [?] remember the name of all the saved vars in cc, and export this list so sdk can get it
- [ ] check permissions of requesting user in cc
- [ ] verify user identityf, ie public private key stuff
- [x] website to test cc, real basic
- [ ] demo app website
- [x] make sdk proper npm module
- [ ] change downloading zip to git clone
- [x] custom custom function on UI
- [x] load json in UI
- [ ] mocha test for sdk
- [ ] browsify sdk and tie cci into it
- [ ] follow redirect on zip download...
- [ ] unzip may have project name as root... need to go down 1 lvl
- [ ] check inputs on load if they  dne, error
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
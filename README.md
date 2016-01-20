#Velocity <div style="font-size:12px;">an NBM Company</div>

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
1. obc demo
	
##Demo Description
This is a asset transfer and asset permission example.  Specifically for cars.

##Demo Goals
1. Owners and co-owners can change permissions for the car (transfer onwership, set drivers, etc)
1. View who (full name of person or company) has permissions on the car from a VIN #
1. Change ownership from entity to entity given VIN # and “ownership proof”
1. Confirm ownership given VIN # and “ownership proof” (test that your proof of ownership is working)
1. See historic owernship of cara, and/or prove who owned the car at a point in time

\* "ownership proof" = tbd, something with private/public keys

###Permissions:
1. Owner – can add/remove all permissions to the car
2. Co-owner – can add/remove non-owner permission to the car
3. Driver – can drive car
4. Passenger – can open the car doors
5. Guest – can drive the car for a pre-determined time period (mm/dd/yyyy – mm/dd/yyyy)

###Attributes of a car:
1. Users
1. Vin #
1. Make
1. Year
1. Licenses # 

###Attributes of a user:
1. user id
1. permissions
1. full name
1. address
1. public key

---

##ChainCode / SDK To Do:
- [x] Write("name", "val", cb);
- [?] ReadNames(cb)
- [?] init_person("user id", "full name", "address", "pub key");
- [?] init_car("vin #", "year", "make", "model", "user id");
- [?] attach_license("vin #", "license #", "user id"); 									//-user id is person performing action
- [?] get_permissions("vin #", "user id");
- [?] set_user_perms("vin #", "user id", "perm");
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


###NC Car Transfer Notes:
1. need proof of insurance
1. form of id
1. money

###ChainCode Notes:
1. Due to performance issues, we probably want resuable chaincode contracts.  ie 1 chaincode describe/constrains multiple people assets. ie ie many people and cars exist in 1 chaincode
1. Any functionality that parties need to agree on should be in the chaincode.  ie do not move it to the application b/c this then the moving parts beomce unenforceable.
1. Chaincode should keep track of all key's that get their state saved.  Have init clear these

###Junk Notes:
- npm install git+ssh://git@github.ibm.com:openblockchain/obc-js.git
- http://obchain.com:3000/api/peer/#network_id_peer_id/chaincode/#cc_name/logs
- National Business Merchandise
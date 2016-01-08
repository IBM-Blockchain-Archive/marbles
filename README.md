#OBC - Javascript Demo

- this is a whole node project atm.  obc-js can be found in /utils/obc-js.js
- examples using it in app.js near bottom

Run:

	> npm install
	> gulp
	
	
Alternative Run:

	> npm install
	> node app.js
	
	
	
##Demo Description
This is a asset transfer and asset permission example.  Specifically for cars.

##Demo Goals
1. Owners and co-owners can change permissions for the car (transfer onwership, set drivers, etc)
1. View who (full name of person or company) has permissions on the car from a VIN #
1. Change ownership from entity to entity given VIN # and “ownership proof”
1. Confirm ownership given VIN # and “ownership proof” (test that your proof of ownership is working)

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
1. Permissions
1. full name
1. address
1. public key
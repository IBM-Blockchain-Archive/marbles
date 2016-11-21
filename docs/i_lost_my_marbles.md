*Note while this guide is written for debugging Marbles on our Bluemix IBM Blockchain service it is still relevant for a custom app using a custom IBM Blockchain* 

#Marbles Debug Help

So you think marbles is totally broken, nothing is working right and this whole thing is lame. 
I can at least assure you that marbles is not broken. 
Let’s start at the very beginning and check things off one by one. 

**Game Plan**

1. [Check if the network is showing signs of life](#step1)
1. [Check if the marbles app is registering users for the permissioned network](#step2)
1. [Check if marbles is deploying chaincode successfully](/#step3)
1. [Check if marbles backend is reaching chaincode functions](#step4)
1. [Check if marbles frontend is sending its actions](#step5)
1. [Turn it off and back on again](#step6)


**[ Step 0 ]**

Lets double check some environmental setup before moving on! 
While each marble version should run fine, its best to grab the newest version. Clone the repo again.

Also make sure your node modules (especially the latest SDK [ibm-blockchain-js](https://github.com/IBM-Blockchain/ibm-blockchain-js/blob/master/package.json)) are up to date by running:

```
(from a command line/terminal browse to the marbles folder)
npm update
```

<a name="step1"></a>
**[ Step 1 ]**

We need to first check off that your network is running correctly. 
The best way to do this is to open your networks monitor page. 
What we want to see is 4 peers and a CA with the status of "running". 
What we do not want to see is missing peers, or peers with a "stopped" status. 
Follow the instructions in [this section](#peer-or-chaincode-logs) to get to the monitor page, and while you are there check the peer logs to see if there is anything suspicious.

Results:

- *Everything looks okay*
	- Great, meet me at step 2
- *Anything else*
	- You should delete this network and create another one. if this happens multiple times you should contact us
	
	
<a name="step2"></a>
**[ Step 2 ]**

Right so next is to verify if the marbles app is registering secure context users or not. 
To do this we need to take a look at the logs from node.js. 
Depending on your marble setup you either need to get to your [Bluemix Node.js Logs](#bluemix-node.js-logs) or your [Local Machine Node.js Logs](#local-machine-node.js-logs). 

Now that you have access to your logs let’s find the relevant logs for user registration. 
The SDK will print messages similar to the ones below to the console:
	
	[ibc-js] Peer:  vp1-3a82c724-6934-4575-87d8-047eefdcf25d_vp1-api.blockchain.ibm.com:80
	[ibc-js] Peer:  vp2-3a82c724-6934-4575-87d8-047eefdcf25d_vp2-api.blockchain.ibm.com:80
	[ibc-js] Registering  vp1-3a82c724-6934-4575-87d8-047eefdcf25d_vp1-api.blockchain.ibm.com:80  w/enrollId - user_type1_3fe7935193
	[ibc-js] Registering  vp2-3a82c724-6934-4575-87d8-047eefdcf25d_vp2-api.blockchain.ibm.com:80  w/enrollId - user_type1_0c8e9f05b2
	[ibc-js] Registration success: user_type1_0c8e9f05b2
	[ibc-js] Registration success: user_type1_3fe7935193

Ideally your logs look like mine above. 
They may be spaced differently by having other lines in between these ones.

Results:

- *I have registration failure message(s)*
	- Nuts, so here are a few issues that may cause this:
		- You fed it incorrect enroll IDs and/or secrets. Verify if the enroll ID printed out correctly matches one from your services credentials list
		- You fed it incorrect peer host/ports. Verify the hostname/ports are the same as the ones you see in your network's monitor page.
		- Verify if your peers are still running (we did this in step 1 though...)
		- You have previously registered this enroll ID to a different peer. This is not allowed. A enroll ID can only be registered against 1 peer. (re-registering a enroll ID against the same peer is fine though)
		- You must have at least one registered enroll ID for marbles. If only one works edit the list of peers/users you feed marbles to only contain this one.
		- Check the [logs for CA](#peer-or-chaincode-logs) for any clues (same instructions as peer logs)
		- If nothing is working, delete this network and create another
- *I don't see any registration messages at all*
	- So either you did not feed `ibc.load()` any enroll IDs or you did not feed it any appropriate enroll IDs. An apporiate enroll ID is one that contains "type_1" in the name. Any other names get filtered out by `ibc.load`.
		- If this is problematic for you (ie you have a custom IBM Blockchain Network) then you need to build a custom `ibc.load()` out of the other SDK functions. `ibc.load()` purpose is to make deploying to standard IBM Blockchain Networks easy. If you have a custom network you should create your own function that mimics `ibc.load()` (tear it apart and look at it!). You would only need to omit `filter_users()`, and possibly change what users/peer relation you want with your own calls to `ibc.register()`.
- *Everything looks okay*
	- Glad to hear it, lets go to step 3
	
	
<a name="step3"></a>
**[ Step 3 ]**

Next we want to see if the marbles app deployed its chaincode successfully. 
The first place I'd look is in the networks monitor page. 
Follow the instructions in [this section](#peer-or-chaincode-logs) to get to the monitor page. 

Check the bottom table. 
Does it have a row with a chaincode hash? 
If it does you can probably go to step 4.
If it does not then we should look at the logs for your node app again. 
Even if it the chaincode row is present you may still want to verify the deploy logs from your node app.
What we are looking for is: 
	
	[ibc-js] Deploying Chaincode - Starting
	[ibc-js]        function: init , arg: [ 'abc', '99']


			Waiting...
			deploy success [wait 1 more minute]
	[ibc-js] Deploying Chaincode - Complete

Its not important if the arguments in the init function do not match mine. 
Though it is important that your deploy function tried to call some function that does exist in your chaincode. 
If you see "function: undefined, arg: undefined" you have not specified a function to be called on deploy which is out of spec. 
What you do want to match is the success message at the bottom. 
You may find that the sdk did not even attempt to deploy and a failure happened before it got to that point. 

Results:

- *I see a failure/error messages before deploy even happens*
	- First off try to make sense of the specific error that was also printed.
	- If you see anything like "fs readdir Error" check the  `unzip_dir` and `zip_url` field in the options objefct you passed to `ibc.load()`. To do this manually download the git repo using the `options.chaincode.zip_url` then extract it.  The `gir_dir` var should be the exact relative path to get to the desired cc folder
	- This is likely some sort of node.js error and has nothing to do with the blockchain Network.  Try StackOverflow and Google to figure it out.
- *I see a deploy failure messages*
	- There could be many causes for this. 
		- First off try to make sense of the specific error that was also printed.
		- If you see anyhing like "error code 2" then your chaincode has build issues and cannot be compiled. Manually build your chaincode and look at the compiler errors.
		- If you see antyhing like "401 unauthorized" message then you have not passed it a secure context username that has been successfully registered. (we did this in step 2 though)
		- You fed it incorrect peer host/ports. Verify the hostname/ports are the same as the ones you see in your network's monitor page.
		- Verify if your peers are still running (we did this in step 1 though...)
		- Check the [logs for the peer](#peer-or-chaincode-logs) for any clues, you are probably deploying to peer 1.
		- If nothing is working, delete this network and create another
- *Everything looks okay*
	- Wohoo, let’s go to step 4


<a name="step4"></a>
**[ Step 4 ]**

The next thing we can do is figure out if marbles is actually reaching the chaincode or not. 
We will need to open the logs for the chaincode container. 
Follow the instructions in [this section](#peer-or-chaincode-logs) to get to the monitor page. 

Check the bottom table. 
It should have at least one chaincode listed. 
Find the one with the correct hashed chaincode name and open the logs for the chaincode container on Peer 1 (click the file like icon). 
Go to the "Create" tab in your marble app and create a new marble. 
Now flip back to the logs and refresh the page. 
Ctrl + F the page and look for the logs below:


	OUT - run is running init_marble
	OUT - - start init marble
	ERR - 2016/03/15 13:50:55 [66b47025]Received message RESPONSE from shim
	ERR - 2016/03/15 13:50:55 [66b47025]Handling ChaincodeMessage of type: RESPONSE(state:transaction)
	ERR - 2016/03/15 13:50:55 [66b47025]before send
	ERR - 2016/03/15 13:50:55 [66b47025]after send
	ERR - 2016/03/15 13:50:55 [66b47025]Received RESPONSE, communicated (state:transaction)
	ERR - 2016/03/15 13:50:55 [66b47025]Received RESPONSE. Successfully updated state
	ERR - 2016/03/15 13:50:55 [66b47025]Sending GET_STATE
	...

Results:

- *I do not see any init_marble messages*
	- Double check you are looking at the correct container log, you may want to open the other one.
	- It may be that this network is unreachable for unknown reasons. Try manually creating a HTTP request to invoke your cc function. I like to use the browser plugin/extension called Postman. If you still can't reach it delete the network and create another. 
	- Potentially your marbles app is having client side JS errors and is never sending its rest requests, lets go to step 5. 
- *I see a init_marble message and see nearby error messages*
	- First off try to make sense of the specific error that was also printed.
	- Sounds like the marble app is not formatting the rest requests correctly. Specifically the body. The error you see should indicate what is wrong. It may be as simple as a cc input argument is numeric when it should be a string. Or you do not have enough input arguments for the cc function you called. To make these changes look in `/utils/ws_part1.js` or `/utils/ws_part2.js`. Search for the function name that is problematic (like init_marble).
- *Everything looks okay*
	- Hmm ok, so let’s go to step 5.
	
	
<a name="step5"></a>
**[ Step 5 ]**

Our final stop is to examine the client side JS debug messages. 
- Browse to your marbles app in Chrome or Firefox
- Right click the page and select "Inspect Element" or "Inspect"
- Lets open the JS console by click the tab labeled "Console"
- Go through the flow of creating a marble and let’s look at the console logs.  They should look similar to mine:

```
creating marble
creating marble, sending Object {type: "create", name: "r12sref", color: "black", size: "35", user: "bob"…}
getting new balls
```

Results:

- *I see a JS error of some sort*
	- Vanilla marbles should have no errors, so you probably edited something right? 
		- The most common JS error is if you try to index into something that is null.  IE this code will throw an error: var test = null; if(test.hi){}.
		- I hate to leave you alone now but this is not a blockchain problem. Try copying the error into StackOverflow or Google to figure it out.
- *Everything looks okay*
	- Ah, ok. Onward to step 6 


<a name="step6"></a>
**[ Step 6 ]**

You went through all the steps and nothing was wrong yet marbles is still not behaving correctly? 
Well I'm stumped. 
The last resort is to wipe it all clean. Delete the app and delete the service. 
Download it again and start anew. 
Please bear with us as we mature this sevice. 
Your patience and enthusiasm is greatly appreciated!

***

#Bluemix Node.js Logs
So first up. Do not debug initial setup errors on a Bluemix app. 
You should really verify if marbles (or your own app) runs locally before debugging it here. 
The only reason to debug the app running on Bluemix is when it runs locally but doesn't seem to run on Bluemix. 
This is for your own sanity. 
Debugging common setup issues (aka typos, misunderstood options, pathing problem) can take several iterations that ideally are super quick. 
Deploying to Bluemix is a 2-3 minute process.
If it takes you 4 attempts to fix the issue then you lost 12 minutes of your life.
Deploying locally is a 1-3 second process. 
Node.js is painless to install on Linux/Windows, so you don't have any excuses! 

OK so your app runs fine locally but is acting strangely or not at alllll on Bluemix. 
Let’s get to the console logs your app is printing. 

**[1]** - Start off by installing the Cloud Foundry Command Line Tool
- [download](https://github.com/cloudfoundry/cli/releases) an installer for your OS
- run the installer
- lets test it by opening a command prompt or terminal window and typing
	
		> cf
		You should see a bunch of text.
		If you get something like command not found, then your installation was either not successful or CF is not added to your system path.
		Windows/Linux/Mac have different ways to add stuff to your PATH so you will need to look it up for your OS.
	
**[2]** - Login to CF
- open a command prompt or terminal window
- type:
	
	
		> cf api https://api.ng.bluemix.net 
		> cf login
		(follow the prompts to enter your Bluemix ID and password)
			
		if you are prompted to pick a space then pick one of the ones listed by typing its # as seen below.  
		(spaces are used to organize your Bluemix apps/services)
		> 1
		
**[3]** - View your live app logs
- great now we are ready to view logs for our app
	
	
		> cf logs <YOUR_APP_NAME_HERE>
	
- you should see some messages about it connecting and then you will be getting the console logs from your application!
	- you will find that the logs are a bit delayed by around 10-30 seconds
- go to the url that your Bluemix app is hosted on and refresh the page to generate some logs
- the most important logs for setup debugging are at the top near the ------------ Server Up - x.x.x.x:xxxx ------------ line
- you will likely want to restart your app to get to logs that are relevant
- it is possible to see a few past logs if you use the command below (this version however is not live)


		> cf logs <YOUR_APP_NAME_HERE> --recent

#Local Machine Node.js Logs
Right so local machine logs...
You will find node.js logs on the same command prompt/terminal that you used to start the node app. 
So. Look at your screen. 
Like this screen, assuming you are running the app on the same machine you are reading this very sentence with.
Well you might have multiple monitors and you should be looking at that screen over there --> or even that other shifty looking monitor on the other side <--.
You may even have to move windows around, but I can sense it. Your logs are nearby.
- the most important logs for setup debugging are at the top near the ------------ Server Up - x.x.x.x:xxxx ------------ line
- you will likely want to restart your app to get to logs that are relevant

#Peer or ChainCode Logs
Peer logs will detail peer to peer chatter, peer to chaincode communication, and API rest calls. 
Our handy monitor page has a link to view specific peer logs and chaincode logs.
These instructions assume you have already created a service and are trying to debug a problematic one. 

**Get to your service's monitor page:**
- Login to [Bluemix](https://console.ng.bluemix.net/login)
- You probably landed on the Dashboard, but double check the top nav bar.  Click the "Dashboard" tab if you are not already there. 
- Also make sure you are in the correct "space".  ie the place where you told Bluemix to store your IBM Blockchain service. The space's navigation is on the left. 
- There is a "Services" panel on this Bluemix dashboard near the bottom.  Look through your services and click your IBM Blockchain service square. 
- Great now you should see a white page with the words "Welcome to the IBM Blockchain blah blah" and there should be a teal "LAUNCH" button on the right, click it. 
- Fantastic job. Now you are on the monitor page and you should see 2 tables, though the bottom one may be empty.
	- **Peer Logs** will be found in the "Logs" tab on the top navigation bar. Click it. 
		- From the list of peers click one! It should have opened a new window. Congratulations you found your peer logs!
	- **ChainCode Logs** will be found in the bottom table. There is one row for every chaincode and they are labeled using the same chaincode hash that was returned to you when it was deployed. Find the cc id you want, and then select the peer. Finally click the file like icon.
		- It should have opened a new window. Congratulations you found your peer's chaincode's logs!

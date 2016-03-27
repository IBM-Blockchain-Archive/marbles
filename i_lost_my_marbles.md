#Marbles Debug Help

So you think marbles is totally broken, nothing is working right and this whole thing is lame. 
I can at least assure you that marbles is not broken. 
Let’s start at the very beginning and check things off one by one. 

**Game Plan**

1. Check if the network is showing signs of life
1. Check if the marbles app is registering users for the permissioned network
1. Check if marbles is deploying chaincode successfully
1. Check if marbles is reaching chaincode functions
1. Turn it off and back on again

**[ Step 1 ]** 

We need to first check off that your network is running correctly. 
The best way to do this is to open your networks monitor page. 
What we want to see is 2 peers (validating peer 1 and 2) and a CA with the status of "running" or "up for x time". 
What we do not want to see is missing peers, or peers with an "exited" status. 
Follow the instructions in [this section](#Peer or ChainCode Logs) to get to the monitor page, and while you are there check the peer logs to see if there is anything suspiouse.

Results:

- *Everything looks okay*
	- Great, meet me at step 2
- *Anything else*
	- You should delete this network and create another one. if this happens multiple times you should contact us
	
	
**[ Step 2 ]**

Right so next is to verify if the marbles app is registering secure context users or not. 
To do this we need to take a look at the logs from node.js. 
Depending on your marble setup you either need to get to your [Bluemix Node.js Logs](#) or your [Local Machine Node.js Logs](#). 

Now that you have access to your logs lets find the relevant logs for user registration. 
The SDK prints these out and they look like so:
	
	[ibc-js] Peer:  vp1-3a82c724-6934-4575-87d8-047eefdcf25d_vp1-api.blockchain.ibm.com:80
	[ibc-js] Peer:  vp2-3a82c724-6934-4575-87d8-047eefdcf25d_vp2-api.blockchain.ibm.com:80
	[ibc-js] Registering  vp1-3a82c724-6934-4575-87d8-047eefdcf25d_vp1-api.blockchain.ibm.com:80  w/enrollID - user_type1_3fe7935193
	[ibc-js] Registering  vp2-3a82c724-6934-4575-87d8-047eefdcf25d_vp2-api.blockchain.ibm.com:80  w/enrollID - user_type1_0c8e9f05b2
	[ibc-js] Registration success: user_type1_0c8e9f05b2
	[ibc-js] Registration success: user_type1_3fe7935193

Ideally your logs look like mine above. 
They may be spaced differently by having other lines in between these ones.

Results:

- *I have registration failure message(s)*
	- Nuts, so here are a few issues that may cause this:
		- You fed it incorrect usernames and/or secrets. Verify if the username printed out correctly matches one from your services credentials list
		- You fed it incorrect peer host/ports. Verify the hostname/ports are the same as the ones you see in your network's monitor page.
		- Verify if your peers are still running (we did this in step 1 though...)
		- You have previously registered this username to a different peer. This is not allowed. A username can only be registered against 1 peer. (re-registering a username against the same peer is fine though)
		- You must have at least one registered username for marbles. If only one works edit the list of peers/users you feed marbles to only contain this one.
		- Check the [logs for CA](#) for any clues (same instructions as peer logs)
		- If nothing is working, delete this network and create another
- *Everything looks okay*
	- Glad to hear it, lets go to step 3
	
	
**[ Step 3 ]**
Next we want to see if the marbles app deployed its chaincode successfully. 
The first place I'd look is in the networks monitor page. 
Follow the instructions in [this section](#Peer or ChainCode Logs) to get to the monitor page. 

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
What you do want to match is the success message at the bottom. 
You may find that the sdk did not even attempt to deploy and a failure happened before it got to that point. 

Results:

- *I see a failure/error messages before deploy even happens*
	- First off try to make sense of the specific error that was also printed.
	- If you see anything like "fs readdir Error" check the  `unzip_dir` and `zip_url` field in the options objefct you passed to `ibc.load()`. Manually download the git repo using the `options.chaincode.zip_url` then extract it.  The `gir_dir` var should be the exact relative path to get to the desired cc folder
	- This is likely some sort of node.js error and has nothing to do with the blockchain Network.  Try stackoverflow and google to figure it out.
- *I see a deploy failure messages*
	- There could be many causes for this. 
		- First off try to make sense of the specific error that was also printed.
		- If you see anyhing like "error code 2" then your chaincode has build issues and cannot be compiled. Manually build your chaincode and look at the compilers errors.
		- If you see antyhing like "401 unathorized" message then you have not passed it a secure context username that has been successfully registered. (we did this in step 2 though)
		- If you see anything like "fs readdir Error" check the  `unzip_dir` and `zip_url` field in the options objefct you passed to `ibc.load()`. Manually download the git repo using the `options.chaincode.zip_url` then extract it.  The `gir_dir` var should be the exact relative path to get to the desired cc folder
		- You fed it incorrect peer host/ports. Verify the hostname/ports are the same as the ones you see in your network's monitor page.
		- Verify if your peers are still running (we did this in step 1 though...)
		- You have previously registered this username to a different peer. This is not allowed. A username can only be registered against 1 peer. (re-registering a username against the same peer is fine though)
		- Check the [logs for the peer](#) for any clues, you are probably deploying to peer 1.
		- If nothing is working, delete this network and create another
- *Everything looks okay*
	- Wohoo, lets go to step 4


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
- lets test it by open a command prompt or terminal window and typing
	
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
	- **Peer Logs** will be found in the top table. Find the row for the peer you have been talking to (probably peer 1) and then click the file like icon in the last row.
		- It should have opened a new window. Congratulations you found your peer logs!
		- In addition to this static view we have live **streaming peer logs** in the "View Logs" tab near the top of the page
	- **ChainCode Logs** will be found in the bottom table. There is one row for every chaincode and they are labeled using the same chaincode hash that was returned to you when it was deployed. Find the cc id you want, and then select the peer. Finally click the file like icon.
		- It should have opened a new window. Congratulations you found your peer's chaincode's logs!

#General Trouble Shooting
1. Open the console in your browser (right click the page, inspect element, open console tab). There are lots of debug prints to help give you clues.
1. If it still doesn't work try deleting the current network and creating another one

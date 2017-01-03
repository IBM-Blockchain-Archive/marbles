#Run Marbles on Bluemix

###Run Marbles on Bluemix (command line)

1. Well to do this correctly you need to first [run marbles locally](./host_marbles_locally.md).
1. Seriously make sure marbles starts up completely and you have traded a marble successfully before you continue.
1. Edit manifest.yml 
	- change the app name and host name since "marbles" is taken
	- remove lines 9 and 10 so that your file looks like:

	```
	---
	applications:
	- disk_quota: 1024M
	  name: CUSTOM_NAME_HERE
	  command: "node app.js"
	  path: "."
	  instances: 1
	  memory: 512M
	```

1. Install the Cloud Foundry Command Line Tool
	- [download](https://github.com/cloudfoundry/cli/releases) an installer for your OS
	- run the installer
	- lets test it by opening a command prompt or terminal window and typing
		
			> cf
			You should see a bunch of text.
			If you get something like command not found, then your installation was either not successful or CF is not added to your system path.
			Windows/Linux/Mac have different ways to add stuff to your PATH so you will need to look it up for your OS.
	
1. Login to CF
	- open a command prompt or terminal window
	- type:
		
			> cf api https://api.ng.bluemix.net 
			> cf login
			(follow the prompts to enter your Bluemix ID and password)

1. Push the application by opening a command prompt and browsing to this directory
	
	> cf push YOUR_APP_NAME_HERE 

1. This can take some time to complete (1-3 minutes). You will see logs from Bluemix but they will stop once the app launches. To see logs from marbles during its start up open a new terminal/command prompt and type:

	> cf logs YOUR_APP_NAME_HERE

1. If all goes well you should see this message in the console:
	
		--------------------------------- Server Up - localhost:3000 ------------------------------------
		
1. The app is already coded to auto deploy the chaincode.  You should see further message about it deploying.
 **[IMPORTANT]** You will need to wait about 60 seconds for the cc to fully deploy. The SDK will do the waiting for us by stalling our callback.
 
1. Once you see this message you are good to go: 
		
		[ibc-js] Deploying Chaincode - Complete
		---------------------------------------- Websocket Up ------------------------------------------

1. Marbles is running! Now [Continue tutorial 1](./tutorial_part1.md#use).

# Run Marbles on Bluemix

### Run Marbles on Bluemix (command line)

1. Well to do this correctly you first need to [run marbles locally](./host_marbles_locally.md).
1. Seriously make sure marbles on your local machine starts up and you have traded a marble successfully before you continue. You do not want to troubleshoot config settings with the Bluemix flow. It will take forever and you may lose your mind. 
1. Edit `manifest.yml`.  This file is in the root of your marbles directory.
	- We need to change the application **name** in this file since "marbles" is taken. Try to pick a unique name (or else the next steps will fail, and you will have to try again).

	```
	---
	applications:
	- disk_quota: 1024M
	  name: CUSTOM_NAME_HERE
	  command: "node app.js"
	  path: "."
	  instances: 1
	  memory: 256M
	```

1. Install the Cloud Foundry Command Line Tool
	- [Download](https://github.com/cloudfoundry/cli/releases) an installer for your OS
	- Run the installer
	- Lets test it by opening a command prompt or terminal window and typing
		
			> cf
	
	- You should see a bunch of text.
	- If you get something like command not found, then your installation was either not successful or CF is not added to your system path.
			Windows/Linux/Mac have different ways to edit the PATH therefore look up instructions for your OS.
	
1. Login to CF
	- Open a command prompt or terminal window
	- Type:
		
			> cf api https://api.ng.bluemix.net 
			> cf login
			(follow the prompts to enter your Bluemix ID and password)

1. Push the application by opening a command prompt and browsing to your marbles directory
	
		> cf push YOUR_APP_NAME_HERE 

1. This can take some time to complete (1-3 minutes). You will see logs from Bluemix, but they will stop once the app launches. 
	- To see logs from marbles during and after its start up open a second terminal/command prompt and type:

		> cf logs YOUR_APP_NAME_HERE

	- If you missed the start up logs try:

		> cf logs YOUR_APP_NAME_HERE --recent

1. If all goes well you should see this message in the console:
	
		--------------------------------- Server Up - 0.0.0.0:xxxx ------------------------------------
		
1. Once you see the message below you are good to go: 
		
		---------------------------------------- Websocket Up ------------------------------------------

1. Marbles is running! Now [continue the tutorial](../README.md#use).

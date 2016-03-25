#Marbles Debug Help

So you think marbles is totally broken, nothing is working right and this whole thing is lame. 
I can at least assure you that marbles is not broken. 
Lets start at the very begining and check things off one by one. 

**Game Plan**

1. Check if the network is showing signs of life
1. Check if the marbles app is registering users for the permissioned network
1. Check if marbles is deploying chaincode successfully
1. Check if marbles is reaching chaincode functions
1. Turn it off and back on again


#Network Peer Logs

#Chaincode Logs

#Bluemix Node.js Logs
So first up. Do not debug initial setup errors on a Bluemix app. 
You should really verify if marbles (or your own app) runs locally before debugging it here. 
The only reason to debug the app running on Bluemix is when it runs locally but doesn't seem to run on Bluemix. 
This is for your own sanity. 
Debugging common setup issues (aka typos, misunderstood options, pathing problem) can take several interations that ideaaly are super quick. 
Deploying to Bluemix is a 2-3 minute process.
If it takes you 4 attempts to fix the issue then you lost 12 minutes of your life.
Deploying locally is a 1-3 second process. 
Node.js is painless to install on linux/windows, so you don't have any excusses! 

OK so your app runs fine locally but is acting strangely or not at alllll on Bluemix. 
Lets get to the console logs your app is printing. 

**[1]** - Start off by installing the Cloud Foundry Command Line Tool
- [download](https://github.com/cloudfoundry/cli/releases) an installer for your OS
- run the installer
- lets test it by open a command prompt or terminal window and typing
	
		> cf
		You should see a bunch of text.
		If you get something like command not found then your installation was either not successful or CF is not added to your system path.
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
- go to the url that your bluemix app is hosted on and refresh the page to generate some logs
- the most important logs for setup debugging are at the top near the ------------ Server Up - x.x.x.x:xxxx ------------ line
- you will likely want to restart your app to get to logs that are relevent
- it is possible to see a few past logs if you use the command below (this version however is not live)


	> cf logs <YOUR_APP_NAME_HERE> --recent

#Local Machine Node.js Logs
I'm not totally sure if I need this section, but if you are reading this then, ah, well, ok lets do this.
You will find node.js logs on the same command prompt/terminal that you used to start the node app. 
So. Look at your screen. 
Like this screen, assuming you are running the app on the same machine you are reading this very sentence with.
Well you might have multiple monitors and you should be looking at that screen over there --> or even that other shifty looking monitor on the other side <--.
You may even have to move windows around, but I can sense it. Your logs are nearby.

#General Trouble Shooting
1. If you can't get the app to reflect a new change try refreshing the browser
1. Use the dashboard on the Bluemix service tile to verify if the chaincode was deployed and that your peers are running. You may get into the chaincode/peer logs from here.
	- If there is no chaincode listed, get into the logs and figure out what happened
1. Look at the node.js console logs for clues/errors (if using Bluemix do cf logs YOUR_APP_NAME, if localhost look at your screen buddy)
	- If you want to see recent but historic logs when using Bluemix type cf logs YOUR_APP_NAME --recent in your command line/terminal
	- The logs that are most helpful are right at the beginning. After the ------------ Server Up - x.x.x.x:xxxx ------------ line.
1. Open the console in your browser (right click the page, inspect element, open console tab). There are lots of debug prints to help give you clues.
1. If it still doesn't work try deleting the current network and creating another one

#Common  Node Console Errors & Solutions

1. **500 - ECONNREFUSED** - Check the peers in your options.network.peers.  They likely do not exist / are wrong
1. **400 - Must supply username for chaincode** - Check if you see a "Register - failure: userx 401" message.  if so delete and remake the network
1. **401 - Register - failure** - Check the logs of the CA / peer.  If they mention something about an expired certificate delete and remake the network. Logs can be found on the dashboard for the network on Bluemix.
1. **400 - Error getting chaincode package bytes:...** - Check the options.chaincode.git_url, it is likely incorrect
1. **fs readdir Error** - Check the `options.chaincode.unzip_dir` and `zip_url`. Manually download the git repo using the `options.chaincode.zip_url` then extract it.  the `gir_dir` var should be the exact relative path to get to the desired cc folder
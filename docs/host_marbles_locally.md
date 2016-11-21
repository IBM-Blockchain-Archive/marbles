#Host Marbles Locally:

###<a name="runlocal"></a>Run Marbles
Lets do the very last setup for marbles.

1. Finally lets install marble's npm dependencies. Open a command prompt/terminal and browse to the root of this project.
1. In the command prompt type:
	
		> npm install gulp -g
		> npm install
		> gulp
		
1. If all goes well you should see this message in the console:
	
		--------------------------------- Server Up - localhost:3000 ------------------------------------
		
1. The app is already coded to auto deploy the chaincode.  You should see further message about it deploying.
 **[IMPORTANT]** You will need to wait about 60 seconds for the cc to fully deploy. The SDK will do the waiting for us by stalling our callback.
 
1. Once you see this message you are good to go: 
		
		[ibc-js] Deploying Chaincode - Complete
		---------------------------------------- Websocket Up ------------------------------------------

1. Marbles is running! Now [Continue tutorial 1](./tutorial_part1.md#use).

# Host Marbles Locally:

### <a name="runlocal"></a>Run Marbles
 Finally lets install marble's npm dependencies.

1. Open a command prompt/terminal and navigate to the marbles directory.
1. In the command prompt/terminal type:
	
		> npm install gulp -g
		> npm install

1. Next up, pick the command that matches your setup. This will run marbles.

- **Option 1:** :lollipop: If you are using a local network use this command:
	> gulp marbles_local

- **Option 2:** If you are using a bluemix network, use this command:
	> gulp marbles_tls

1. If all goes well you should see this message in the console:

![](/doc_images/localhost1.png)

1. Go to your browser at the url specified in the console and login. You do not need to enter a password or change the prefilled username of `admin`.

![](/doc_images/localhost2.png)
	

1. Next the set up panel should pop up. Ideally it will walk itself through the 3 stages of initial setup.
	1. Enroll Admin - this step is communicating with your network's CA to verify the admin user credentials (enrollID/enrollSecret)
		- If it fails double check the enrollID and enrollSecret fields in your blockchain credentials file
	1. Finding Chaincode - this step is looking for the marbles chaincode on your peer. It is using the chaincode ID found in your blockchain credentials file. If this is a brand new network it will not exist yet. 
		- If the chaincode was instantiated but it was unable to find it try the "Retry" button.
	1. Register Marble Owners - this step will create the marble owners you specified in the marbles configuration JSON file
		- This can take awhile 1-2minutes. Check your console logs for progress.
 
![](/doc_images/localhost3.png)

1. Once you see this message you are good to go: 

![](/doc_images/localhost4.png)
		
1. Marbles is all setup! Now [continue the tutorial](../README.md#use).

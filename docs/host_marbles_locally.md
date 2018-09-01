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
    
      - **Option 2:** If you are using a IBM Cloud Blockchain network, use this command:
    	> gulp marbles_tls
    
1. If all goes well you should see this message in the console:
    
    ![](/doc_images/localhost1.png)
    (it is OK if the console output says "NOT launched successfully yet"). 
    If you tried to used gulp marbles_local, but got errors such as "Failed to load user "admin" from local key value store. Error: Error: Private key missing from key store. Can not establish the signing identity for user admin" even though the "client" section of the local connection profile JSON file contains the correct path reference in "client.credentialStore.path", then you might be subject to a bug described in https://jira.hyperledger.org/browse/FAB-2593. In such a case, backup the contents of the (hidden) directory $HOME/.hfc-key-store and copy all the files from the directory /$HOME/fabric-samples/fabcar/hfc-key-store to $HOME/.hfc-key-store (do not delete $HOME/.hfc-key-store and do not copy the /$HOME/fabric-samples/fabcar/hfc-key-store itself into /$HOME ). After copying the files, re-run gulp marbles_local
    
1. Go to your browser at the url specified in the console and login. You do not need to enter a password or change the prefilled username of `admin`.
    
    ![](/doc_images/localhost2.png)
        
1. Next the set up panel should pop up. Ideally it will walk itself through the 3 stages of initial setup.
    	1. Enroll Admin - this step is communicating with your network's CA to verify the admin user credentials (enrollID/enrollSecret)
    		- If it fails double check the enrollID and enrollSecret fields in your blockchain connection profile
    	1. Finding Chaincode - this step is looking for the marbles chaincode on your peer. It is using the chaincode ID found in your blockchain connection profile. If this is a brand new network it will not exist yet.
    		- If the chaincode was instantiated but it was unable to find it try the "Retry" button.
    	1. Register Marble Owners - this step will create the marble owners you specified in the marbles configuration JSON file
    		- This can take awhile 1-2minutes. Check your console logs for progress.
    
    ![](/doc_images/localhost3.png)
    
1. Once you see this message you are good to go:
    
    ![](/doc_images/localhost4.png)
    
1. Marbles is all setup! Now [continue the tutorial](../README.md#use).

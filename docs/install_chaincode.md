# Install and Instantiate Chaincode w/Bluemix

1. If you are not currently on the Blockchain "Resources" page... then get there via:
    1. Login to [Bluemix](https://console.ng.bluemix.net) 
    1. Get to your dashboard by clicking the "Menu" icon on the top left and then clicking the "Dashboard" link
    1. Under "All Services" locate your the Blockchain row and click it
    1. Enter your IBM Blockchain Service's dashboard by clicking the "Enter" button

1. If you are on the "Resources" page already, then click the "Chaincode" link on the left navigation

![](/doc_images/9-chaincode.PNG)

- Select 1 of your peers in the drop down
- Now click the "Install Chaincode" button

![](/doc_images/10-install-marbles.PNG)

- Fill out the chaincode name as "marbles"
- Fill out the chaincode version as "v0"
- Select the "Choose Files" button and select **all** the files found in `<marbles directory>/chaincode/src/marbles`
    - Alternatively you can zip up the .go files and submit a single zip file
- Click "Submit"

![](/doc_images/11-installed-marbles.PNG)

- Great, so you should see marbles listed in the chaincode table for this peer.
- All we've done so far is upload the files ont the peer. Next, we need to tell it what channel to run on.
- Click the 3 dots in the "ACTIONS" column to open the actions menu. Then click "Instantiate".

![](/doc_images/12-instantiate-marbles.PNG)

- The arguments input box is for entering the arguments we want to pass to our chaincode's Init() function.
    - Typically, this is an array of strings.  As you type you can see exactly what will be sent in the lower input named "Chaincode Arguments".
- Marbles chaincode is expecting a single numeric input argument. Therefore, enter your favorite number. Mines 314. 
    - Marbles chaincode will store this number to the ledger as a self-test of sorts. It can literally be any number you want. 
- Next from the "Channel" drop down, select our 1 and only channel
- Then click the "Submit" button
- If it went well the chaincode page will refresh

![](/doc_images/13-instantiated-marbles.PNG)

- Now that the chaincode has been instantiated on the channel, let's look at it
- Click the "Channels" link on the left navigation
- Click the channel you instantiated marbles on
- Click the "Chaincode" sub-tab
- On this panel, you should see something similar to the picture above.  Marbles is instantiated on at least one peer
- Expand the row to see which peer
- Click the log button to see if marbles started up. You should log messages like:

```
    Marbles Is Starting Up
    Init() args count: 1
    Init() args found: [101]
    Init() arg[0] length 3
    args[0] is not empty, must be instantiating
     - ready for action
```

- The last thing we need to do is grab all the service instance's credentials for our network. We will use this data to inform the marbles node.js application of our blockchain's networking addresses and credentials.
- Get the service credentials by clicking the "JSON" button under the "App Integration" column (you may need to expand the chaincode row first)
- **Important:** This will open the JSON in your browser. Copy this data and save/replace the entire contents of the file `<marbles directory>/config/blockchain_creds_tls.json` 
  - This JSON contains all the details needed to connect to your network. 
  - Marbles will read this file to connect and transact on your network on this channel.

### Finish Up

Congrats! The network is all setup and marbles chaincode is running. 

- Continue where you left off in the [tutorial](../README.md#hostmarbles).


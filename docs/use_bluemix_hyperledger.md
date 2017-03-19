# Use Bluemix IBM Blockchain Service:

### Creating a Blockchain Network in IBM Bluemix
1. Don't fret, this is as simple as clicking on a particular button and filling out a text input field or two, or three. 
  Meh its about a dozen. 
  But thats not too bad. 
  The Bluemix service will let you create or join a blockchain network. 

  1. First [create an IBM ID](https://console.ng.bluemix.net/registration/) if you do not already have one.
  1. Then login to [Bluemix](https://console.ng.bluemix.net)  
  1. Click the "Catalog" link on the top navigation bar

![](/doc_images/bluemix_ibc1.png)

  1. Find and click the "Blockchain" tile. Type `blockchain` in the search box to filter the list.

![](/doc_images/bluemix_ibc2.png)

  1. The space used is listed in the Name/Region/Org/Space bar at the top right.  If you want to create the network in a different space, click this bar to bring up the option to change or create a new space.

  ![](/doc_images/bluemix_ibc3.png)

  1. Leave the "Service Name" alone or you can choose to rename it to something more friendly such as "Awesome Marbles Demo"
  1. Leave the "Credential name" field as its default value
  1. Leave the "Connected To:" field as "Leave unbound" (unless you already have an application, but you probably don't yet)
  1. Change the "Selected Plan" to **High Security Business Network vNext(Limited Beta)**
  1. Click the "Create" button at the bottom right.

![](/doc_images/1-welcome.PNG)

<a name ="get_credentials" ></a> If all goes well you should be on the welcome screen for your new service. Click the "Create Network" button to see the dashboard for your network. 

![](/doc_images/2-create-wizard.PNG)

- Now you should see the create network wizard. Fill out the wizard and I'll meet you onthe summary page.

![](/doc_images/3-create-summary.PNG)

- Look over your choices and when finished click the "Create" button to get your blockchain network.

![](/doc_images/4-resources-no-peers.PNG)

- Congrats, you now have a blockchain network. You are currently eyeballing the list of nodes for you network. 
- You will need nodes called "Peers" to run marbles chaincode.  If you don't see any peers click the "Add Peer" button. 

![](/doc_images/5-after-added-peer.PNG)

- When you have at least one peer, we can move on to making a channel. Click the "Channels" tab on the left.
	- A channel is used to isolate our blockchain ledger from others on the network.  Later we will have the oppturnity to invite members of our network to our channel. Members on the same channel will be able to vaildate eachothers transactions. For now we just want to make a channel for ourself!
- Next click the create "New Channel" button in the top right

![](/doc_images/7-create-channel.PNG)

- Give you channel a name
- We will want to add ourself to this channel, so select yourself from the channel drop down and then click "Add Member"
- Next click the "Create" button

![](/doc_images/8-created-channel.PNG)

- If all went well you have successfully created a channel
- Click the "Chaincode" link on the left navigation

![](/doc_images/9-chaincode.PNG)

- Select 1 of your peers in the drop down
- Now click the "Install Chaincode" button

![](/doc_images/10-install-marbles.PNG)

- Fill out the chaincode name as "marbles"
- Fill out the chaincode version as "v0"
- Click "Submit"

![](/doc_images/11-installed-marbles.PNG)

- Great, so you should see marbles list in the chaincode table for this peer.

(Note if in the future you find yourself on the main Bluemix Dashboard and want to get back to this service screen just click your blockchain tile from the "Services" section in your Bluemix Dashboard)

### Finish Up
The network is all setup. If you want more detail on the IBM Blockchain service, available plans, or a detailed overview of the IBM Blockchain Dashboard, continue [here](https://console.ng.bluemix.net/docs/services/blockchain/index.html?pos=2)

1. Next we need to **copy the peer data and pass it to our demo node.js application**.
1. Click the "Service Credentials" link on the very bottom left of the dashboard.
1. This will open the file in your browser. Replace the entire contents of the `mycreds_bluemix.json` file in the root of the `/git/<project>` directory you cloned earlier with this text.
1. Double check that [app.js](../app.js#L154) is using the correct file. Line 154 uses `mycreds_docker_compose.json` and should be commented out. Line 155 with `mycreds_bluemix.json` should NOT be commented out. 
1. Continue where you left off in [tutorial 1](./tutorial_start_here.md#hostmarbles).

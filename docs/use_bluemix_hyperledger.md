# Use Bluemix IBM Blockchain Service:

### Creating a Blockchain Network in IBM Bluemix
1. Don't fret, this is as simple as clicking on a particular button and filling out a text input field or two, or three. 
  Meh it’s about a dozen. 
  But that’s not too bad. 
  The Bluemix service will run our peers and orderer, thus forming our blockchain network. 
  We also have the ability to join other networks, but let’s focus on creating our own. 

1. First [create an IBM ID](https://console.ng.bluemix.net/registration/) if you do not already have one.
1. Then login to [Bluemix](https://console.ng.bluemix.net)  
1. Click the "Catalog" link on the top navigation bar

![](/doc_images/bluemix_ibc1.png)

1. Find and click the "Blockchain" tile by typing `blockchain` in the search box.

![](/doc_images/bluemix_ibc2.png)

1. You should now be on the Blockchain Platform page where you can find more blockchain related information
1. Click the blue "Service Plan" button

![](/doc_images/bluemix_ibc3.png)

1. The service will be created in the currently selected space. This is found on the top toolbar near your email address. Click the space if you want to create the Blockchain service in a different space. This will bring up multiple options for Region/Org/Space.
    - All of this is a Bluemix concept for organizing services/apps. If these terms confuse you then leave the values alone.

![](/doc_images/bluemix_ibc4.png)

1. Leave the "Service Name" alone or you can choose to rename it to something more friendly such as "Awesome Marbles Demo"
1. Leave the "Credential name" field as its default value
1. Leave the "Connected To:" field as "Leave unbound"
1. Scroll to the bottom and change the "Selected Plan" to **IBM Blockchain Platform - Enterprise Plan**
1. Click the "Create" button at the bottom right.

![](/doc_images/1-welcome.PNG)

<a name ="get_credentials" ></a> 
- If all goes well you should see a similar screen as the image above. Click the "Create Network" button to enter the create wizard. 

![](/doc_images/2-create-wizard.PNG)

- Now you should see the create network wizard with the words "Let's Get Started". Fill out the whole wizard and I'll meet you on the summary page. If anything confuses you just use the default settings.

![](/doc_images/3-create-summary.PNG)

- Now that we are on the "Review Summary" screen lets look over your choices. When finished click the "Done" button.
- Next you will see an option to create peers or enter the dashboard.  Select the "Add Peers" button. 
	- Make sure you add at least 1 peer. If its too late you can still create the peer later on.
	- Click the "Submit" button

![](/doc_images/4-resources-no-peers.PNG)

- Congrats, you now have a blockchain network. You are currently eyeballing the list of nodes for you network. This is your "Overview" page.
- You will need nodes called "Peers" to run marbles chaincode.  You may have peers already.  It depends on if you selected some during the create wizard. If not click the "Add Peer" button and create 1 peer of any size. 

![](/doc_images/5-after-added-peer.PNG)

- When you see at least one peer listed in the table, we can move on to making a channel. 
    - Creating a channel is a bit of a process, so bare with me!
    - A channel is used to isolate our blockchain ledger from others on the network.  (Later we will have the opportunity to invite members of our network to our channel) Members on the same channel will be able to validate each others transactions. For now we just want to make a channel for ourself.
- Click the "Channels" link on the left navigation menu.
- Next click the create "New Channel" button in the top right. You will see a panel similar to the image below.

![](/doc_images/7a-create-channel.PNG)

- Give your channel a name and description if you want
    - Due to the crazy rules it may take a few minuets to pick a good name.  Stick to lowercase letters, numbers, dashes, and dots.
- Then click "Next"

![](/doc_images/7b-create-channel.PNG)

- We need ourself added as an "Operator". So find your email address and check the Operator box next to it.
	- Operator means we get to vote on changes to this channel.
- If we wanted to invite others to the channel, we could add them from the drop down and select their roles. For now lets only have ourself on this channel. 
- Then click the "Next" button

![](/doc_images/7c-create-channel.PNG)

- The update policy decides what it takes to make changes to the channel. In this case how many operators should it take. Since we only have ourself on the channel, the only value that makes sense is 1. Use the dropdown to set this to 1.
- Then click the "Submit Request" button

![](/doc_images/7e-create-channel.PNG)

- OK. So the request is made, but we still have to sign it and submit it.
- In the "Notifications" tab look for a pending request with your channel name on it.
- Open the request by clicking the big giant button in the Actions column called "Review Request"
    - You could review it by expanding each section, but since we made it we know whats inside
- With the notification opened we can now sign the request by clicking "Accept"
- After clicking accept the notification will close
- Next submit the request with the same "Actions" column, but this time click "Submit Request" button

![](/doc_images/8-created-channel.PNG)

- Now browse to the "Channels" page in the left navigation menu. It should look similar to the image above.
- If all went well you should see the channel name listed after the panel refreshes
- But we are not quite done... Click the dots in the action column and select the "Join Peers" option
- A menu will appear, check all of your peers and then click the "Add Selected" button
- If the stars align the peer will be joined to your channel and everything is done
    - You can tell it was successful if the date created and block height (on the channels page) have dates and a number, instead of a '-'
    - If you don't see a date, refresh the page or repeat the join

### Finish Up
Congrats! The network is all setup. If you want more detail on the IBM Blockchain service, available plans, or a detailed overview of the IBM Blockchain Dashboard, jump over [here](https://console.ng.bluemix.net/docs/services/blockchain/index.html?pos=2). If not let’s continue the setup. 

- Continue where you left off in the [tutorial](../README.md#installchaincode).

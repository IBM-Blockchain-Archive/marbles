# Use IBM Cloud Blockchain Service:

### Creating a Blockchain Network in IBM Cloud (Starter Plan)
1. Don't fret, this is as simple as clicking on a particular button and filling out a text input field or two.
  The IBM Cloud service will run our peers and orderer which forms our blockchain network.
  We also have the ability to join other networks, but let’s focus on creating our own.

1. First [create an IBM ID](https://console.ng.bluemix.net/registration/) if you do not already have one.
1. Then login to [IBM Cloud](https://console.ng.bluemix.net)
1. Click the "Catalog" link on the top navigation bar

![](/doc_images/bluemix_ibc1.png)

1. Find and click the "Blockchain" tile by typing `blockchain` in the search box.

![](/doc_images/bluemix_ibc2.png)

1. Once you selected the blockchain tile you will see the service instance creation screen. This is where you select where the service will be created. Each drop down will allow you to select what Region/Org/Space to create the service.
    - You can leave these settings alone if you are new to IBM Cloud or Cloud Foundry.  These settings control the Cloud Foundry way of organizing services and applications. If these terms confuse you then leave the default values alone.

![](/doc_images/bluemix_ibc3.png)

1. Leave the "Service Name" alone or you can choose to rename it to something more meaningful such as "Awesome Marbles"
1. Scroll to the bottom and change the "Selected Plan" to **:lollipop: Starter Membership Plan** or **Enterprise Membership Plan** (these instructions are tailored for starter plan, but the enterprise plan is very similar, you will likely be able to follow along)
1. Click the "Create" button on the bottom right.

![](/doc_images/bluemix_ibc4.png)

- If all goes well you should see a similar screen as the image above.
- Congrats, you have a blockchain network! Click the "Launch" button to enter your blockchain's monitoring UI.
- You are currently eyeballing the "Let's get started!" modal. Dismiss it with the "Got it" button (or read it if you are bored).

![](/doc_images/bluemix_ibc5.png)

- Behind that modal is your list of nodes for you network. This is your "Overview" page.

![](/doc_images/bluemix_ibc6.png)

- The overview page is listing out your peers, CAs, and orderers.  You likely have 1 of each.
	- The handy information on this page is the node statuses (hopefully they all say `Running`) and the `View Logs` link which is in the overflow menu at the end of each row (under the `Actions` column).

- We have one more thing to do for the network setup. We need to make a channel.
- If you are using Starter plan than we already created a channel for you called `defaultchannel`. But I'll run you through the process anyway because its a good thing to know and its non-trivial.
    - A channel is used to isolate our blockchain ledger from others on the network.  Later we will have the opportunity to invite members of our network to our channel. For now we just want to make a channel for ourself.
- Click the "Channels" link on the left navigation menu.

![](/doc_images/bluemix_ibc7.png)

- Next click the create "Request Channel" button in the top right. You will see a panel similar to the image below.

![](/doc_images/bluemix_ibc8.png)

- Give your channel a name and description if you want
    - Due to the crazy rules it may take a few minuets to pick a good name.  Stick to lowercase letters, numbers, dashes, and dots.
- Then click "Next"

![](/doc_images/bluemix_ibc9.png)

- We need ourself added as an "Operator". So find your email address and check the Operator box next to it.
	- Operator means we get to vote on changes to this channel.
- If we wanted to invite others to the channel, we could add them from the drop down and select their roles. For now lets only have ourself on this channel.
- Then click the "Next" button

![](/doc_images/bluemix_ibc10.png)

- The update policy decides what it takes to make changes to the channel. In this case how many operators should it take. Since we only have ourself on the channel, the only value that makes sense is 1. Use the dropdown to set this to 1.
- Then click the "Submit Request" button

![](/doc_images/bluemix_ibc11.png)

- OK. So the request is made, but we still have to sign it and submit it.
- In the "Notifications" tab look for a pending request with your channel name on it.
- Open the request by clicking the big giant button in the Actions column called "Review Request"
    - You could review it by expanding each section, but since we made it we know whats inside

![](/doc_images/bluemix_ibc12.png)

- With the notification opened we can now sign the request by clicking "Approve"
	- After clicking "Approve" the notification will close
- Next submit the request with the "Submit Request" button

![](/doc_images/bluemix_ibc13.png)

- Now browse to the "Channels" page in the left navigation menu. It should look similar to the image above.
- If all went well you should see the channel name listed after the panel refreshes

![](/doc_images/bluemix_ibc14.png)

- But we are not quite done... Click the dots in the action column and select the "Join Peers" option
- A menu will appear, check all of your peers and then click the "Join Selected" button
- If the stars align the peer will be joined to your channel and everything is done
	- You can tell it was successful if the date created and block height (on the channels page) have dates and a number, instead of a '-'
	- If you don't see a date, refresh the page or repeat the join

### Finish Up
Congrats! The network is all setup. If you want more detail on the IBM Blockchain service, available plans, or a detailed overview of the IBM Blockchain Dashboard, jump over [here](https://console.ng.bluemix.net/docs/services/blockchain/index.html?pos=2). If not let’s continue the setup.

- Continue where you left off in the [tutorial](../README.md#installchaincode).

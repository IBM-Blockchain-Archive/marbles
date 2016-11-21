#Use Bluemix IBM Blockchain Network:

### Creating a Blockchain Network in IBM Bluemix
1. Don't fret, this is as simple as clicking on a particular button and filling out a text input field or two. 
  There is a Bluemix tile that will create your own personal blockchain network. All you have to do is find the tile and give the network a name. 

  1. First [create an IBM ID](https://console.ng.bluemix.net/registration/) if you do not already have one.
  1. Then login to [Bluemix](https://console.ng.bluemix.net)  
  1. Click the "Catalog" link on the top navigation bar

![](/doc_images/bluemix_ibc1.png)

  1. Find and click the "Blockchain" tile. Type `blockchain` in the search box to filter the list.

![](/doc_images/bluemix_ibc2.png)

  1. The space used is listed in the Name/Region/Org/Space bar at the top right.  If you want to create the network in a different space, click this bar to bring up the option to change or create a new space.

  ![](/doc_images/bluemix_ibc3.png)

  1. Click on the text bar under "Service Name" to rename "Blockchain-bx" to "myblockchain" without the quotes
  1. Leave the "Credential name" field as its default value
  1. Leave the "Connected To:" field as "Leave unbound" (unless you already have an application, but you probably don't yet)
  1. Leave the "Selected Plan" as its default value
  1. Click the "Create" button at the bottom right.

<a name ="get_credentials" ></a> If all goes well you should be on the manage screen for your new service. Click the "Launch Dashboard" button to see the dashboard for your network. 
- You should see a few peers listed in the first table

![](/doc_images/bluemix_ibc4.png)

- From here you can monitor if your peers crash, if the chaincode containers are running, and view logs for all

![](/doc_images/bluemix_ibc5.png)

  (Note if you find yourself on the main Bluemix Dashboard and want to get back to this service screen just click the tile name "myblockchain" in the "Services" section)

### Finished
The network is all setup. If you want more detail on the IBM Blockchain service, available plans, or a detailed overview of the IBM Blockchain Dashboard, continue [here](https://console.ng.bluemix.net/docs/services/blockchain/index.html?pos=2)

1. Next we need to **copy the peer data and pass it to our demo node.js application**.
1. Click the "Service Credentials" link on the very bottom left of the dashboard.
1. This will open the file in your browser. Replace the entire contents of the `mycreds_bluemix.json` file in the root of the `/git/<project>` directory you cloned earlier with this text.
1. Double check that [app.js](../app.js#L154) is using the correct file. Line 154 uses `mycreds_docker_compose.json` and should be commented out. Line 155 with `mycreds_bluemix.json` should NOT be commented out. 
1. Continue where you left off in [tutorial 1](./tutorial_part1.md#hostmarbles).

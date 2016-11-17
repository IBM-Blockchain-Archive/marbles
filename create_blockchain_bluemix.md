### Creating a Blockchain Network in IBM Bluemix

1.  Create a Bluemix IBM Blockchain Network.  Don't fret, this is as simple as clicking on a particular button and filling out a text input field or two. 
  There is a Bluemix tile that will create you your own personal blockchain network. All you have to do is find the tile and give the network a name. 

  1. First login to [Bluemix](https://console.ng.bluemix.net)  
  Go here If you already have a Blockchain network and just want to [launch the dashboard and grab the credentials](#get_credentials)
  
  
  1. Click the "Catalog" link on the top navigation bar

![](/doc_images/bluemix_ibc1.png)

  1. Find and click the "Blockchain" tile. Type `blockchain` in the search box to filter the list.

![](/doc_images/bluemix_ibc2.png)

  1. The space used is listed in the Name/Region/Org/Space bar at the top right.  If you want to create the network in a different space, click this bar to bring up the option to change or create a new space.  
  1. Click on the text bar under "Service Name" to rename "Blockchain-bx" to "myblockchain" without the quotes
  1. Leave the "App:" field as "Leave unbound" (unless you already have an application, but you probably don't yet)
  1. Leave the "Selected Plan" as its default value
  1. Leave the "Credential name" field as its default value
  
  1. Click the "CREATE" button at the bottom right.

![](/doc_images/bluemix_ibc3.png)

<a name ="get_credentials" ></a>  1. If all goes well you should be on the manage screen for your new service. Click the "LAUNCH" button to see the dashboard for your network. 
	- You should see a few peers listed in the first table
	- From here you can monitor if your peers crash, if the chaincode containers are running, and view logs for all

![](/doc_images/bluemix_ibc4.png)

![](/doc_images/bluemix_ibc5.png)

  (Note if you find yourself on the main Bluemix Dashboard and want to get back to this service screen just click the tile name "myblockchain" in the "Services" section)

The network is all setup.  Since we are running the app locally, we need to **copy the peer data and pass it to our marbles node.js application**.

1. Click the "Service Credentials" link on the very bottom left of the dashboard.
1. This will open the file in your browser.  Replace the entire contents of the mycredentials.json file with this text.
1. continue by [run marbles on local machine](#runlocal) below.

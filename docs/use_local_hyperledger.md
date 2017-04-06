# Use Local Hyperledger Network:

### Creating a Local Hyperledger Fabric Network
Use the Hyperledger Fabric docker images and docker-compose script to get a local network quickly.

1. Follow the Fabric v1 [Getting Started instructions](http://fabric-rtd.readthedocs.io/en/latest/getting_started.html).

### Finished
The network is all setup, right? 
So if you followed the instructions then your orderer will be batching new blocks every 10 seconds. 
This is a litttttle long for our application, and may give you undesired behavior, sometimes. 
Basicaly if you move a marble the trade will take 10 seconds to settle. 
The **UI may redraw the marble back in its original position**, and then jump to a correct position after some time. 
This is a known issue and is because of a the long batch time. 
If you use the Bluemix service, the batch time is only 1 second and the app has been optimized for this specfic delay. 

Next we need to **pass the address and other info of our peer to our marbles application**. 
This is done by editing the creds file. 

1. Next, follow the [configuration file instructions](./config_file.md).

"Local Network" means running the blockchain peers using your local machine as the host.
ie the blockchain network is running entirely on your local machine.

# <a name="local"></a>Local Network Setup:

Before jumping into the local network deployment, we recommend deploying first the Marbles app by doing the [manual](#network) setup, as some steps will have to be repeated. This local setup consists mainly of two steps:

1. Set up a [development network enviroment](#devenv).
2. [Modify Marbles](#marbmod) app to work with local setup.

##<a name="devenv"></a>Development network setup

This section explains the simplest network setup to make the Marbles app and the BlockChain nodes run locally altogether. Further advanced setup are suggested [here](#further).

Previous considerations:
- This deployment will use the [OBC](https://github.com/openblockchain) BlockChain implementation. This implementation is not the newest implementation as OBC was moved to [HyperLedger](https://github.com/hyperledger) and many advances have been made since then. But marbles hasn't been updated accordingly and some things are outdated (and won't work). 
- The deployment won't use the security features of a CA because some [problems](https://github.com/hyperledger/fabric/issues/1204) were encountered when starting the Marbles app.

Steps:

1. Follow [these instructions](https://github.com/openblockchain/obc-docs/blob/master/dev-setup/devenv.md#prerequisites) to setup your network development environment.

	**Important:** before starting Vagrant (by running ```vagrant up```), modify the Vagrantfile (located in the same folder) to add this line in the Vagrant.configure section: ```config.vm.network "public_network"```. This will make the Vagrant virtual box visible from outside and we will be able to connect to the Marbles app running inside (it runs inside because the network nodes have to be visible from the Marbles app).

2. Follow [these instructions](https://github.com/openblockchain/obc-docs/blob/master/dev-setup/devnet-setup.md) to setup 2 Validating peers (without using security, i.e. not starting a CA).


##<a name="marbmod"></a>Marbles adjust to local network

Now we are going to modify the Marbles app to work with the local network setup. Steps:

1. The Marbles app will also run inside the Vagrant virtual machine, so open another terminal and enter vagrant (```vagrant ssh```).
2. Once inside, in any folder you choose, download the Marbles app from GitHub (```git clone```).
3. Now adjust the app.js file so that Marbles points to you locally deployed peers, modify ```var manual``` peers part. The modified variable should look like:

	````
	var manual ={
	  'credentials': {
	    'peers': [
	      {
	        'discovery_host': '172.17.0.2',
	        'discovery_port': 30303,
	        'api_host': '172.17.0.2',
	        'api_port_tls': 443,
	        'api_port': 5000,
	        'type': 'peer',
	        'network_id': 'dev',
	        'id': 'dev_vp0',
	        'api_url': 'http://172.17.0.2:5000'
	      },
	      {
	        'discovery_host': '172.17.0.3',
	        'discovery_port': 30303,
	        'api_host': '172.17.0.3',
	        'api_port_tls': 443,
	        'api_port': 5000,
	        'type': 'peer',
	        'network_id': 'dev',
	        'id': 'dev_vp1',
	        'api_url': 'http://172.17.0.3:5000'
	      }
	    ],
	
	````
	The users part can be left unmodified and the ca part can be removed.

4. Remove the users use from the app.js file by adding the line ```users=null```. This is done because we are running without security and without CA (so no users have to be registered). The app.js file will look like:

	````
	console.log('loading hardcoded peers');
	var users = null;
	
	//users are only found if security is on
	if(manual.credentials.users) users = manual.credentials.users;
	users = null
	console.log('loading hardcoded users');
	````

5. Remove the lines of code that store the ChainCode summary file (it causes errors and it is not necessary):
	- Remove: ```ibc.save('./cc_summaries'); ```
	- Change: ```cc.deploy('init', ['99'], {save_path: './cc_summaries', delay_ms: 50000}, cb_deployed);``` for ```cc.deploy('init', ['99'], null, cb_deployed); ```

6. Finally, we need to change the setup.js file so that Marbles points to the correct address where the WebSocket is up:
	- First figure out the address the Vagrant virtual machine offers to the local machine: use ```ifconfig``` and look for the eth1 - inet addr (in my case it's 9.137.152.52).
	- Now modify the setup.js file variable section 3. Localhost - Development and add the address found previously:
	
	```
	exports.SERVER = {
		HOST:'localhost',
		PORT: 3000,
		DESCRIPTION: 'Localhost',
		EXTURI: '9.137.152.52:3000',
	};
	```

7. Now you can run the Marbles app by doing [this](#run). You might want to use ```sudo``` when installing npm and running gulp.


##<a name="further"></a>Further advanced setup

- After deploying OBC one can try to setup the local network using Hyperledger following [these changes](https://github.com/IBM-Blockchain/marbles/issues/6) and adjusting the commands used for the development network setup (if you succeeded using HyperLedger please do document it here). 

	The HyperLedger documentation is mainly the same with the adjustments according to its further development: [development environment](https://github.com/hyperledger/fabric/blob/master/docs/dev-setup/devenv.md) and [development setup](https://github.com/hyperledger/fabric/blob/master/docs/dev-setup/devnet-setup.md).

- Try starting the Marbles app with the CA (remember removing the ```users=null``` line in the app.js file). Remember that when starting the CA the users in the app.js have to be hardcoded in the CA configuration file.

- Try using another consensus plugin: the consensus to be used is defined in the VP configuration file (see Using Consensus Plugin section in the development setup instructions).

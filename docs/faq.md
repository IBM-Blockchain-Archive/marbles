# Marbles FAQ

1. [Does deleting a marble re-write history? How is this not breaking the blockchain ledger?](./faq.md#deleteHistory)

1. [What is with the required input arguments for the marbles chaincode?](./faq.md#inputArgs)

1. [How can I create a HA(high-availability) setup?](./faq.md#ha)

1. [I want to run a local Hyperledger Fabric network... how?](./faq.md#localFabric)

1. [What is this "fcw" aka "fc wrangler" thing?](./faq.md#fcw)

1. [I'm stuck, can you help me?](./faq.md#stuck)

***

<a name="deleteHistory"></a>

### Q. Does deleting a marble re-write history? How is this not breaking the blockchain ledger?
It does not re-write history. 
"History" would refer to the ledger, which can not be re-written under normal circumstances. 
The "delete" transaction is a regular transaction that gets recorded into a block in the ledger. 
Therefore the marble's creation and activity remains in the ledger unchanged, forever, even after a "delete". 
However the _state_ of the asset did change. 
The ledger and the world state are different things. 
The ledger contains the historic actions to the chaincode and channel (transactions). 
While the world state is all the asset data at a specific _moment_ of time.
Think of it as the combined result of playing back all transactions. 
When we created a marble, we appended the create transaction to the ledger, and added the marble to the world state. 
Like-wise when we delete, the delete transaction is appended to the ledger, and the world state is altered to remove the marble. 


<a name="inputArgs"></a>

### Q. What is with the required input arguments for the marbles chaincode?
The marbles chaincode requires a single integer as an input. 
This is purely for demonstration reasons to show how its possible to pass inputs to a chaincode during its instantiate. 
The actual number you provide to marbles is meaningless, go nuts. 


<a name="ha"></a>

### Q. How can I create a HA(high-availability) setup
The latest and greatest marbles already does this! Checkout the `fc wrangler` files: [high_availability.js](../utils/fc_wrangler/high_availability.js) and [index.js](../utils/fc_wrangler/index.js). The code snippet below shows that when an invoke fails, we call `ha.switch_peer()` to send the same call to the next peer. Remember that the SDK is configured to send requests to specific peers, so all we have to do is change this peer. 

__./utils/fc_wrangler/index.js__
```js
	fcw.invoke_chaincode = function (obj, options, cb_done) {
		invoke_cc.invoke_chaincode(obj, options, function (err, resp) {
			if (err != null) {                  //looks like an error with the request
				if (ha.switch_peer(obj, options) == null) {   //try another peer
					logger.info('Retrying invoke on different peer');
					fcw.invoke_chaincode(obj, options, cb_done);
				} else {
					if (cb_done) cb_done(err, resp);     //out of peers, give up
				}
			} else {                       //all good, pass resp back to callback
				ha.success_peer_position = ha.using_peer_position;  //remember the last good one
				if (cb_done) cb_done(err, resp);
			}
		});
	};
```


<a name="localFabric"></a>

### Q. I want to run a local Hyperledger Fabric network... how?
Great, I recommend that everyone starts with a local network. [Lets get going](../docs/use_local_hyperledger.md) .


<a name="fcw"></a>

### Q. What is this "fcw" aka "fc wrangler" thing?
It's called the Fabric Client Wrangler. 
It is simply a wrapper around the [fabric-client](https://www.npmjs.com/package/fabric-client) SDK module. 
ie it gives me a slightly friendlier interface to the SDK. 
It is generic and reuseable for your own adaptations. 
It is **not** a required component of a node.js -> Fabric application, but I feel it helps. 


<a name="stuck"></a>

### Q. I'm stuck, can you help me?
Yes. Open an issue on our [GitHub Issues](https://github.com/IBM-Blockchain/marbles/issues). Please include as much info as you can, such as the logs you are seeing, what you were expecting to happen, etc.

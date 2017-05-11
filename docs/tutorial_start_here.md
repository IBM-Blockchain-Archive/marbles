# Marbles - Demo

## About Marbles
- The underlying network for this application is the [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), a Linux Foundation project.  You may want to review these instructions to understand a bit about the Hyperledger Fabric.
- **This demo is to aid a developer learn the basics of chaincode and app development with a Hyperledger network.**
- This is a `very simple` asset transfer demonstration. Multiple users can create and transfer marbles with each other.

***

## Marbles Goals
- Admin can create a marble and store it in the chaincode state
- Admin can read and display all marbles in the chaincode state
- Admin can transfer a marble to another marble owner
- Admin can delete a marble

***

# Application Background
Hold on to your hats everyone, this application is going to demonstrate transferring marbles between many marble owners leveraging Hyperledger Fabric.
We are going to do this in Node.js and a bit of GoLang.
The backend of this application will be the GoLang code running in our blockchain network.
From here on out the GoLang code will be referred to as 'chaincode' or 'cc'.
The chaincode itself will create a marble by storing it to the chaincode state.
The chaincode itself can store data as a string in a key/value pair setup.
Thus, we will stringify JSON objects to store more complex structures.

Attributes of a marble:

  1. id (unique string, will be used as key)
  1. color (string, css color names)
  1. size (int, size in mm)
  1. owner (string)

We are going to create a Web based UI that can set these values and store them in our blockchain.
The marble gets created in the blockchain storage aka ledger as a key value pair.
The `key` is the marble id, and the `value` is a JSON string containing the attributes of the marble (listed above).
Interacting with the cc is done by using the gRPC protocol to a peer on the network.
The details of the gRPC protocol are taken care of by an SDK called [Hyperledger Fabric Client](https://www.npmjs.com/package/fabric-client) SDK.
Check the picture below for topology details.

### Application Communication Flow

![](/doc_images/comm_flow.png)

1. The admin will interact with Marbles, our Node.js application, in their browser.
1. This client side JS code will open a websocket to the backend Node.js application. The client JS will send messages to the backend when the admin interacts with the site.
1. Reading or writing the ledger is known as a proposal. This proposal is built by Marbles (via the SDK) and then sent to a blockchain peer.
1. The peer will communicate to its Marbles chaincode container. The chaincode will run/simulate the transaction. If there are no issues it will endorse the transaction and send it back to our Marbles application.
1. Marbles (via the SDK) will then send the endorsed proposal to the ordering service.  The orderer will package many proposals from the whole network into a block.  Then it will broadcast the new block to peers in the network.
1. Finally the peer will validate the block and write it to its ledger. The transaction has now taken effect and any subsequent reads will reflect this change.

### Context Clues
There are 3 distinct parts/worlds that you need to keep straight.
They should be thought of as isolated environments that communicate with each other.
This walk through will jump from one to another as we setup and explain each part.
It's important to identify which part is which.
There are certain keywords and context clues to help you identify one from another.

1. The Chaincode Part - This is GoLang code that runs on/with a peer on your blockchain network. Also, called `cc`. All marbles/blockchain interactions ultimately happen here. These files live in `/chaincode`.
1. The Client Side JS Part - This is JavaScript code running in the user's browser. User interface interaction happens here. These files live in `/public/js.`
1. The Server Side JS Part - This is JavaScript code running our application's backend. ie `Node.js` code which is the heart of Marbles! Sometimes referred to as our `node` or `server` code. Functions as the glue between the marble admin and our blockchain. These files live in `/utils` and `/routes`.

Remember these 3 parts are isolated from each other.
They do not share variables nor functions.
They will communicate via a networking protocol such as gRPC or WebSockets.

***

<a name="use"></a>

# Use Marbles

1. If you are at this step, you should have your environment setup, blockchain network created, marbles app and chaincode running. Right? If not look up for help (up the page, not literaly upwards).
1. Open up your browser and browse to [http://localhost:3001](http://localhost:3001) or your Bluemix www route.
    - If the site does not load, check your node console logs for the hostname/ip and port marbles is using.
1. Finally we can test the application. Click the "+" icon on one of your users in the "United Marbles" section

![](/doc_images/use_marbles1.png)

1. Fill out all the fields, then click the "CREATE" button
1. After a few seconds your new marble should have appeared.
    - If not refresh the page
1. Next let’s trade a marble.  Drag and drop a marble from one owner to another. Only trade it to owners within "United Marbles" if you have multiple marble companies. It should temporary disappear and then redraw the marble within its new owner. That means it worked!
    - If not refresh the page
1. Now let’s delete a marble by dragging and dropping it into the trash can. It should disappear after a few seconds.

![](/doc_images/use_marbles2.png)

1. Refresh the page to double check that your actions "stuck".
1. Use the search box to filter on marble owners or marble company names.  This is helpful when there are many companies/owners.
    - The pin icon will prevent that user from being filtered out by the search box.
1. Congratulations you have a working marbles application :)!

# Blockchain Background
Before we talk about how Marbles works let’s discuss the flow and topology of Hyperledger Fabric.
Lets get some definitions out of the way first.

### Definitions:

**Peer** - A peer is a member of the blockchain and is running Hyperledger Fabric. From marble's context, the peers are owned and operated by my marble company.

**CA** - The CA (Certificate Authority) is responsible for gatekeeping our blockchain network. It will provide transaction certificates for clients such as our marbles node.js application.

**Orderer** - An orderer or ordering service is a member of the blockchain network whose main responsibility is to package transactions into blocks.

**Users** - A user is an entity that is authorized to interact with the blockchain. In the Marbles context, this is our admin. The user can query and write to the ledger.

**Blocks** - Blocks contain transactions and a hash to verify integrity.

**Transactions** or **Proposals** - These represent interactions to the blockchain ledger. A read or write request of the ledger is sent as a transaction/proposal.

**Ledger** - This is the storage for the blockchain on a peer. It contains the actual block data which consist of transaction parameters and key value pairs. It is written by chaincode.

**Chaincode** - Chaincode is Hyperledger speak for smart contracts. It defines the assets and all rules about assets.

**Assets** - An asset is an entity that exists in the ledger. It’s a key value pair. In the context of marbles this is a marble, or a marble owner.

Let’s look at the operations involved when creating a new marble.

1. The first thing that happens in marbles is registering our admin `user` with our network's `CA`. If successful, the `CA` will send Marbles enrollment certificates that the SDK will store for us in our local file system.
1. When the admin creates a new marble from the user interface the SDK will create an invocation transaction.
1. The create marble transaction gets built as a `proposal` to invoke the chaincode function `init_marble()`.
1. Marbles (via the SDK) will send this `proposal` to a `peer` for endorsement.
1. The `peer` will simulate the transaction by running the Go function `init_marble()` and record any changes it attempted to write to the `ledger`.
1. If the function returns successfully the `peer` will endorse the `proposal` and send it back to Marbles. Errors will also be sent back, but the `proposal` will not be endorsed.
1. Marbles (via the SDK), will then send the endorsed `proposal` to the `orderer`.
1. The `orderer` will organize a sequence of `proposals` from the whole network. It will check the sequence of transactions is valid by looking for transactions that conflict with each other. Any transactions that cannot be added to the block because of conflicts will be marked as errors. The `orderer` will broadcast the new block to the peers of the network.
1. Our `peer` will receive the new block and validate it by looking at various signatures and hashes. It is then finally committed to the `peer's` `ledger`.
1. At this point the new marble exists in our ledger and should soon exist in all peer's ledgers.

# SDK Deeper Dive
Now lets see how we interface with the Fabric Client SDK.
Most of the configuration options can be found in `/config/blockchain_creds1.json`.
This file list the hostname (or ip) and port of various components of our blockchain network.
The `helper` functions will retreive IPs and ports from the configuration file.

### Configure SDK:
First action is to enroll the admin:

```js
//enroll admin
enrollment.enroll = function (options, cb) {
    var chain = {};
    var client = null;
    try {
// [Step 1]
        client = new HFC();
        chain = client.newChain(options.channel_id);
    }
    catch (e) {
        //it might error about 1 chain per network, but that's not a problem just continue
    }

    if (!options.uuid) {
        logger.error('cannot enroll with undefined uuid');
        if (cb) cb({ error: 'cannot enroll with undefined uuid' });
        return;
    }

    logger.info('[fcw] Going to enroll for mspId ', options);

// [Step 2]
    // Make eCert kvs (Key Value Store)
    HFC.newDefaultKeyValueStore({
        path: path.join(os.homedir(), '.hfc-key-store/' + options.uuid) //store eCert in the kvs directory
    }).then(function (store) {
        client.setStateStore(store);

// [Step 3]
        return getSubmitter(client, options);              //do most of the work here
    }).then(function (submitter) {

// [Step 4]
        chain.addOrderer(new Orderer(options.orderer_url, {
          pem: options.orderer_tls_opts.pem,
          'ssl-target-name-override': options.orderer_tls_opts.common_name  //can be null if cert matches hostname
        }));

// [Step 5]
        try {
            for (var i in options.peer_urls) {
                chain.addPeer(new Peer(options.peer_urls[i], {
                    pem: options.peer_tls_opts.pem,
                    'ssl-target-name-override': options.peer_tls_opts.common_name
                }));
                logger.debug('added peer', options.peer_urls[i]);
            }
        }
        catch (e) {
            //might error if peer already exists, but we don't care
        }
        try {
            chain.setPrimaryPeer(new Peer(options.peer_urls[0], {
                 pem: options.peer_tls_opts.pem,
                 'ssl-target-name-override': options.peer_tls_opts.common_name
            }));
            logger.debug('added primary peer', options.peer_urls[0]);
        }
        catch (e) {
            //might error b/c bugs, don't care
        }

// [Step 6]
        // --- Success --- //
        logger.debug('[fcw] Successfully got enrollment ' + options.uuid);
        if (cb) cb(null, { chain: chain, submitter: submitter });
        return;

    }).catch(

        // --- Failure --- //
        function (err) {
            logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err);
            var formatted = common.format_error_msg(err);
            if (cb) cb(formatted);
            return;
        }
    );
};
```

1. The first thing the code does is create an instance of our SDK.
1. Next we create a key value store to store the enrollment certifcates with `newDefaultKeyValueStore`
1. Next we enroll our admin. This is when we authenticate to the CA with our enroll ID and enroll secret. The CA will issue enrollment certificates which the SDK will store in the key value store. Since we are using the default key value store, it will be stored in our local file system.
1. After successful enrollment we set the orderer URL.  The orderer is not needed yet, but will be when we try to invoke chaincode.
    - The bussiness with `ssl-target-name-override` is only needed if you have self signed certificates. Set this field equal to the `common name` you used to create the PEM file.
1. Next we set the Peer URLs. These are also not needed yet, but we are going to setup our SDK chain object fully.
1. At this point the SDK is fully configured and ready to interact with the blockchain.

# Marbles Deeper Dive
Hopefully you have successfully traded a marble or two between users.
Let’s look at how transfering a marble is done by starting at the chaincode.

__/chaincode/marbles.go__

```go
    type Marble struct {
        ObjectType string        `json:"docType"`
        Id       string          `json:"id"`
        Color      string        `json:"color"`
        Size       int           `json:"size"`
        Owner      OwnerRelation `json:"owner"`
    }
```

__/chaincode/write_ledger.go__

```go
    func set_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
        var err error
        fmt.Println("starting set_owner")

        // this is quirky
        // todo - get the "company that authed the transfer" from the certificate instead of an argument
        // should be possible since we can now add attributes to the enrollment cert
        // as is.. this is a bit broken (security wise), but it's much much easier to demo! holding off for demos sake

        if len(args) != 3 {
            return shim.Error("Incorrect number of arguments. Expecting 3")
        }

        // input sanitation
        err = sanitize_arguments(args)
        if err != nil {
            return shim.Error(err.Error())
        }

        var marble_id = args[0]
        var new_owner_id = args[1]
        var authed_by_company = args[2]
        fmt.Println(marble_id + "->" + new_owner_id + " - |" + authed_by_company)

        // check if user already exists
        owner, err := get_owner(stub, new_owner_id)
        if err != nil {
            return shim.Error("This owner does not exist - " + new_owner_id)
        }

        // get marble's current state
        marbleAsBytes, err := stub.GetState(marble_id)
        if err != nil {
            return shim.Error("Failed to get marble")
        }
        res := Marble{}
        json.Unmarshal(marbleAsBytes, &res)           //un stringify it aka JSON.parse()

        // check authorizing company
        if res.Owner.Company != authed_by_company{
            return shim.Error("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.")
        }

        // transfer the marble
        res.Owner.Id = new_owner_id                   //change the owner
        res.Owner.Username = owner.Username
        res.Owner.Company = owner.Company
        jsonAsBytes, _ := json.Marshal(res)           //convert to array of bytes
        err = stub.PutState(args[0], jsonAsBytes)     //rewrite the marble with id as key
        if err != nil {
            return shim.Error(err.Error())
        }

        fmt.Println("- end set owner")
        return shim.Success(nil)
    }
```

This `set_owner()` function will change the owner of a particular marble.
It takes in an array of strings input argument and returns `nil` if successful.
Within the array the first index should have the id of the marble which is also the key in the key/value pair.
We first need to retrieve the current marble struct by using this id.
This is done with `stub.GetState(marble_id)` and then unmarshal it into a marble structure with `json.Unmarshal(marbleAsBytes, &res)`.
From there we can index into the structure with `res.Owner.Id` and overwrite the marble's owner with the new owners Id.
Next we Marshal the structure back up so that we can use `stub.PutState()` to overwrite the marble with its new attributes.

Let’s take 1 step up and look at how this chaincode was called from our node.js app.

__/utils/websocket_server_side.js__

```js
    //process web socket messages
    ws_server.process_msg = function (ws, data) {
        var options = {
            peer_urls: [helper.getPeersUrl(0)],
            ws: ws,
            endorsed_hook: endorse_hook,
            ordered_hook: orderer_hook
        };
        if (marbles_lib === null) {
            logger.error('marbles lib is null...');             //can't run in this state
            return;
        }

        // create a new marble
        if (data.type == 'create') {
            logger.info('[ws] create marbles req');
            options.args = {
                color: data.color,
                size: data.size,
                marble_owner: data.username,
                owners_company: data.company,
                owner_id: data.owner_id,
                auth_company: process.env.marble_company,
            };

            marbles_lib.create_a_marble(options, function (err, resp) {
                if (err != null) send_err(err, data);
                else options.ws.send(JSON.stringify({ msg: 'tx_step', state: 'finished' }));
            });
        }

        // transfer a marble
        else if (data.type == 'transfer_marble') {
            logger.info('[ws] transfering req');
            options.args = {
                marble_id: data.id,
                owner_id: data.owner_id,
                auth_company: process.env.marble_company
            };

            marbles_lib.set_marble_owner(options, function (err, resp) {
                if (err != null) send_err(err, data);
                else options.ws.send(JSON.stringify({ msg: 'tx_step', state: 'finished' }));
            });
        }
        ...
```

This snippet of `process_msg()` receives all websocket messages (code found in app.js).
It will detect what type of ws (websocket) message was sent.
In our case, it should detect a `transfer_marble` type.
Looking at that code we can see it will setup an `options` variable and then kick off `marbles_lib.set_marble_owner()`.
This is the function that will tell the SDK to build the proposal and process the transfer action.

Next let’s look at that function.

__/utils/marbles_cc_lib.js__

```js
    //-------------------------------------------------------------------
    // Set Marble Owner
    //-------------------------------------------------------------------
    marbles_chaincode.set_marble_owner = function (options, cb) {
        console.log('');
        logger.info('Setting marble owner...');

        var opts = {
            channel_id: g_options.channel_id,
            chaincode_id: g_options.chaincode_id,
            chaincode_version: g_options.chaincode_version,
            event_url: g_options.event_url,
            endorsed_hook: options.endorsed_hook,
            ordered_hook: options.ordered_hook,
            cc_function: 'set_owner',
            cc_args: [
                options.args.marble_id,
                options.args.owner_id,
                options.args.auth_company
            ],
            peer_tls_opts: g_options.peer_tls_opts,
        };
        fcw.invoke_chaincode(enrollObj, opts, cb);
    };
        ...
```

The the `set_marble_owner()` function is listed above.
The important parts are that it is setting the proposal's invocation function name to "set_owner" with the line `fcn: 'set_owner'`.
Note that the peer and orderer URLs have already been set when we enrolled the admin.
By default the SDK will send this transaction to all peers that have been added with `chain.addPeer`.
In our case the SDK will send to only 1 peer, since we have only added the 1 peer.
Remember this peer was added in the `enrollment` section.

Now let’s look 1 more step up to how we sent this websocket message from the UI.

__/public/js/ui_building.js__

```js
    $('.innerMarbleWrap').droppable({drop:
        function( event, ui ) {
            var marble_id = $(ui.draggable).attr('id');

            //  ------------ Delete Marble ------------ //
            if($(event.target).attr('id') === 'trashbin'){
                // [removed code for brevity]
            }

            //  ------------ Transfer Marble ------------ //
            else{
                var dragged_owner_id = $(ui.draggable).attr('owner_id');
                var dropped_owner_id = $(event.target).parents('.marblesWrap').attr('owner_id');

                console.log('dropped a marble', dragged_owner_id, dropped_owner_id);
                if (dragged_owner_id != dropped_owner_id) {
                $(ui.draggable).addClass('invalid bounce');
                    transfer_marble(marble_id, dropped_owner_id);
                    return true;
                }
            }
        }
    });

    ...

    function transfer_marble(marbleName, to_username, to_company){
        show_tx_step({ state: 'building_proposal' }, function () {
            var obj = {
                type: 'transfer_marble',
                id: marbleId,
                owner_id: to_owner_id,
                v: 1
            };
            console.log(wsTxt + ' sending transfer marble msg', obj);
            ws.send(JSON.stringify(obj));
            refreshHomePanel();
        });
    }
```

In the first section referencing `$('.innerMarbleWrap')` you can see we used jQuery and jQuery-UI to implement the drag and drop functionality.
With this code we get a droppable event trigger.
Much of the code is spent parsing for the details of the marble that was dropped and the user it was dropped into.

When the event fires we first check to see if this marble actually moved owners, or if it was just picked up and dropped back down.
If its owner has changed we go off to the `transfer_marble()` function.
This function creates a JSON message with all the needed data and uses our websocket to send it with `ws.send()`.

The last piece of the puzzle is how Marbles realize the transfer is complete.
Well, marbles will periodically check on all the marbles and compares it to the last known state.
If there is a difference it will broadcast the new marble state to all connected JS clients.
The clients will receive this websocket message and redraw the marbles.

Now you know the whole flow.
The admin moved the marble, JS detected the drag/drop, client sends a websocket message, marbles receives the websocket message, sdk builds/sends a proposal, peer endorses the proposal, sdk sends the proposal for ordering, the orderer orders and sends a block to peer, our peer commits the block, marbles node code gets new marble status periodically, sends marble websocket message to client, and finally the client redraws the marble in its new home.

That’s it! Hope you had fun transferring marbles.

// Require https to call REST APIs in a blockchain network peer.
const https = require('https');

// --------------------------------------------------------------------------
// Helper function to call the Invoke function in a chaincode.
// --------------------------------------------------------------------------
module.exports.invokeCC = function(user, chaincodeID, fcn, args) {
    // Construct the invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: chaincodeID,
        // Function to trigger
        fcn: fcn,
        // Parameters for the invoke function
        args: args
    };

    // Trigger the invoke transaction
    var invokeTx = user.invoke(invokeRequest);

    // Print the invoke results
    invokeTx.on('submitted', function(results) {
        // Invoke transaction submitted successfully
        console.log('Successfully submitted chaincode invoke transaction: request='
		 	+ JSON.stringify(invokeRequest) + ', response=', results);
    });
    invokeTx.on('complete', function(results) {
        // Invoke transaction completed successfully
        console.log('Successfully completed chaincode invoke transaction: request='
			+ JSON.stringify(invokeRequest) + ', response=', results);
    });
    invokeTx.on('error', function(err) {
        // Invoke transaction submission failed
        console.log('Failed to submit chaincode invoke transaction: request='
			+ JSON.stringify(invokeRequest) + ', error=', err);
    });
}

// --------------------------------------------------------------------------
// Helper function to call the Query function in a chaincode.
// --------------------------------------------------------------------------
module.exports.queryCC = function(user, chaincodeID, fcn, args, callback) {
    // Construct the invoke request
    var queryRequest = {
        // Name (hash) required for invoke
        chaincodeID: chaincodeID,
        // Function to trigger
        fcn: fcn,
        // Parameters for the invoke function
        args: args
    };

    // Trigger the query transaction
    var queryTx = user.query(queryRequest);

    // Print the invoke results
    queryTx.on('submitted', function(results) {
        // Invoke transaction submitted successfully
        console.log('Successfully submitted chaincode query transaction: request='
			+ JSON.stringify(queryRequest) + ', response=', results);
    });
    queryTx.on('complete', function(results) {
        // Invoke transaction completed successfully
        console.log('Successfully completed chaincode query transaction: request='
			+ JSON.stringify(queryRequest) + ', response=', results);
		if (callback) callback(null, results.result.toString());
    });
    queryTx.on('error', function(err) {
        // Invoke transaction submission failed
        console.log('Failed to submit chaincode query transaction: request='
			+ JSON.stringify(queryRequest) + ', error=', err);
		if (callback) callback(err, null);
    });
}

// --------------------------------------------------------------------------
// Call the peer's REST API to fetch chain statistics.
// --------------------------------------------------------------------------
module.exports.getChainStats = function(peer, callback) {
	var url = 'https://' + peer.api_host + ':' + peer.api_port + '/chain';
    https.get(url, function (res) {
		if (res.statusCode !== 200) {
			console.log('Error getting chain stats, error code = %d', res.statusCode);
			callback('Error getting chain stats');
		}
		res.setEncoding('utf8');
		res.on('data', function (data) {
			callback(null, JSON.parse(data));
		});
	}).on('error', function (e) {
		callback(e);
	});
}

// --------------------------------------------------------------------------
// Call the peer's REST API to fetch statistics for a specific block.
// --------------------------------------------------------------------------
module.exports.getBlockStats = function(peer, id, callback) {
	var url = 'https://' + peer.api_host + ':' + peer.api_port + '/chain/blocks/' + id;
    https.get(url, function (res) {
		if (res.statusCode !== 200) {
			console.log('Error getting block stats, error code = %d', res.statusCode);
			callback('Error getting block stats');
		}
		res.setEncoding('utf8');
		res.on('data', function (data) {
			callback(null, JSON.parse(data));
		});
	}).on('error', function (e) {
		callback(e);
	});
}

// --------------------------------------------------------------------------
// Internal function to send periodic heart_beat REST requests to a blockchain
// peer REST API to fetch chain statistics.  The goal is to detect if there
// is a change.
// (has fast and slow mode)
// --------------------------------------------------------------------------
var selectedPeer = 0;
// Array of unix timestamps, 1 for each unsettled action
var q = [];
// Unix timestamp of the last time we polled
var lastPoll = 0;
// Last blockheight found
var lastBlock = 0;
var monitorFunction = null;
var slow_mode = 10000;
var fast_mode = 500;

function heart_beat(peer){
	// Slow mode poll
	if(lastPoll + slow_mode < Date.now()) {
		lastPoll = Date.now();
		module.exports.getChainStats(peer, cb_got_stats);
	}
	else{
		for(var i in q){
			var elasped = Date.now() - q[i];
			// Fresh unresolved action, fast mode!
			if(elasped <= 3000){
				console.log('[ibc-js] Unresolved action, must poll');
				lastPoll = Date.now();
				module.exports.getChainStats(peer, cb_got_stats);
			}
			else{
				// Expired action, remove it
				q.pop();
			}
		}
	}
}

// --------------------------------------------------------------------------
// Internal callback function to results from calling the peer's REST API
// to fetch statistics on a chain.
// --------------------------------------------------------------------------
function cb_got_stats(e, stats){
	console.log('cb_got_stats: ' + JSON.stringify(stats));
	if(e == null){
		if(stats && stats.height){
			console.log('cb_got_stats: lastBlock=' + lastBlock + ', stats.height=' + stats.height);
			// Determine if there is a new block.
			if(lastBlock != stats.height) {
				console.log('New block!', stats.height);
				lastBlock  = stats.height;
				// Action is resolved, remove.
				q.pop();
				// Call the user's callback.
				if(monitorFunction) monitorFunction(stats);
			}
		}
		else {
			console.log('CRAIG DEBUG: no stats.height');
		}
	}
}

// --------------------------------------------------------------------------
// Monitor a blockchain for new blocks being created in the chain.  When a
// change is detected the provided callback will be called.
// --------------------------------------------------------------------------
module.exports.monitor_blockheight = function(peer, callback) {
	setInterval(function(){heart_beat(peer);}, fast_mode);
	// Store the callback used elsewhere.
	monitorFunction = callback;
};

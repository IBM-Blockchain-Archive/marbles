const https = require('https');

// --------------------------------------------------------------------------
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
        console.log('Successfully submitted chaincode invoke transaction: request=' + JSON.stringify(invokeRequest) + ', response=', results);
    });
    invokeTx.on('complete', function(results) {
        // Invoke transaction completed successfully
        console.log('Successfully completed chaincode invoke transaction: request=' + JSON.stringify(invokeRequest) + ', response=', results);
    });
    invokeTx.on('error', function(err) {
        // Invoke transaction submission failed
        console.log('Failed to submit chaincode invoke transaction: request=' + JSON.stringify(invokeRequest) + ', error=', err);
    });
}

// --------------------------------------------------------------------------
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
        console.log('Successfully submitted chaincode query transaction: request=' + JSON.stringify(queryRequest) + ', response=', results);
    });
    queryTx.on('complete', function(results) {
        // Invoke transaction completed successfully
        console.log('Successfully completed chaincode query transaction: request=' + JSON.stringify(queryRequest) + ', response=', results);
		if (callback) callback(null, results);
    });
    queryTx.on('error', function(err) {
        // Invoke transaction submission failed
        console.log('Failed to submit chaincode query transaction: request=' + JSON.stringify(queryRequest) + ', error=', err);
		if (callback) callback(err, null);
    });
}

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
module.exports.getChainStats = function(peer, callback) {
	var url = 'https://' + peer.api_host + ':' + peer.api_port + '/chain';
	console.log('getChainStats: url=' + url);
    https.get(url, function (res) {
		console.log('getChainStats: res.statusCode=' + res.statusCode);
		if (res.statusCode !== 200) {
			console.log('Error getting chain stats, error code = %d', res.statusCode);
			callback('Error getting chain stats');
		}
		res.setEncoding('utf8');
		res.on('data', function (data) {
			console.log('getChainStats: on.data');
			console.log(data);
			callback(null, JSON.parse(data));
		});
	}).on('error', function (e) {
		console.log('Error getting chain stats');
		console.error(e);
		callback(e);
	});
}

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
module.exports.getBlockStats = function(peer, id, callback) {
	var url = 'https://' + peer.api_host + ':' + peer.api_port + '/chain/blocks/' + id;
	console.log('getBlockStats: url=' + url);
    https.get(url, function (res) {
		console.log('getBlockStats: res.statusCode=' + res.statusCode);
		if (res.statusCode !== 200) {
			console.log('Error getting block stats, error code = %d', res.statusCode);
			callback('Error getting block stats');
		}
		res.setEncoding('utf8');
		res.on('data', function (data) {
			console.log('getBlockStats: on.data');
			console.log(data);
			callback(null, JSON.parse(data));
		});
	}).on('error', function (e) {
		console.log('Error getting block stats');
		console.error(e);
		callback(e);
	});
}

// --------------------------------------------------------------------------
//heart_beat() - interval function to poll against blockchain height (has fast and slow mode)
// --------------------------------------------------------------------------
var selectedPeer = 0;
var q = [];																			//array of unix timestamps, 1 for each unsettled action
var lastPoll = 0;																	//unix timestamp of the last time we polled
var lastBlock = 0;																	//last blockheight found
var monitorFunction = null;
var slow_mode = 10000;
var fast_mode = 500;
function heart_beat(peer){
	if(lastPoll + slow_mode < Date.now()){									//slow mode poll
		//console.log('[ibc-js] Its been awhile, time to poll');
		lastPoll = Date.now();
		module.exports.getChainStats(peer, cb_got_stats);
	}
	else{
		for(var i in q){
			var elasped = Date.now() - q[i];
			if(elasped <= 3000){												//fresh unresolved action, fast mode!
				console.log('[ibc-js] Unresolved action, must poll');
				lastPoll = Date.now();
				module.exports.getChainStats(peer, cb_got_stats);
			}
			else{
				//console.log('[ibc-js] Expired, removing');
				q.pop();													//expired action, remove it
			}
		}
	}
}

function cb_got_stats(e, stats){
	console.log('cb_got_stats: ' + JSON.stringify(stats));
	if(e == null){
		if(stats && stats.height){
			console.log('cb_got_stats: lastBlock=' + lastBlock + ', stats.height=' + stats.height);
			if(lastBlock != stats.height) {									//this is a new block!
				console.log('[ibc-js] New block!', stats.height);
				lastBlock  = stats.height;
				q.pop();													//action is resolved, remove
				if(monitorFunction) monitorFunction(stats);				//call the user's callback
			}
		}
		else {
			console.log('CRAIG DEBUG: no stats.height');
		}
	}
}

// EXTERNAL- monitor_blockheight() - exposed function that user can use to get callback when any new block is written to the chain
module.exports.monitor_blockheight = function(peer, cb) {								//hook in your own function, triggers when chain grows
	setInterval(function(){heart_beat(peer);}, fast_mode);
	monitorFunction = cb;													//store it
};

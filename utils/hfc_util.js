// Require https to call REST APIs in a blockchain network peer.
const http = require('http');

var hfc = require('@blockchain/hfc');
var fs = require('fs');

var peerHost = "localhost";
var peerRestPort = "7053";

// --------------------------------------------------------------------------
// Helper function to call the Invoke function in a chaincode.
// --------------------------------------------------------------------------
module.exports.invokeCC = function(user, chaincode_id, fcn, args, callback) {
	// send proposal to endorser
	var request = {
		targets: [hfc.getPeer('grpc://localhost:7051')],
		chaincodeId : chaincode_id,
		fcn: fcn,
		args: args
	};
	console.log("Calling invoke on the cc");
	user.sendTransactionProposal(request)
	.then(
		function(results) {
			console.log("Got response from invoke");
			var proposalResponses = results[0];
			var proposal = results[1];
			if (proposalResponses[0].response.status === 200) {
				console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
				return user.sendTransaction(proposalResponses[0], proposal);
			} else {
				var error = 'Failed to obtain transaction endorsement. Error code: ' + status;
				console.log(error);
				if (callback) {
					callback(error);
				}
			}
		},
		function(err) {
			console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
			if (callback) {
				callback(err);
			}
		}
	).then(
		function(results) {
			console.log('Successfully ordered endorsement transaction.');
			console.log("May need to sleep here");
			console.log(results);
			if (callback) {
				callback(null, results);
			}
		}
	).catch(
		function(err) {
			var error = "Unexpected error during invoke: " + err.stack ? err.stack : err;
			console.log(error);
			if (callback) {
				callback(error);
			}
		}
	);
}

// --------------------------------------------------------------------------
// Helper function to call the Query function in a chaincode.
// --------------------------------------------------------------------------
module.exports.queryCC = function(user, chaincode_id, fcn, args, callback) {
	// send proposal to endorser
	var request = {
		targets: [hfc.getPeer('grpc://localhost:7051')],
		chaincodeId : chaincode_id,
		fcn: fcn,
		args: args
	};
	console.log("Calling queryByChaincode");
	user.queryByChaincode(request)
	.then(
		function(results) {
			if (callback) {
				callback(null, results);
			}
		},
		function(err) {
			console.log('Failed to query due to error: ' + err.stack ? err.stack : err);
			if (callback) {
				callback(err);
			}
		}
	).catch(
		function(err) {
			var error = "Unexpected error during query: " + err.stack ? err.stack : err;
			console.log(error);
			if (callback) {
				callback(error);
			}
		}
	);
}

// --------------------------------------------------------------------------
// Call the peer's REST API to fetch chain statistics.
// --------------------------------------------------------------------------
module.exports.getChainStats = function(peer, callback) {
	var url = 'http://' + peerHost + ':' + peerRestPort + '/chain';
	http.get(url, function (res) {
		if (res.statusCode !== 200) {
			console.log('Error getting chain stats, error code = %d', res.statusCode);
			callback('Error getting chain stats');
		}
		res.setEncoding('utf8');
		res.on('data', function (data) {
			console.log('Got chain stats: ' + data);
			console.log(data);
			callback(null, JSON.parse(data));
		});
	}).on('error', function (e) {
		console.log('Error getting chain stats, error ' + e);
		var error = "Unexpected error during getChainStats: " + e.stack ? e.stack : e;
		console.log(error);
		callback(e);
	});
}

// --------------------------------------------------------------------------
// Call the peer's REST API to fetch statistics for a specific block.
// --------------------------------------------------------------------------
module.exports.getBlockStats = function(peer, id, callback) {
	var url = 'http://' + peerHost + ':' + peerRestPort + '/chain/blocks/' + id;
	http.get(url, function (res) {
		if (res.statusCode !== 200) {
			console.log('Error getting block stats, error code = %d', res.statusCode);
			callback('Error getting block stats');
		}
		res.setEncoding('utf8');
		res.on('data', function (data) {
			callback(null, JSON.parse(data));
		});
	}).on('error', function (e) {
		console.log('Error getting block stats, error ' + e);
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
	if(e == null){
		if(stats && stats.height){
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

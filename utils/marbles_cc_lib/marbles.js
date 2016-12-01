//var async = require('async');
//var path = require('path');
//var url = require('url');

module.exports = function (chain, chaincode_id, logger) {
	var hfc = require('../fabric-sdk-node2/index.js');
	var helper = require(__dirname + '/../helper.js')();

	var marbles = {};

	//-------------------------------------------------------------------
	// Create Marble - options are [marble_id, color, size, owner]
	//-------------------------------------------------------------------
	marbles.create_a_marble = function (webUser, options, cb) {
		console.log('\nCreating a marble\n');
		return new Promise(function(resolve, reject) {
			chain.enroll('admin', 'adminpw')
			.then(
				function() {
					// send proposal to endorser
					var request = {
						targets: [hfc.getPeer(helper.getPeersUrl(0)), hfc.getPeer(helper.getPeersUrl(1))],
						chaincodeId : chaincode_id,
						fcn: 'init_marble',
						args: options 									//args == [marble_id, color, size, owner]
					};
					return webUser.sendTransactionProposal(request);
				},
				function(err) {
					console.log('Failed to send invoke due to error: ' + err.stack ? err.stack : err);
				}
			).then(
				function(results) {
					var proposalResponses = results[0];
					var proposal = results[1];
					if (proposalResponses[0].response.status === 200) {
						console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
						return webUser.sendTransaction(proposalResponses, proposal);
					} else {
						console.log('Failed to obtain transaction endorsement. Error code: ' + proposalResponses[0].response.status);
					}
				},
				function(err) {
					console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
				}
			).then(
				function(response) {
					if (response.Status === 'SUCCESS') {
						console.log('Successfully ordered endorsement transaction.');
						console.log(' need to wait now for the committer to catch up');
						if(cb) cb();
					} else {
						console.log('Failed to order the endorsement of the transaction. Error code: ' + response.status);
					}
				},
				function(err) {
					console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
				}
			).catch(
				function(err) {
					console.log('Failed, in catch block' + err.stack ? err.stack : err);
				}
			);
		});
	};


	//-------------------------------------------------------------------
	// Create Marble - delete all marbles from index (this will make the app 'forget' them)
	//-------------------------------------------------------------------
	marbles.reset_marble_index = function (webUser, cb) {
		console.log('\nRemoving marbles from index\n');
		return new Promise(function(resolve, reject) {
			chain.enroll('admin', 'adminpw')
			.then(
				function() {
					// send proposal to endorser
					var request = {
						targets: [hfc.getPeer(helper.getPeersUrl(0)), hfc.getPeer(helper.getPeersUrl(1))],
						chaincodeId : chaincode_id,
						fcn: 'init',
						args: ['99']
					};
					return webUser.sendTransactionProposal(request);
				},
				function(err) {
					console.log('Failed to send invoke due to error: ' + err.stack ? err.stack : err);
				}
			).then(
				function(results) {
					var proposalResponses = results[0];
					var proposal = results[1];
					if (proposalResponses[0].response.status === 200) {
						console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
						return webUser.sendTransaction(proposalResponses, proposal);
					} else {
						console.log('Failed to obtain transaction endorsement. Error code: ' + proposalResponses[0].response.status);
					}
				},
				function(err) {
					console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
				}
			).then(
				function(response) {
					if (response.Status === 'SUCCESS') {
						console.log('Successfully ordered endorsement transaction.');
						console.log(' need to wait now for the committer to catch up');
						if(cb) cb();
					} else {
						console.log('Failed to order the endorsement of the transaction. Error code: ' + response.status);
					}
				},
				function(err) {
					console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
				}
			).catch(
				function(err) {
					console.log('Failed, in catch block' + err.stack ? err.stack : err);
				}
			);
		});
	};
	

	return marbles;
};


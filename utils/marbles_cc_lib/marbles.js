//var async = require('async');
var path = require('path');
//var url = require('url');

module.exports = function (chain, chaincode_id, logger) {
	var hfc = require('../fabric-sdk-node2/index.js');
	var helper = require(__dirname + '/../helper.js')();
	var common = require(path.join(__dirname, './common.js'))();
	var marbles = {};

	//-------------------------------------------------------------------
	// Create Marble
	//-------------------------------------------------------------------
	marbles.create_a_marble = function (webUser, options, cb) {
		console.log('\ncreating a marble...');
		
		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'init_marble',
			args: options 									//args == [marble_id, color, size, username, company]
		};
		console.log('!', options);
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];
				if (proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement. Error code: ' + proposalResponses[0].response.status);
				}
			}
		).then(
			function (response) {
				if (response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if (cb) cb();
				}
				else {
					console.log('Failed to order the endorsement of the transaction. Error code: ' + response.status);
				}
			}
		).catch(
			function (err) {
				console.log('unexpected error', err);
				if(cb) return cb(err, null);
			}
		);
	};


	//-------------------------------------------------------------------
	// Create Marble - delete all marbles from index (this will make the app 'forget' them)
	//-------------------------------------------------------------------
	marbles.reset_marble_index = function (webUser, cb) {
		console.log('\nremoving marbles from index...');
		return new Promise(function (resolve, reject) {
			chain.enroll('admin', 'adminpw')
				.then(
				function () {
					// send proposal to endorser
					var request = {
						targets: [hfc.getPeer(helper.getPeersUrl(0))],
						chaincodeId : chaincode_id,
						fcn: 'init',
						args: ['99']
					};
					return webUser.sendTransactionProposal(request);
				},
				function (err) {
					console.log('Failed to send invoke due to error: ' + err.stack ? err.stack : err);
				}
				).then(
				function (results) {
					var proposalResponses = results[0];
					var proposal = results[1];
					if (proposalResponses[0].response.status === 200) {
						console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
						return webUser.sendTransaction(proposalResponses, proposal);
					} else {
						console.log('Failed to obtain transaction endorsement. Error code: ' + proposalResponses[0].response.status);
					}
				},
				function (err) {
					console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
				}
				).then(
				function (response) {
					if (response.Status === 'SUCCESS') {
						console.log('Successfully ordered endorsement transaction.');
						if (cb) cb();
					} else {
						console.log('Failed to order the endorsement of the transaction. Error code: ' + response.status);
					}
				},
				function (err) {
					console.log('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
				}
				).catch(
				function (err) {
					console.log('unexpected error', err);
					if(cb) return cb(err, null);
				}
				);
		});
	};

	//-------------------------------------------------------------------
	// Get Marble Index List
	//----------------------------------------------------
	marbles.get_marble_list = function (webUser, cb) {
		console.log('\nfetching marble index list...');
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: ['_marbleindex']
		};

		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('! Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'}, null);
				}
				else{

					// -- send formated response -- //
					var formated = common.format_query_resp(response_payloads, 'marbles');
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		)
		.catch(
			function (err) {
				console.log('unexpected error', err);
				if(cb) return cb(err, null);
			}
		);
	};
	

	//-------------------------------------------------------------------
	// Get a Marble
	//----------------------------------------------------
	marbles.get_marble = function (webUser, marble_name, cb) {
		console.log('\nfetching marble ' + marble_name +' list...');
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: [marble_name]
		};

		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('! Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'}, null);
				}
				else{

					// -- send formated response -- //
					var formated = common.format_query_resp(response_payloads);
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		).catch(
			function (err) {
				console.log('unexpected error', err);
				if(cb) return cb(err, null);
			}
		);
	};

	//-------------------------------------------------------------------
	// Set Marble Owner 
	//-------------------------------------------------------------------
	marbles.set_marble_owner = function (webUser, options, cb) {
		console.log('\nsetting marble owner...');

		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'set_owner',
			args: options 									//args == ["name", "bob", "united_marbles", "united_marbles"]
		};
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];
				if (proposalResponses[0] && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement. Error msg: ', proposalResponses[0]);
					throw common.format_error_msg(proposalResponses[0]);
				}
			}
		).then(
			function (response) {
				if (response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if(cb) return cb(null, null);
				}
				else {
					console.log('Failed to order the endorsement of the transaction. Error code: ', response);
					throw response;
				}
			}
		).catch(
			function (err) {
				console.log('caught error', err);		//to do - this format everywhere
				if(cb) return cb(err, null);
			}
		);
	};

	//-------------------------------------------------------------------
	// Delete Marble - options are [marble_id]
	//-------------------------------------------------------------------
	marbles.delete_marble = function (webUser, options, cb) {
		console.log('\ndeleting a marble...');
		
		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0)), hfc.getPeer(helper.getPeersUrl(1))],
			chaincodeId: chaincode_id,
			fcn: 'delete_marble',
			args: options 									//args == [marble_id]
		};
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];
				if (proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement. Error code: ' + proposalResponses[0].response.status);
				}
			}
		).then(
			function (response) {
				if (response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if (cb) cb();
				}
				else {
					console.log('Failed to order the endorsement of the transaction. Error code: ' + response.status);
				}
			}
		).catch(
			function (err) {
				console.log('unexpected error', err);
				if (cb) cb();
			}
		);
	};

	return marbles;
};


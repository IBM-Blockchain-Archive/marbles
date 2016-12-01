//var async = require('async');
//var path = require('path');
//var url = require('url');

module.exports = function (chain, chaincode_id, logger) {
	var hfc = require('../fabric-sdk-node2/index.js');
	var marbles = {};

	//-------------------------------------------------------------------
	// Create Marble - options are [marble_id, color, size, owner]
	//-------------------------------------------------------------------
	marbles.create_a_marble = function (webUser, options, cb) {
		console.log('\ncreating a marble...');
		return new Promise(function (resolve, reject) {
			chain.enroll('admin', 'adminpw')
				.then(
				function () {
					// send proposal to endorser
					var request = {
						targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
						chaincodeId: chaincode_id,
						fcn: 'init_marble',
						args: options 									//args == [marble_id, color, size, owner]
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
						console.log(' need to wait now for the committer to catch up');
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
					console.log('Failed, in catch block' + err.stack ? err.stack : err);
				}
				);
		});
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
						targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
						chaincodeId: chaincode_id,
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
						console.log(' need to wait now for the committer to catch up');
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
					console.log('Failed, in catch block' + err.stack ? err.stack : err);
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
			targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
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
					var formated = format_query_resp(response_payloads, 'marbles');
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		)
		.catch(
			function (err) {
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
			targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
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
					var formated = format_query_resp(response_payloads);
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		).catch(
			function (err) {
				if(cb) return cb(err, null);
			}
		);
	};

	//-------------------------------------------------------------------
	// Set Marble Owner - options are [marble_id, owner]
	//-------------------------------------------------------------------
	marbles.set_marble_owner = function (webUser, options, cb) {
		console.log('\nsetting marble owner...');

		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
			chaincodeId: chaincode_id,
			fcn: 'set_owner',
			args: options 									//args == ["name", "bob"]
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
				if(cb) return cb(err, null);
			}
		);
	};

	//format query response
	function format_query_resp(peer_responses, grab_inner_field){
		var ret = 	{
						peers_agree: true,
						payload: []
					};
		var last = null;
		var error = null;

		// -- iter on each peer's response -- //
		for(var i in peer_responses) {					//pray to the gods that i===peer_id and they never move
			var as_string = peer_responses[i].toString('utf8');
			var as_obj = {marbles: null};
			console.log('Peer' + i, 'payload says:', as_string);

			try{
				// -- don't parse buffers -- //
				if(as_string !== ''){
					as_obj = JSON.parse(as_string);
				}

				if(grab_inner_field) ret.payload.push(as_obj[grab_inner_field]);	//only return inner field
				else ret.payload.push(as_obj);
				
				// -- compare peer responses -- //
				if(last != null){							//check if all peers agree
					if(last !== as_string) {
						console.log('warning - some peers do not agree on query', last, as_string);
						ret.peers_agree = false;
					}
					last = as_string;
				}
			}

			// -- JSON Error -- //
			catch(e){
				error = {error: 'payload not valid json', payload: peer_responses};
			}
		}

		return {ret: ret, error: error};
	}

	return marbles;
};


//var async = require('async');
var path = require('path');
//var url = require('url');

module.exports = function (chain, chaincode_id, logger) {
	var hfc = require('../fabric-sdk-node2/index.js');
	var helper = require(path.join(__dirname, '/../helper.js'))();
	var common = require(path.join(__dirname, './common.js'))();
	var users = {};

	//-------------------------------------------------------------------
	// Create User - options are {username: bob}
	//-------------------------------------------------------------------
	users.register_owner = function (webUser, owner_obj, cb) {
		console.log('\nCreating a user\n');
		owner_obj.docType = 'owner';
		owner_obj.timestamp = Date.now();

		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'init_owner',
			args: [JSON.stringify(owner_obj)] 						//args == ['"docType": "owner", "username": "bob", "company": "united marbles"}']
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
					console.log('Failed to obtain transaction endorsement');
					throw common.format_error_msg(proposalResponses[0]);
				}
			}
		).then(
			function (response) {
				if (response && response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if(cb) cb(null, null);
				}
				else {
					console.log('Failed to order the endorsement of the transaction. Error code: ', response);
					throw response;
				}
			}
		).catch(
			function (err) {
				console.log('caught error', err);
				if(cb) return cb(err, null);
			}
		);
	};

	//-------------------------------------------------------------------
	// Get Owner Index List
	//----------------------------------------------------
	users.get_owner_list = function (webUser, cb) {
		console.log('\nfetching owner index list...');
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: ['_ownerindex']
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
					var formated = common.format_query_resp(response_payloads, 'owners');
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
	// Format Owner's Actual Key Name
	//----------------------------------------------------
	users.build_owner_name = function(username, company){
		return username.toLowerCase() + '.' + company.toLowerCase();
	};
	

	//-------------------------------------------------------------------
	// Get a Owner
	//----------------------------------------------------
	users.get_owner = function (webUser, opts, cb) {
		console.log('\nfetching owner ' + users.build_owner_name(opts.username, opts.company) + ' list...');
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0))],
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: [users.build_owner_name(opts.username, opts.company)]
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
				if(cb) return cb(err, null);
			}
		);
	};

	return users;
};


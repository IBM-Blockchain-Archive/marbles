//-------------------------------------------------------------------
// Marbles Chaincode - Marble Functions
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (chain, logger) {
	var common = require(path.join(__dirname, './common.js'))();
	var marbles = {};

	//-------------------------------------------------------------------
	// Create Marble
	//-------------------------------------------------------------------
	marbles.create_a_marble = function (webUser, options, cb) {
		console.log('\ncreating a marble...');
		
		// send proposal to endorser
		var request = {
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'init_marble',
			args: [
					options.args.marble_id, 
					options.args.color, 
					options.args.size, 
					options.args.marble_owner, 
					options.args.owners_company,
					options.args.auth_company
					] //args == [marble_id, color, size, username, company, auth_company]
		};
		console.log('!', options);
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];
				if (proposalResponses && proposalResponses[0] && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'ordering'}));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'endorsing_failed'}));
					throw common.format_error_msg(proposalResponses[0]);
				}
			}
		).then(
			function (response) {
				if (response && response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'committing'}));
					if(cb) cb(null, null);
				}
				else {
					console.log('Failed to order the endorsement of the transaction.');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'ordering_failed'}));
					throw response;
				}
			}
		).catch(
			function (err) {
				console.log('error in catch block', typeof err, err);
				var e = null;
				if(typeof err === 'string' && err.indexOf('marble already exists')){
					e = err;
				}
				if(typeof err === 'string'){								//only pass these errors until we fix it
					if(err.indexOf('cannot authorize')) e = err;
					if(err.indexOf('marble already exists')) e = err;
					if(err.indexOf('Incorrect number of arguments')) e = err;
					if(err.indexOf('argument must be')) e = err;
					if(err.indexOf('Owner does not exist')) e = err;
				}
				if(e == null){
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'committing'}));
				}
				if(cb) return cb(e, null);
			}
		);
	};


	//-------------------------------------------------------------------
	// Get Marble Index List
	//----------------------------------------------------
	marbles.get_marble_list = function (webUser, options, cb) {
		console.log('\nfetching marble index list...');
		var request = {
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'compelte_marble_index',
			args: [' ']
		};

		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'}, null);
				}
				else{

					// -- send formated response -- //
					var formated = common.format_query_resp(response_payloads);
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		)
		.catch(
			function (err) {
				console.log('caught error', err);
				if(cb) return cb(err, null);
			}
		);
	};
	

	//-------------------------------------------------------------------
	// Get a Marble
	//----------------------------------------------------
	marbles.get_marble = function (webUser, options, cb) {
		console.log('\nfetching marble ' + options.marble_id +' list...');
		var request = {
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'read',
			args: [options.args.marble_id]
		};

		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('Query response is empty: ');
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
				console.log('caught error', err);
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
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'set_owner',
			args: [
					options.args.marble_id, 
					options.args.marble_owner, 
					options.args.owners_company, 
					options.args.auth_company
					] //args == ["name", "bob", "united_marbles", "united_marbles"]
		};
		console.log('!', options);
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];
				if (proposalResponses && proposalResponses[0] && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'ordering'}));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement', proposalResponses);
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'endorsing_failed'}));
					throw common.format_error_msg(proposalResponses[0]);
				}
			}
		).then(
			function (response) {
				if (response && response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'committing'}));
					if(cb) return cb(null, null);
				}
				else {
					console.log('Failed to order the endorsement of the transaction');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'ordering_failed'}));
					throw response;
				}
			}
		).catch(
			function (err) {
				console.log('error in catch block', typeof err, err);
				var e = null;
				if(typeof err === 'string'){								//only pass these errors until we fix it
					if(err.indexOf('cannot authorize')) e = err;
					if(err.indexOf('Failed to get marble')) e = err;
					if(err.indexOf('Incorrect number of arguments')) e = err;
				}
				if(e == null){
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'committing'}));
				}
				if(cb) return cb(e, null);
				else return;
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
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'delete_marble',
			args: [options.args.marble_id, options.args.auth_company] 	//args == [marble_id, auth_company]
		};
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];
				if (proposalResponses && proposalResponses[0] && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'ordering'}));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement', proposalResponses);
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'endorsing_failed'}));
					throw common.format_error_msg(proposalResponses[0]);
				}
			}
		).then(
			function (response) {
				if (response && response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'committing'}));
					if(cb) return cb(null, null);
				}
				else {
					console.log('Failed to order the endorsement of the transaction.');
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'ordering_failed'}));
					throw response;
				}
			}
		).catch(
			function (err) {
				console.log('error in catch block', typeof err, err);
				var e = null;
				if(typeof err === 'string'){								//only pass these errors until we fix it
					if(err.indexOf('cannot authorize')) e = err;
					if(err.indexOf('Marble does not exist')) e = err;
					if(err.indexOf('Incorrect number of arguments')) e = err;
					if(err.indexOf('Owner does not exist')) e = err;
				}
				if(e == null){
					if(options.ws) options.ws.send(JSON.stringify({msg: 'tx_step', state: 'committing'}));
				}
				if(cb) return cb(e, null);
				else return;
			}
		);
	};

	return marbles;
};


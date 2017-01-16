//-------------------------------------------------------------------
// Marbles Chaincode Library
//-------------------------------------------------------------------

module.exports = function (chain, logger) {
	var deploy_cc = require('./deploy_cc.js')(chain, logger);
	var marbles = require('./marbles.js')(chain, logger);
	var users = require('./users.js')(chain, logger);
	var common = require('./common.js')();
	var marbles_chaincode = {};

	// Chaincode -------------------------------------------------------------------------------

	//deploy chaincode
	marbles_chaincode.deploy_chaincode = function (webUser, options, cb) {
		deploy_cc.deploy_chaincode(webUser, options, cb);
	};

	//check chaincode
	marbles_chaincode.check_if_already_deployed = function (webUser, options, cb) {
		deploy_cc.check_if_already_deployed(webUser, options, cb);
	};

	// Marbles -------------------------------------------------------------------------------

	//create a marble
	marbles_chaincode.create_a_marble = function (webUser, options, cb) {
		marbles.create_a_marble(webUser, options, cb);
	};

	//get list of marbles
	marbles_chaincode.get_marble_list = function (webUser, options, cb) {
		marbles.get_marble_list(webUser, options, cb);
	};

	//get marble
	marbles_chaincode.get_marble = function (webUser, options, cb) {
		marbles.get_marble(webUser, options, cb);
	};

	//set marble owner
	marbles_chaincode.set_marble_owner = function (webUser, options, cb) {
		marbles.set_marble_owner(webUser, options, cb);
	};

	//delete marble
	marbles_chaincode.delete_marble = function (webUser, options, cb) {
		marbles.delete_marble(webUser, options, cb);
	};

	// Owners -------------------------------------------------------------------------------

	//register a owner/user
	marbles_chaincode.register_owner = function (webUser, options, cb) {
		users.register_owner(webUser, options, cb);
	};

	//get a owner/user
	marbles_chaincode.get_owner = function (webUser, options, cb) {
		users.get_owner(webUser, options, cb);
	};

	//get the owner list
	marbles_chaincode.get_owner_list = function (webUser, options, cb) {
		users.get_owner_list(webUser, options, cb);
	};

	marbles_chaincode.build_owner_name = function (username, company) {
		return users.build_owner_name(username, company);
	};

	// Debug -------------------------------------------------------------------------------

	//debug read
	marbles_chaincode.debug = function(webUser, options, cb){
		console.log('\n debug read of ' + JSON.stringify(options.args) + ' ...');
		var request = {
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'read',
			args: options.args
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
	
	//read everything
	marbles_chaincode.read_everything = function(webUser, options, cb){
		console.log('\nreading everything!...');
		var request = {
			targets: options.peer_urls,
			chaincodeId: options.chaincode_id,
			fcn: 'read_everything',
			args: ['']
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

	return marbles_chaincode;
};


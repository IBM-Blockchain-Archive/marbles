//var async = require('async');
//var path = require('path');
//var url = require('url');

//-------------------------------------------------------------------
// Marbles Chaincode Library
//-------------------------------------------------------------------
module.exports = function (chain, chaincode_id, logger) {
	var deploy_cc = require('./deploy_cc.js')(chain, chaincode_id, logger);
	var marbles = require('./marbles.js')(chain, chaincode_id, logger);
	var users = require('./users.js')(chain, chaincode_id, logger);
	var common = require('./common.js')();
	var marbles_chaincode = {};

	//deploy chaincode
	marbles_chaincode.deploy_chaincode = function (webUser, peer_urls, cb) {
		deploy_cc.deploy_chaincode(webUser, peer_urls, cb);
	};

	//check chaincode
	marbles_chaincode.check_if_already_deployed = function (webUser, peer_urls, cb) {
		deploy_cc.check_if_already_deployed(webUser, peer_urls, cb);
	};



	//create a marble
	marbles_chaincode.create_a_marble = function (webUser, peer_urls, ws,options, cb) {
		marbles.create_a_marble(webUser, peer_urls, ws, options, cb);
	};

	//get list of marbles
	marbles_chaincode.get_marble_list = function (webUser, peer_urls, cb) {
		marbles.get_marble_list(webUser, peer_urls, cb);
	};

	//get marble
	marbles_chaincode.get_marble = function (webUser, peer_urls, marble_name, cb) {
		marbles.get_marble(webUser, peer_urls, marble_name, cb);
	};

	//set marble owner
	marbles_chaincode.set_marble_owner = function (webUser, peer_urls, ws, options, cb) {
		marbles.set_marble_owner(webUser, peer_urls, ws, options, cb);
	};

	//delete marble
	marbles_chaincode.delete_marble = function (webUser, peer_urls, ws, options, cb) {
		marbles.delete_marble(webUser, peer_urls, ws, options, cb);
	};



	//register a owner/user
	marbles_chaincode.register_owner = function (webUser, peer_urls, owner_obj, cb) {
		users.register_owner(webUser, peer_urls, owner_obj, cb);
	};

	//get a owner/user
	marbles_chaincode.get_owner = function (webUser, peer_urls, options, cb) {
		users.get_owner(webUser, peer_urls, options, cb);
	};

	//get the owner list
	marbles_chaincode.get_owner_list = function (webUser, peer_urls, cb) {
		users.get_owner_list(webUser, peer_urls, cb);
	};

	marbles_chaincode.build_owner_name = function (username, company) {
		return users.build_owner_name(username, company);
	};


	//test read
	marbles_chaincode.test = function(webUser, peer_urls, test, cb){
		console.log('\ntestig ' + test + ' ...');
		var request = {
			targets: peer_urls,
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: [test]
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


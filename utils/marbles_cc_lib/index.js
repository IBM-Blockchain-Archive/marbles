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
	var marbles_chaincode = {};

	//deploy chaincode
	marbles_chaincode.deploy_chaincode = function (webUser, cb) {
		deploy_cc.deploy_chaincode(webUser, cb);
	};

	//check chaincode
	marbles_chaincode.check_if_already_deployed = function (webUser, cb) {
		deploy_cc.check_if_already_deployed(webUser, cb);
	};



	//create a marble
	marbles_chaincode.create_a_marble = function (webUser, options, cb) {
		marbles.create_a_marble(webUser, options, cb);
	};

	//get list of marbles
	marbles_chaincode.get_marble_list = function (webUser, cb) {
		marbles.get_marble_list(webUser, cb);
	};

	//get marble
	marbles_chaincode.get_marble = function (webUser, marble_name, cb) {
		marbles.get_marble(webUser, marble_name, cb);
	};

	//set marble owner
	marbles_chaincode.set_marble_owner = function (webUser, options, cb) {
		marbles.set_marble_owner(webUser, options, cb);
	};

	//delete marble
	marbles_chaincode.delete_marble = function (webUser, options, cb) {
		marbles.delete_marble(webUser, options, cb);
	};



	//register a owner/user
	marbles_chaincode.register_owner = function (webUser, owner_obj, cb) {
		users.register_owner(webUser, owner_obj, cb);
	};

	//get a owner/user
	marbles_chaincode.get_owner = function (webUser, options, cb) {
		users.get_owner(webUser, options, cb);
	};

	//get the owner list
	marbles_chaincode.get_owner_list = function (webUser, cb) {
		users.get_owner_list(webUser, cb);
	};

	marbles_chaincode.build_owner_name = function (username, company) {
		return users.build_owner_name(username, company);
	};

	return marbles_chaincode;
};


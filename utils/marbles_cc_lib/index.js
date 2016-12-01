//var async = require('async');
//var path = require('path');
//var url = require('url');

//-------------------------------------------------------------------
// Marbles Chaincode Library
//-------------------------------------------------------------------
module.exports = function (chain, chaincode_id, logger) {
	var deploy_cc = require('./deploy_cc.js')(chain, chaincode_id, logger);
	var marbles = require('./marbles.js')(chain, chaincode_id, logger);
	//var users = require('./users.js')(chain, chaincode_id, logger);
	var marbles_chaincode = {};

	//deploy chaincode
	marbles_chaincode.deploy_chaincode = function (cb) {
		deploy_cc.deploy_chaincodefunction(cb);
	};

	//deploy chaincode
	marbles_chaincode.check_if_already_deployed = function (cb) {
		deploy_cc.check_if_already_deployed(cb);
	};

	//create a marble
	marbles_chaincode.create_a_marble = function (webUser, options, cb) {
		marbles.create_a_marble(webUser, options, cb);
	};

	//reset marble index
	marbles_chaincode.reset_marble_index = function (webUser, cb) {
		marbles.reset_marble_index(webUser, cb);
	};

	return marbles_chaincode;
};


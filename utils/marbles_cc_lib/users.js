//var async = require('async');
//var path = require('path');
//var url = require('url');

module.exports = function (chain, chaincode_id, logger) {
	//var hfc = require('../fabric-sdk-node2/index.js');
	var users = {};

	//-------------------------------------------------------------------
	// Create User - options are {username: bob}
	//-------------------------------------------------------------------
	users.create_marble_user = function (webUser, options, cb) {
		console.log('\nCreating a user\n');
		if(cb) cb();
	};

	return users;
};


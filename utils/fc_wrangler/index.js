//-------------------------------------------------------------------
// Fabric Client Wrangler - Wrapper for the Hyperledger Fabric SDK
//-------------------------------------------------------------------

module.exports = function (g_options, logger) {
	var deploy_cc = require('./deploy_cc.js')(logger);
	var invoke_cc = require('./invoke_cc.js')(g_options, logger);
	var query_cc = require('./query_cc.js')(logger);
	var query_peer = require('./query_peer.js')(logger);
	var enrollment = require('./enrollment.js')(logger);
	var fcw = {};

	// ------------------------------------------------------------------------
	// Chaincode Functions
	// ------------------------------------------------------------------------

	// Install Chaincode
	fcw.install_chaincode = function (obj, options, cb_done) {
		deploy_cc.install_chaincode(obj, options, cb_done);
	};

	// Instantiate Chaincode
	fcw.instantiate_chaincode = function (obj, options, cb_done) {
		deploy_cc.instantiate_chaincode(obj, options, cb_done);
	};
	
	// Invoke Chaincode
	fcw.invoke_chaincode = function (obj, options, cb_done) {
		invoke_cc.invoke_chaincode(obj, options, cb_done);
	};

	// Query Chaincode
	fcw.query_chaincode = function (obj, options, cb_done) {
		query_cc.query_chaincode(obj, options, cb_done);
	};


	// ------------------------------------------------------------------------
	// Enrollment Functions
	// ------------------------------------------------------------------------

	// enroll an enrollId with the cop
	fcw.enroll = function (options, cb_done) {
		enrollment.enroll(options, cb_done);
	};

	// ------------------------------------------------------------------------
	// Ledger Functions
	// ------------------------------------------------------------------------
	// Get Block Data
	fcw.query_block = function(obj, options, cb_done){
		query_peer.query_block(obj, options, cb_done);
	};


	// ------------------------------------------------------------------------
	// Ledger Functions
	// ------------------------------------------------------------------------
	// Get Block Data
	fcw.query_channel_members = function(obj, options, cb_done){
		query_peer.query_channel_members(obj, options, cb_done);
	};
	

	// Get Blockheight
	fcw.query_channel = function(obj, options, cb_done){
		query_peer.query_channel(obj, options, cb_done);
	};

	// Get list of installed cc's
	fcw.query_installed_cc = function(obj, options, cb_done){
		query_peer.query_installed_cc(obj, options, cb_done);
	};

	// get list of instantiated cc's
	fcw.query_instantiated_cc = function(obj, options, cb_done){
		query_peer.query_instantiated_cc(obj, options, cb_done);
	};

	// get list of channels
	fcw.query_list_channels = function(obj, options, cb_done){
		query_peer.query_list_channels(obj, options, cb_done);
	};

	return fcw;
};

//-------------------------------------------------------------------
// Fabric Client Wrangler - Wrapper for the Hyperledger Fabric SDK
//-------------------------------------------------------------------

module.exports = function (logger) {
	var deploy_cc = require('./deploy_cc.js')(logger);
	var invoke_cc = require('./invoke_cc.js')(logger);
	var query_cc = require('./query_cc.js')(logger);
	var fcw = {};

	// ------------------------------------------------------------------------
	// Chaincode Functions
	// ------------------------------------------------------------------------

	// Deploy Chaincode
	fcw.deploy_chaincode = function (chain, options, cb_done) {
		deploy_cc.deploy_chaincode(chain, options, cb_done);
	};

	// Invoke Chaincode
	fcw.invoke_chaincode = function (chain, options, cb_done) {
		invoke_cc.invoke_chaincode(chain, options, cb_done);
	};

	// Query Chaincode
	fcw.query_chaincode = function (chain, options, cb_done) {
		query_cc.query_chaincode(chain, options, cb_done);
	};

	return fcw;
};

//-------------------------------------------------------------------
// Install + Instantiate + Upgrade Chaincode
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	//var Peer = require('fabric-client/lib/Peer.js');
	var deploy_cc = {};

	//-------------------------------------------------------------------
	// Install Chaincode - Must use Admin Cert enrollment
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					path_2_chaincode: "path to chaincode from proj root",
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					endorsed_hook: function(error, res){},
					peer_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					}
		}
	*/
	deploy_cc.install_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Installing Chaincode');
		var client = obj.client;

		// fix GOPATH - does not need to be real!
		process.env.GOPATH = path.join(__dirname, '../../chaincode');

		// send proposal to endorser
		var request = {
			targets: [client.newPeer(options.peer_urls[0], options.peer_tls_opts)],
			chaincodePath: options.path_2_chaincode,							//rel path from /server/libs/src/ to chaincode folder ex: './marbles_chaincode'
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
		};
		logger.debug('[fcw] Sending install req', request);

		client.installChaincode(request).then(function (results) {

			// --- Check Install Response --- //
			common.check_proposal_res(results, options.endorsed_hook);
			if (cb) return cb(null, results);

		}).catch(function (err) {

			// --- Errors --- //
			logger.error('[fcw] Error in install catch block', typeof err, err);
			var formatted = common.format_error_msg(err);
			if (cb) return cb(formatted, null);
			else return;
		});
	};


	//-------------------------------------------------------------------
	// Instantiate Chaincode - Must use Admin Cert enrollment
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					endorsed_hook: function(error, res){},
					ordered_hook: function(error, res){},
					cc_args: ["argument 1"],
					peer_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					}
		}
	*/

	deploy_cc.instantiate_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Instantiating Chaincode', options);
		var channel = obj.channel;
		var client = obj.client;

		// fix GOPATH - does not need to be real!
		process.env.GOPATH = path.join(__dirname, '../');

		// send proposal to endorser
		var request = {
			targets: [client.newPeer(options.peer_urls[0], options.peer_tls_opts)],
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			fcn: 'init',
			args: options.cc_args,
			txId: client.newTransactionID(),
		};
		logger.debug('[fcw] Sending instantiate req', request);

		channel.initialize().then(() => {
			channel.sendInstantiateProposal(request
				//nothing
			).then(
				function (results) {

					//check response
					var request = common.check_proposal_res(results, options.endorsed_hook);
					return channel.sendTransaction(request);
				}
				).then(
				function (response) {

					// All good
					if (response.status === 'SUCCESS') {
						logger.debug('[fcw] Successfully ordered instantiate endorsement.');

						// Call optional order hook
						if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

						setTimeout(function () {
							if (cb) return cb(null);
							else return;
						}, 5000);
					}

					// No good
					else {
						logger.error('[fcw] Failed to order the instantiate endorsement.');
						throw response;
					}
				}
				).catch(
				function (err) {
					logger.error('[fcw] Error in instantiate catch block', typeof err, err);
					var formatted = common.format_error_msg(err);

					if (cb) return cb(formatted, null);
					else return;
				}
				);
		});
	};

	//-------------------------------------------------------------------
	// Upgrade Chaincode - Must use Admin Cert enrollment
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					endorsed_hook: function(error, res){},
					ordered_hook: function(error, res){},
					cc_args: ["argument 1"],
					peer_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					}
		}
	*/

	deploy_cc.upgrade_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Upgrading Chaincode', options);
		var channel = obj.channel;
		var client = obj.client;

		// fix GOPATH - does not need to be real!
		process.env.GOPATH = path.join(__dirname, '../');

		// send proposal to endorser
		var request = {
			targets: [client.newPeer(options.peer_urls[0], options.peer_tls_opts)],
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			fcn: 'init',
			args: options.cc_args,
			txId: client.newTransactionID(),
		};
		logger.debug('[fcw] Sending upgrade cc req', request);

		channel.initialize().then(() => {
			channel.sendUpgradeProposal(request
				//nothing
			).then(
				function (results) {

					//check response
					var request = common.check_proposal_res(results, options.endorsed_hook);
					return channel.sendTransaction(request);
				}
				).then(
				function (response) {

					// All good
					if (response.status === 'SUCCESS') {
						logger.debug('[fcw] Successfully ordered upgrade cc endorsement.');

						// Call optional order hook
						if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

						setTimeout(function () {
							if (cb) return cb(null);
							else return;
						}, 5000);
					}

					// No good
					else {
						logger.error('[fcw] Failed to order the upgrade cc endorsement.');
						throw response;
					}
				}
				).catch(
				function (err) {
					logger.error('[fcw] Error in upgrade cc catch block', typeof err, err);
					var formatted = common.format_error_msg(err);

					if (cb) return cb(formatted, null);
					else return;
				}
				);
		});
	};

	return deploy_cc;
};


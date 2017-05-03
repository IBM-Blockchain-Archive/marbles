//-------------------------------------------------------------------
// Deploy Chaincode
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	var Peer = require('fabric-client/lib/Peer.js');
	//var EventHub = require('fabric-client/lib/EventHub.js');
	var utils = require('fabric-client/lib/utils.js');
	var deploy_cc = {};

	//-------------------------------------------------------------------
	// Install Chaincode
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					path_2_chaincode: "path to chaincode from proj root",
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					endorsed_hook: function(error, res){},
					ordered_hook: function(error, res){},
					peer_tls_opts: {
						pem: 'complete tls certificate',					<optional>
						common_name: 'common name used in pem certificate' 	<optional>
					}
		}
	*/
	deploy_cc.install_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Installing Chaincode');
		var chain = obj.chain;

		try {
			for (var i in options.peer_urls) {
				chain.addPeer(new Peer(options.peer_urls[i], {
					pem: options.peer_tls_opts.pem,
					'ssl-target-name-override': options.peer_tls_opts.common_name	//can be null if cert matches hostname
				}));
			}
		}
		catch (e) {
			//might error if peer already exists, but we don't care
		}

		// fix GOPATH - does not need to be real!
		process.env.GOPATH = path.join(__dirname, '../../chaincode');
		var nonce = utils.getNonce();

		// send proposal to endorser
		var request = {
			chaincodePath: options.path_2_chaincode,		//rel path from /server/libs/src/ to chaincode folder ex: './marbles_chaincode'
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			txId: chain.buildTransactionID(nonce, obj.submitter),
			nonce: nonce
		};
		logger.debug('[fcw] Sending install req', request);

		chain.sendInstallProposal(request
			//nothing
		).then(
			function (results) {
				//check response
				common.check_proposal_res(results, options.endorsed_hook);
				if (cb) return cb(null, results);
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in install catch block', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
			);
	};


	//-------------------------------------------------------------------
	// Instantiate Chaincode
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					path_2_chaincode: "path to chaincode from proj root",
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					endorsed_hook: function(error, res){},
					ordered_hook: function(error, res){},
					cc_args: ["argument 1"],
					deploy_wait: 30000,
					peer_tls_opts: {
						pem: 'complete tls certificate',					<optional>
						common_name: 'common name used in pem certificate' 	<optional>
					}
		}
	*/
	deploy_cc.instantiate_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Instantiating Chaincode', options);
		var chain = obj.chain;
		//var eventhub;

		try {
			for (var i in options.peer_urls) {
				chain.addPeer(new Peer(options.peer_urls[i], {
					pem: options.peer_tls_opts.pem,
					'ssl-target-name-override': options.peer_tls_opts.common_name	//can be null if cert matches hostname
				}));
			}
		}
		catch (e) {
			//might error if peer already exists, but we don't care
		}

		//chain.addOrderer(new Orderer(options.orderer_url));

		// fix GOPATH - does not need to be real!
		process.env.GOPATH = path.join(__dirname, '../');
		var nonce = utils.getNonce();

		// send proposal to endorser
		var request = {
			chainId: options.channel_id,
			chaincodePath: options.path_2_chaincode,		//rel path from /server/libs/src/ to chaincode folder ex: './marbles_chaincode'
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			fcn: 'init',
			args: options.cc_args,
			txId: chain.buildTransactionID(nonce, obj.submitter),
			nonce: nonce,
		};
		logger.debug('[fcw] Sending instantiate req', request);

		// Setup EventHub
		//eventhub = new EventHub();
		//eventhub.setPeerAddr(options.event_url);
		//eventhub.connect();

		chain.initialize().then(() => {
			chain.sendInstantiateProposal(request
				//nothing
			).then(
				function (results) {

					//check response
					var request = common.check_proposal_res(results, options.endorsed_hook);
					return chain.sendTransaction(request);
				}
				).then(
				function (response) {

					// All good
					if (response.status === 'SUCCESS') {
						logger.debug('[fcw] Successfully ordered instantiate endorsement.');

						// Call optional order hook
						if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

						/*var watchdog = setTimeout(() => {
							var msg = '[fcw] Failed to receive block event within the timeout period';
							logger.error(msg);
							throw msg;
						}, options.deploy_wait || 60000);

						// Wait for block event
						eventhub.registerTxEvent(request.txId.toString(), (tx, invalid) => {
							logger.debug('---------------------------------------------------------------------------\n');
							logger.info('[fcw] The chaincode instantiate tx block committed successfully\n\n');
							clearTimeout(watchdog);
							//eventhub.unregisterTxEvent(request.txId.toString());		//dsh this seems to end the application...??!

							console.log('! event hub says',  invalid);

							if (cb) return cb(null);
							else return;
						});*/

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

	return deploy_cc;
};


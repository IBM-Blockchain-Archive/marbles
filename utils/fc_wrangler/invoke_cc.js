//-------------------------------------------------------------------
// Invoke Chaincode - edit the ledger
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (g_options, logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	var EventHub = require('fabric-client/lib/EventHub.js');
	var utils = require('fabric-client/lib/utils.js');
	var invoke_cc = {};

	if (!g_options) g_options = {};
	if (!g_options.block_delay) g_options.block_delay = 10000;

	//-------------------------------------------------------------------
	// Create User - options are {username: bob}
	//-------------------------------------------------------------------
	/*
		options: {
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					event_url: "peers event url",			<optional>
					endorsed_hook: function(error, res){},	<optional>
					ordered_hook: function(error, res){},	<optional>
					cc_function: "function_name",
					cc_args: ["argument 1"],
					peer_tls_opts: {
						pem: 'complete tls certificate',					<optional>
						common_name: 'common name used in pem certificate' 	<optional>
					}
		}
	*/
	invoke_cc.invoke_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Invoking Chaincode: ' + options.cc_function + '()');
		var eventhub;
		var chain = obj.chain;
		var nonce = utils.getNonce();
		var cbCalled = false;

		// send proposal to endorser
		var request = {
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			fcn: options.cc_function,
			args: options.cc_args,
			txId: chain.buildTransactionID(nonce, obj.submitter),
			nonce: nonce,
		};
		logger.debug('[fcw] Sending invoke req', request);

		// Setup EventHub
		if (options.event_url) {
			logger.debug('[fcw] listening to event url', options.event_url);
			eventhub = new EventHub();
			eventhub.setPeerAddr(options.event_url, {
				pem: options.peer_tls_opts.pem,
				'ssl-target-name-override': options.peer_tls_opts.common_name		//can be null if cert matches hostname
			});
			eventhub.connect();
		} else {
			logger.debug('[fcw] will not use tx event');
		}

		// Send Proposal
		chain.sendTransactionProposal(request).then(function (results) {

			// Check Response
			var request = common.check_proposal_res(results, options.endorsed_hook);
			return chain.sendTransaction(request);
		}).then(function (response) {

			// All good
			if (response.status === 'SUCCESS') {
				logger.debug('[fcw] Successfully ordered endorsement transaction.');

				// Call optional order hook
				if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

				// ------- [A] Use Event for Tx Confirmation ------- // option A
				if (options.event_url) {
					try {
						// Watchdog for no block event
						var watchdog = setTimeout(() => {
							logger.error('[fcw] Failed to receive block event within the timeout period');

							if (cb && !cbCalled) {
								cbCalled = true;
								return cb(null);						//timeout pass it back
							}
							else return;
						}, g_options.block_delay + 2000);

						// Wait for tx committed event
						eventhub.registerTxEvent(request.txId.toString(), (tx, code) => {
							logger.info('[fcw] The chaincode transaction has been committed, success?:', code);
							clearTimeout(watchdog);

							if (code !== 'VALID') {
								if (cb && !cbCalled) {
									cbCalled = true;
									return cb(common.format_error_msg('Commit code: ' + code));//pass error back
								}
								else return;
							} else {
								if (cb && !cbCalled) {
									cbCalled = true;
									return cb(null);					//all good, pass it back
								}
								else return;
							}
						});
					} catch (e) {
						logger.error('[fcw] Illusive event error: ', e);//not sure why this happens, seems rare 3/27/2017
						if (cb && !cbCalled) {
							cbCalled = true;
							return cb(e);								//all terrible, pass it back
						}
						else return;
					}

					// ------- [B] Wait xxxx ms for Block  ------- // option B
				} else {
					setTimeout(function () {
						if (cb) return cb(null);
						else return;
					}, g_options.block_delay + 2000);
				}
			}

			// ordering failed, No good
			else {
				if (options.ordered_hook) options.ordered_hook('failed');
				logger.error('[fcw] Failed to order the transaction. Error code: ', response);
				throw response;
			}
		}).catch(function (err) {
			logger.error('[fcw] Error in invoke catch block', typeof err, err);

			var formatted = common.format_error_msg(err);
			if (options.ordered_hook) options.ordered_hook('failed', formatted);

			if (cb) return cb(formatted, null);
			else return;
		});
	};
	return invoke_cc;
};

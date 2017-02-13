//-------------------------------------------------------------------
// Invoke Chaincode - edit the ledger
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	var Peer = require('fabric-client/lib/Peer.js');
	var EventHub = require('fabric-client/lib/EventHub.js');
	var utils = require('fabric-client/lib/utils.js');
	var invoke_cc = {};

	//-------------------------------------------------------------------
	// Create User - options are {username: bob}
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					endorsed_hook: function(error, res){},
					ordered_hook: function(error, res){},
					cc_function: "function_name"
					cc_args: ["argument 1"]
		}
	*/
	invoke_cc.invoke_chaincode = function (chain, options, cb) {
		logger.debug('\nInvoking Chaincode: ' + options.cc_function + '()\n');
		var eventhub;

		try {
			for (var i in options.peer_urls) {
				chain.addPeer(new Peer(options.peer_urls[i]));
			}
		}
		catch (e) {
			//might error if peer already exists, but we don't care
		}

		// send proposal to endorser
		var request = {
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			txId: utils.buildTransactionID({ length: 12 }),
			nonce: utils.getNonce(),
			fcn: options.cc_function,
			args: options.cc_args
		};

		// Setup EventHub
		eventhub = new EventHub();
		eventhub.setPeerAddr(options.event_url);
		eventhub.connect();

		// Send Proposal
		chain.sendTransactionProposal(request
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
					logger.debug('[fcw] Successfully ordered endorsement transaction.');

					// Call optional order hook
					if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

					var watchdog = setTimeout(() => {
						var msg = '[fcw] Failed to receive block event within the timeout period';
						logger.error(msg);
						throw msg;
					}, 30000);

					// Wait for block event
					eventhub.registerTxEvent(request.txId.toString(), (tx) => {
						logger.info('[fcw] The chaincode transaction has been successfully committed');
						clearTimeout(watchdog);
						//eventhub.disconnect();								//dsh this seems to crash the application...

						if (cb) return cb(null);
						else return;
					});
				}

				// No good
				else {
					logger.error('[fcw] Failed to order the transaction. Error code: ', response);
					throw response;
				}
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in invoke catch block', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
		);
	};

	return invoke_cc;
};


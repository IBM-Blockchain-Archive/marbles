//-------------------------------------------------------------------
// Query Chaincode - read chaincode state
//-------------------------------------------------------------------

module.exports = function (logger) {
	var utils = require('fabric-client/lib/utils.js');
	var query_cc = {};

	//-------------------------------------------------------------------
	// Get Marble Index List
	//-------------------------------------------------------------------
	/*
		options: {
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					chaincode_version: "v0",
					cc_function: "function_name"
					cc_args: ["argument 1"]
		}
	*/
	query_cc.query_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Querying Chaincode: ' + options.cc_function + '()');
		var chain = obj.chain;
		var nonce = utils.getNonce();

		// send proposal to peer
		var request = {
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			fcn: options.cc_function,
			args: options.cc_args,
			txId: chain.buildTransactionID(nonce, obj.submitter),
			nonce: nonce,
		};
		var debug = {												// this is just for console printing, no NONCE here
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			chaincodeVersion: options.chaincode_version,
			fcn: options.cc_function,
			args: options.cc_args,
			txId: chain.buildTransactionID(nonce, obj.submitter),
		};
		logger.debug('[fcw] Sending query req', debug);

		chain.queryByChaincode(request
			//nothing
		).then(
			function (response_payloads) {
				var formatted = format_query_resp(response_payloads);

				// --- response looks bad -- //
				if (formatted.parsed == null) {
					logger.debug('[fcw] Query response is empty', formatted.raw);
				}

				// --- response looks good --- //
				else {
					logger.debug('[fcw] Successful query transaction.'); //, formatted.parsed);
				}
				if (cb) return cb(null, formatted);
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in query catch block', typeof err, err);

				if (cb) return cb(err, null);
				else return;
			}
			);
	};

	//-----------------------------------------------------------------
	// Format Query Responses
	//------------------------------------------------------------------
	function format_query_resp(peer_responses) {
		var ret = {
			parsed: null,
			peers_agree: true,
			raw_peer_payloads: [],
		};
		var last = null;

		// -- iter on each peer's response -- //
		for (var i in peer_responses) {
			var as_string = peer_responses[i].toString('utf8');
			var as_obj = {};

			//logger.debug('[fcw] Peer ' + i, 'payload as str:', as_string, 'len', as_string.length);
			logger.debug('[fcw] Peer ' + i, 'len', as_string.length);
			ret.raw_peer_payloads.push(as_string);

			// -- compare peer responses -- //
			if (last != null) {								//check if all peers agree
				if (last !== as_string) {
					logger.warn('[fcw] warning - some peers do not agree on query', last, as_string);
					ret.peers_agree = false;
				}
				last = as_string;
			}

			try {
				if (as_string === '') {							//if its empty, thats okay... well its not great 
					as_obj = '';
				} else {
					as_obj = JSON.parse(as_string);				//if we can parse it, its great
				}
				logger.debug('[fcw] Peer ' + i, 'type', typeof as_obj);
				if (ret.parsed === null) ret.parsed = as_obj;	//store the first one here
			}
			catch (e) {
				if (as_string.indexOf('Error: failed to obtain') >= 0) {
					logger.error('[fcw] query resp looks like an error', typeof as_string, as_string);
					ret.parsed = null;
				} else {
					logger.warn('[fcw] warning - query resp is not json, might be okay.', typeof as_string, as_string);
					ret.parsed = as_string;
				}
			}
		}
		return ret;
	}

	return query_cc;
};


//-------------------------------------------------------------------
// Query Chaincode
//-------------------------------------------------------------------

module.exports = function (logger) {
	var query_cc = {};

	//-------------------------------------------------------------------
	// Query Chaincode - aka read the blockchain ledger
	//-------------------------------------------------------------------
	/*
		options: {
					chaincode_id: "chaincode id",
					cc_function: "function_name"
					cc_args: ["argument 1"],
		}
	*/
	query_cc.query_chaincode = function (obj, options, cb) {
		logger.debug('[fcw] Querying Chaincode: ' + options.cc_function + '()');
		var channel = obj.channel;

		// send proposal to peer
		var request = {
			chaincodeId: options.chaincode_id,
			fcn: options.cc_function,
			args: options.cc_args,
			txId: null,												//apparently this is null for queries now
		};
		logger.debug('[fcw] Sending query req:', request);

		channel.queryByChaincode(request).then(function (response_payloads) {
			var formatted = format_query_resp(response_payloads);

			// --- response looks bad -- //
			if (formatted.parsed == null) {
				logger.debug('[fcw] Query parsed response is empty:', formatted.raw);
			}
			if (formatted.error) {
				logger.debug('[fcw] Query response is an error:', formatted.raw);
			}

			// --- response looks good --- //
			else {
				logger.debug('[fcw] Successful query transaction.');
			}
			if (cb) return cb(formatted.error, formatted);
		}).catch(function (err) {
			logger.error('[fcw] Error in query catch block', typeof err, err);

			if (cb) return cb(err, null);
			else return;
		});
	};

	//-----------------------------------------------------------------
	// Format Query Responses
	//------------------------------------------------------------------
	function format_query_resp(peer_responses) {
		var ret = {
			parsed: null,
			peers_agree: true,
			peer_payloads: [],
			error: null
		};
		var last = null;

		// -- iter on each peer's response -- //
		for (var i in peer_responses) {
			var as_string = peer_responses[i].toString('utf8');
			var as_obj = {};
			ret.peer_payloads.push(as_string);

			// -- compare peer responses -- //
			if (last != null) {									//check if all peers agree
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
				logger.debug('[fcw] Peer Query Response - len:', as_string.length, 'type:', typeof as_obj);
				if (ret.parsed === null) ret.parsed = as_obj;	//store the first one here
			}
			catch (e) {
				if (known_sdk_errors(as_string)) {
					logger.error('[fcw] query resp looks like an error:', typeof as_string, as_string);
					ret.parsed = null;
					ret.error = as_string;
				} else {
					logger.warn('[fcw] warning - query resp is not json, might be okay:', typeof as_string, as_string);
					ret.parsed = as_string;
				}
			}
		}
		return ret;
	}

	//test if this is a sdk thrown error (we want to handle chaincode thrown errors differently)
	function known_sdk_errors(str) {
		const known_errors = ['Error: failed to obtain', 'Error: Connect Failed'];		//list of known sdk errors from a query
		for (let i in known_errors) {
			if (str && str.indexOf(known_errors[i]) >= 0) {
				return true;
			}
		}
		return false;
	}

	return query_cc;
};


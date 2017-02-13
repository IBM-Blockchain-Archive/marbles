//-------------------------------------------------------------------
// Query Chaincode - read the ledger
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	var Peer = require('fabric-client/lib/Peer.js');
	var utils = require('fabric-client/lib/utils.js');
	var query_cc = {};

	//-------------------------------------------------------------------
	// Get Marble Index List
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					cc_function: "function_name"
					cc_args: ["argument 1"]
		}
	*/
	query_cc.query_chaincode = function (chain, options, cb) {
		logger.debug('Querying Chaincode: ' + options.cc_function + '()\n');

		try{
			for (var i in options.peer_urls) {
				chain.addPeer(new Peer(options.peer_urls[i]));
			}
		}
		catch(e){
			//might error if peer already exists, but we don't care
		}

		// send proposal to peer
		var request = {
			targets: common.fmt_peers(options.peer_urls),
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			txId: utils.buildTransactionID(),
			nonce: utils.getNonce(),
			fcn: options.cc_function,
			args: options.cc_args
		};

		chain.queryByChaincode(request
			//nothing
		).then(
			function(response_payloads) {
				var formatted = format_query_resp(response_payloads);

				// --- response looks bad -- //
				if (formatted.parsed == null) {
					logger.debug('[fcw] Query response is empty', formatted.raw);
				}

				// --- response looks good --- //
				else {
					logger.debug('[fcw] Successful query transaction.', formatted.parsed);
				}
				if (cb) return cb(null, formatted);
			}
		).catch(
			function(err) {
				logger.error('[fcw] Error in query catch block', typeof err, err);

				if (cb) return cb(err, null);
				else return;
			}
		);
	};

	//-----------------------------------------------------------------
	// Format Query Responses
	//------------------------------------------------------------------
	function format_query_resp (peer_responses) {
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

			logger.debug('[fcw] Peer ' + i, 'payload as str:', as_string, 'len', as_string.length);
			ret.raw_peer_payloads.push(as_string);

			// -- compare peer responses -- //
			if (last != null) {								//check if all peers agree
				if (last !== as_string) {
					logger.warn('\n[fcw] warning - some peers do not agree on query', last, as_string);
					ret.peers_agree = false;
				}
				last = as_string;
			}

			try {
				if (as_string === '') {
					as_obj = '';
				}
				else {
					as_obj = JSON.parse(as_string);
				}
				logger.debug('[fcw] Peer ' + i, 'payload as self:', as_obj, 'type', typeof as_obj);
				if (ret.parsed === null) ret.parsed = as_obj;	//store the first one here
			}
			catch (e) {
				logger.warn('[fcw] warning - could not json parse query response');
			}
		}
		return ret;
	}

	return query_cc;
};


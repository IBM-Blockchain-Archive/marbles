//-------------------------------------------------------------------
// Query Peer - read the ledger / channel
//-------------------------------------------------------------------
var path = require('path');
const _ = require('lodash');

module.exports = function (logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	var Peer = require('fabric-client/lib/Peer.js');
	var query_peer = {};

	//-------------------------------------------------------------------
	// Get Block
	//-------------------------------------------------------------------
	/*
		options: {
					block_id: integer - block number
		}
	*/
	query_peer.query_block = function (obj, options, cb) {
		logger.debug('[fcw] Querying Block: ' + options.block_id);
		var chain = obj.chain;

		// send proposal to peer
		chain.queryBlock(Number(options.block_id)).then(
			function (block_resp) {
				if (cb) return cb(null, format_block(block_resp));
			}
		).catch(
			function (err) {
				logger.error('[fcw] Error in query block', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
			);
	};

	//-------------------------------------------------------------------
	// Get Channel Stats
	//-------------------------------------------------------------------
	/*
		options: {}
	*/
	query_peer.query_channel = function (obj, options, cb) {
		logger.debug('[fcw] Querying Channel Stats:');
		var chain = obj.chain;

		// send proposal to peer
		chain.queryInfo().then(
			function (chain_resp) {
				chain_resp.currentBlockHash = buffer2hexstr(chain_resp.currentBlockHash.buffer);
				chain_resp.previousBlockHash = buffer2hexstr(chain_resp.previousBlockHash.buffer);
				if (cb) return cb(null, chain_resp);
			}
		).catch(
			function (err) {
				logger.error('[fcw] Error in query block', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
			);
	};

	//-------------------------------------------------------------------
	// Get Channel Members
	//-------------------------------------------------------------------
	/*
		options: {}
	*/
	query_peer.query_channel_members = function (obj, options, cb) {
		console.log('');
		logger.debug('[fcw] Querying Channel Members:');
		var chain = obj.chain;

		chain.initialize().then(() => {
			let orgs = chain.getOrganizationUnits();
			if (cb) return cb(null, orgs);
		});
	};

	//-------------------------------------------------------------------
	// Get List of Channels on Peer
	//-------------------------------------------------------------------
	/*
		'chain' shoudn't be the object we interface with to get the list of
		channels... but that's the way the SDK operates now

		options: {
			peer_urls: ['array of peer grpc urls'],
			peer_tls_opts: {
				pem: 'complete tls certificate',					<optional>
				common_name: 'common name used in pem certificate' 	<optional>
			}
		}
	*/
	query_peer.query_list_channels = function (obj, options, cb) {
		console.log('');
		logger.debug('List Channels:', options);
		var chain = obj.chain;

		// send proposal to peer
		chain.queryChannels(new Peer(options.peer_urls[0], {
			pem: options.peer_tls_opts.pem,
			'ssl-target-name-override': options.peer_tls_opts.common_name		//can be null if cert matches hostname
		})).then(
			function (chain_resp) {
				chain_resp.channels = _.sortBy(chain_resp.channels, [channel => channel.channel_id]);
				if (cb) return cb(null, chain_resp);
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in query block', typeof err, err);

				if (cb) return cb(err, null);
				else return;
			}
			);
		//return cb(null, options);
	};

	//format from byte array to hex string
	function buffer2hexstr(byteArray) {
		return byteArray.map(function (byte) {
			return ('0' + byte.toString(16)).slice(-2);
		}).join('');
	}

	// Format the Block
	// I don't have the slightest idea if this will hold up, seems ok for marbles =/ 
	function format_block(data) {
		var ret = {
			parsed: {
				block_id: data.header.number.low,
				data_count: data.data.data.length,
				metadata_count: data.metadata.metadata.length,
				txs: []
			},
			orig_data: data
		};

		// -- remove thigns I can't seem to see -- //
		try {
			var temp = '';
			var msg = 'there was something here but its been removed';
			ret.orig_data.header.previous_hash = msg;
			ret.orig_data.header.data_hash = msg;

			// -- move though the block data! -- //
			for (var i in ret.orig_data.data.data) {
				try {
					ret.orig_data.data.data[i].payload.header.signature_header.nonce = msg;
					ret.orig_data.data.data[0].signature = msg;

					temp = {
						channel_id: ret.orig_data.data.data[i].payload.header.channel_header.channel_id,
						timestamp: ret.orig_data.data.data[i].payload.header.channel_header.timestamp.seconds.low,
						tx_id: ret.orig_data.data.data[i].payload.header.channel_header.tx_id,
						chaincode_id: ret.orig_data.data.data[i].payload.header.channel_header.extension.substr(4),
					};
				}
				catch (e) {
					logger.warn('error in removing buffers - this does not matter', e);
				}

				// -- parse for parameters -- //
				temp.params = stupid_parse(ret.orig_data.data.data[i].payload.data, temp.chaincode_id);
				ret.parsed.txs.push(temp);
			}

			// -- remove thigns I can't seem to see -- //
			for (i in ret.orig_data.metadata.metadata) {
				ret.orig_data.metadata.metadata[i] = msg;
			}
		}
		catch (e) {
			logger.warn('error in parsing data - this may matter', e);
		}

		// -- DONE -- //
		logger.debug('parsed data:', ret.parsed);
		return ret;
	}

	// retardely parse the block object to format for humans
	function stupid_parse(str, chaincodeId) {
		var ret = { debug: {}, parameters: [] };

		// get chaincode id
		ret.debug.startPos = str.indexOf(chaincodeId);						//dumb detection
		ret.debug.str = str.substr(ret.debug.startPos + chaincodeId.length);
		ret.debug.stopPos = ret.debug.str.indexOf('\u0012');				//this is likely to break
		ret.debug.finalStr = ret.debug.str.substr(0, ret.debug.stopPos);

		var word = '';
		for (var i in ret.debug.finalStr) {									//filter out giberish
			if (ret.debug.finalStr.charCodeAt(i) >= 32 && ret.debug.finalStr.charCodeAt(i) <= 126) {
				word += ret.debug.finalStr[i];
			}
			else {
				if (word.length > 0) {
					ret.parameters.push(word);
				}
				word = '';
			}
		}
		if (word.length > 0) {
			ret.parameters.push(word);
		}
		return ret;
	}


	//-------------------------------------------------------------------
	// Get Installed Chaincodes
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					peer_tls_opts: {
						pem: 'complete tls certificate',					<optional>
						common_name: 'common name used in pem certificate' 	<optional>
					}
		}
	*/
	query_peer.query_installed_cc = function (obj, options, cb) {
		logger.debug('[fcw] Querying Installed Chaincodes\n');
		var chain = obj.chain;


		// send proposal to peer
		chain.queryInstalledChaincodes(new Peer(options.peer_urls[0], {
			pem: options.peer_tls_opts.pem,
			'ssl-target-name-override': options.peer_tls_opts.common_name		//can be null if cert matches hostname
		})).then(
			function (resp) {
				if (cb) return cb(null, resp);
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in query installed chaincode', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
			);
	};


	//-------------------------------------------------------------------
	// Get Instantiated Chaincodes
	//-------------------------------------------------------------------
	/*
		options: {}
	*/
	query_peer.query_instantiated_cc = function (obj, options, cb) {
		logger.debug('[fcw] Querying Instantiated Chaincodes:\n');
		var chain = obj.chain;

		// send proposal to peer
		chain.queryInstantiatedChaincodes().then(
			function (resp) {
				if (cb) return cb(null, resp);
			}
		).catch(
			function (err) {
				logger.error('[fcw] Error in query instantiated chaincodes', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
			);
	};

	return query_peer;
};


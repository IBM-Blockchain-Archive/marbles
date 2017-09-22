//-------------------------------------------------------------------
// Common/Helper Library for Fabric Client Wrangler
//-------------------------------------------------------------------
var fs = require('fs');
var path = require('path');

module.exports = function (logger) {
	var common = {};


	//------------------------------------------------------------------
	// Format Chaincode String Error Message
	//------------------------------------------------------------------
	common.format_error_msg = function (error_message) {
		var temp = {
			parsed: 'could not format error',
			raw: error_message
		};
		try {
			if (typeof error_message === 'object') {
				temp.parsed = error_message[0].toString();
			} else {
				temp.parsed = error_message.toString();
			}
			let pos = temp.parsed.lastIndexOf('::');
			if (pos === -1) pos = temp.parsed.lastIndexOf(':');
			if (pos >= 0) temp.parsed = temp.parsed.substring(pos + 2);
		}
		catch (e) {
			logger.error('[fcw] could not format error');
		}
		temp.parsed = 'Blockchain network error - ' + temp.parsed;
		return temp;
	};

	//-----------------------------------------------------------------
	// Create array - takes in array of strings poops out array of objects
	//-----------------------------------------------------------------
	common.fmt_peers = function (urls) {
		var ret = [];

		for (var i in urls) {
			ret.push({ peer_url: urls[i] });		//dumb needs to be an obj
		}

		if (ret.length === 0) {						//while we are here, lets see if its decent
			var err_msg = 'could not create peer array object from peer urls';
			logger.error('[fcw] Error', err_msg, urls);
			throw err_msg;
		}
		return ret;
	};

	//-----------------------------------------------------------------
	// Check Proposal Response
	//-----------------------------------------------------------------
	common.check_proposal_res = function (results, endorsed_hook) {
		var proposalResponses = results[0];
		var proposal = results[1];
		var header = results[2];

		//check response
		if (!proposalResponses || !proposalResponses[0] || !proposalResponses[0].response || proposalResponses[0].response.status !== 200) {
			if (endorsed_hook) endorsed_hook('failed');
			logger.error('[fcw] Failed to obtain endorsement for transaction.', proposalResponses);
			throw proposalResponses;
		}
		else {
			logger.debug('[fcw] Successfully obtained transaction endorsement');

			//call optional endorsement hook
			if (endorsed_hook) endorsed_hook(null, proposalResponses[0].response);

			//move on to ordering
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal,
				header: header
			};
			return request;
		}
	};

	//------------------------------------------------------------
	// decode base64 into string
	//------------------------------------------------------------
	common.decodeb64 = function (b64string) {
		if (!b64string) throw Error('cannot decode something that isn\'t there');
		return (Buffer.from(b64string, 'base64')).toString();
	};


	//------------------------------------------------------------
	// Delete a folder - synchronous
	//------------------------------------------------------------
	common.rmdir = function (dir_path) {
		if (fs.existsSync(dir_path)) {
			fs.readdirSync(dir_path).forEach(function (entry) {
				var entry_path = path.join(dir_path, entry);
				if (fs.lstatSync(entry_path).isDirectory()) {
					common.rmdir(entry_path);
				}
				else {
					fs.unlinkSync(entry_path);
				}
			});
			fs.rmdirSync(dir_path);
		}
	};

	return common;
};

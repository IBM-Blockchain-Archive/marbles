// ============================================================================================================================
// 													Get *** fields from connection profile data
// ============================================================================================================================
var path = require('path');
var os = require('os');

module.exports = function (cp, logger) {
	var helper = {};

	// ----------------------------------------------------------
	// get the chaincode id on network
	// ----------------------------------------------------------
	helper.getBlockDelay = function () {
		let ret = 1000;
		var channel = cp.getChannelId();
		if (cp.creds.channels && cp.creds.channels[channel] && cp.creds.channels[channel]['x-blockDelay']) {
			if (!isNaN(cp.creds.channels[channel]['x-blockDelay'])) {
				ret = cp.creds.channels[channel]['x-blockDelay'];
			}
		}
		return ret;
	};

	// ----------------------------------------------------------
	// get key value store location
	// ----------------------------------------------------------
	helper.getKvsPath = function (opts) {
		const id = cp.makeUniqueId();
		const default_path = path.join(os.homedir(), '.hfc-key-store/', id);

		if (opts && opts.going2delete) {							//if this is for a delete, return default so we don't wipe a kvs someone setup
			return default_path;									//do the default one
		}

		// -- Using Custom KVS -- //
		if (cp.creds.client && cp.creds.client.credentialStore) {
			const kvs_path = cp.creds.client.credentialStore.path;
			let ret = path.join(__dirname, '../../../config/' + kvs_path + '/');
			if (kvs_path.indexOf('/') === 0) {
				ret = kvs_path;										//its an absolute path
			}
			if (ret.indexOf('$HOME') >= 0) {
				ret = ret.replace('$HOME', os.homedir()).substr(1);
			}
			return ret;												//use the kvs provided in the json
		} else {
			return default_path;									//make a new kvs folder in the home dir
		}
	};

	return helper;
};

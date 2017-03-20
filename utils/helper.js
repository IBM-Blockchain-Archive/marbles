var fs = require('fs');
var url = require('url');
var path = require('path');
var crypto = require('crypto');

module.exports = function (config_filename, logger) {
	var helper = {};
	var config_path = path.join(__dirname, '../config/' + config_filename);
	helper.config = require(config_path);
	var creds_path = path.join(__dirname, '../config/' + helper.config.cred_filename);
	helper.creds = require(creds_path);

	logger.info('Loaded config file', config_path);
	logger.info('Loaded creds file', creds_path);

	// hash of credential json file
	helper.getHash = function () {
		var shasum = crypto.createHash('sha1');
		shasum.update(JSON.stringify(helper.creds));
		return shasum.digest('hex').toString();
	};

	// get network id
	helper.getNetworkId = function () {
		return helper.creds.credentials.network_id;
	};

	// get a peer's grpc url
	helper.getPeersUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peer index not passed');
		}
		else {
			if (index < helper.creds.credentials.peers.length) {
				return helper.creds.credentials.peers[index].discovery;
			}
			else {
				throw new Error('Peer index out of bounds. Total peers = ' + helper.creds.credentials.peers.length);
			}
		}
	};

	// get a peer's msp id
	helper.getPeersMspId = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peer index not passed');
		}
		else {
			if (index < helper.creds.credentials.peers.length) {
				return helper.creds.credentials.peers[index].msp_id;
			}
			else {
				throw new Error('Peer index out of bounds. Total peers = ' + helper.creds.credentials.peers.length);
			}
		}
	};

	// get a ca's http url
	helper.getCasUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('CA index not passed');
		} else {
			if (index < helper.creds.credentials.cas.length) {
				return helper.creds.credentials.cas[index].api;
			} else {
				throw new Error('CA index out of bounds. Total CA = ' + helper.creds.credentials.cas.length);
			}
		}
	};

	// get a ca obj
	helper.getCA = function (index) {
		if (index === undefined || index == null) {
			throw new Error('CA index not passed');
		} else {
			if (index < helper.creds.credentials.cas.length) {
				return helper.creds.credentials.cas[index];
			} else {
				throw new Error('CA index out of bounds. Total CA = ' + helper.creds.credentials.cas.length);
			}
		}
	};

	// get an orderer's grpc url
	helper.getOrderersUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Orderers index not passed');
		} else {
			if (index < helper.creds.credentials.orderers.length) {
				return helper.creds.credentials.orderers[index].discovery;
			} else {
				throw new Error('Orderers index out of bounds. Total CA = ' + helper.creds.credentials.orderers.length);
			}
		}
	};

	// get an enrollment user
	helper.getUser = function (index) {
		if (index === undefined || index == null) {
			return helper.creds.credentials.users;
		}
		else {
			var ca = helper.getCA(0);
			if (ca && index < ca.users.length) {
				return ca.users[index];
			}
			else {
				throw new Error('Users index out of bounds. Total CA = ' + helper.creds.credentials.users.length);
			}
		}
	};

	// get a peer's grpc event url
	helper.getPeerEventUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peers index not passed');
		} else {
			if (index < helper.creds.credentials.peers.length) {
				return helper.creds.credentials.peers[index].events;
			}
			logger.warn('no events url found in creds');
			return null;
		}
	};

	// get the chaincode id on network
	helper.getChaincodeId = function () {
		return getBlockchainField('chaincode_id');
	};

	// get the channel id on network
	helper.getChannelId = function () {
		return getBlockchainField('channel_id');
	};

	// get the chaincode version on network
	helper.getChaincodeVersion = function () {
		return getBlockchainField('chaincode_version');
	};

	// get the marble owner names
	helper.getMarbleUsernames = function () {
		return getMarblesField('usernames');
	};

	// get the marbles trading company name
	helper.getCompanyName = function () {
		return getMarblesField('company');
	};

	// get the marble's server port number
	helper.getMarblesPort = function () {
		return getMarblesField('port');
	};

	// get the status of marbles previous startup
	helper.getMarbleStartUpHash = function () {
		return getMarblesField('last_startup_hash');
	};

	// get the status of marbles previous startup
	helper.getEventsSetting = function () {
		return getMarblesField('use_events');
	};

	// safely retrieve marbles fields
	function getMarblesField(marbles_field) {
		try {
			if (helper.config[marbles_field]) {
				return helper.config[marbles_field];
			}
			else {
				console.log('Error - "' + marbles_field + '" not found in config json');
				return null;
			}
		}
		catch (e) {
			console.log('Error - "' + marbles_field + '" not found in config json');
			return null;
		}
	}

	// safely retreive blockchain app fields
	function getBlockchainField(field) {
		try {
			if (helper.creds.credentials.app[field]) {
				return helper.creds.credentials.app[field];
			}
			else {
				console.log('Error - "' + field + '" not found in config json');
				return null;
			}
		}
		catch (e) {
			console.log('Error - "' + field + '" not found in config json');
			return null;
		}
	}

	// write new settings
	helper.write = function (obj) {
		var config_file = JSON.parse(fs.readFileSync(config_path, 'utf8'));
		var creds_file = JSON.parse(fs.readFileSync(creds_path, 'utf8'));
		var parsed = '';

		if (obj.ordererUrl) {
			parsed = url.parse(obj.ordererUrl, true);
			creds_file.credentials.orderers[0].host = parsed.hostname;
			creds_file.credentials.orderers[0].port = Number(parsed.port);
		}
		if (obj.peerUrl) {
			parsed = url.parse(obj.peerUrl, true);
			creds_file.credentials.peers[0].grpc_host = parsed.hostname;
			creds_file.credentials.peers[0].grpc_port = Number(parsed.port);
		}
		if (obj.caUrl) {
			parsed = url.parse(obj.caUrl, true);
			creds_file.credentials.cas[0].host = parsed.hostname;
			creds_file.credentials.cas[0].port = Number(parsed.port);
		}
		if (obj.chaincodeId) {
			creds_file.credentials.app.chaincode_id = obj.chaincodeId;
		}
		if (obj.chaincodeVersion) {
			creds_file.credentials.app.chaincode_version = obj.chaincodeVersion;
		}
		if (obj.channelId) {
			creds_file.credentials.app.channel_id = obj.channelId;
		}
		if (obj.enrollId && obj.enrollSecret) {
			creds_file.credentials.users[0] = {
				enrollId: obj.enrollId,
				enrollSecret: obj.enrollSecret
			};
		}

		if (obj.hash) {
			config_file.last_startup_hash = obj.hash;
		}

		fs.writeFileSync(creds_path, JSON.stringify(creds_file, null, 4), 'utf8');	//save to file
		helper.creds = creds_file;													//replace old copy
		fs.writeFileSync(config_path, JSON.stringify(config_file, null, 4), 'utf8');//save to file
		helper.config = config_file;												//replace old copy
	};

	return helper;
};

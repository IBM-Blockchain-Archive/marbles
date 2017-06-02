var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

module.exports = function (config_filename, logger) {
	var helper = {};

	// default config file name
	if (!config_filename) {
		config_filename = 'marbles1.json';
	}

	var config_path = path.join(__dirname, '../config/' + config_filename);
	helper.config = require(config_path);
	var creds_path = path.join(__dirname, '../config/' + helper.config.cred_filename);
	helper.creds = require(creds_path);
	var packagejson = require(path.join(__dirname, '../package.json'));

	logger.info('Loaded config file', config_path);
	logger.info('Loaded creds file', creds_path);

	// hash of credential json file
	helper.getHash = function () {
		var creds_file = JSON.parse(fs.readFileSync(creds_path, 'utf8'));
		var shasum = crypto.createHash('sha1');
		shasum.update(JSON.stringify(creds_file));
		return shasum.digest('hex').toString();
	};

	// get network id
	helper.getNetworkId = function () {
		return helper.creds.credentials.network_id;
	};

	// get cred file name
	helper.getNetworkCredFileName = function () {
		return helper.config.cred_filename;
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

	// get a peer's name
	helper.getPeersName = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peer index not passed');
		}
		else {
			if (index < helper.creds.credentials.peers.length) {
				return helper.creds.credentials.peers[index].name;
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

	// get a CA's tls options
	helper.getCATLScert = function (index) {
		if (index === undefined || index == null) {
			throw new Error('CAs index not passed');
		} else {
			return getTLScertObj('cas', index);
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

	// get a orderer's tls options
	helper.getOrdererTLScert = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Orderers index not passed');
		} else {
			return getTLScertObj('orderers', index);
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
			logger.warn('no events url found for peer in creds json: ' + creds_path);
			return null;
		}
	};

	// get a peer's tls options
	helper.getPeerTLScertOpts = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peers index not passed');
		} else {
			return getTLScertObj('peers', index);
		}
	};

	// get a node's tls pem obj
	function getTLScertObj(node, index) {
		if (index < helper.creds.credentials[node].length) {
			var obj = pickCertObj(helper.creds.credentials[node][index].tls_certificate);
			if (obj) {
				return {
					common_name: obj.common_name,
					pem: loadCert(obj.pem)
				};
			}
		}
		logger.warn('no tls cert found for ' + node + ' in creds json: ' + creds_path);
		return  {
			common_name: null,
			pem: null
		};
	}

	// pick which tls cert obj to load
	function pickCertObj(cert_name) {
		if (cert_name && helper.creds.credentials.tls_certificates && helper.creds.credentials.tls_certificates[cert_name]) {
			return helper.creds.credentials.tls_certificates[cert_name];
		}
		logger.warn('no tls cert or path found in creds json: ' + creds_path);
		return null;
	}

	// load cert from file path OR just pass cert back
	function loadCert(value) {
		if (value.indexOf('-BEGIN CERTIFICATE-') === -1) {				// looks like cert field is a path to a file
			var path2cert = path.join(__dirname, '../config/' + value);
			return fs.readFileSync(path2cert, 'utf8') + '\r\n'; 		//read from file, LOOKING IN config FOLDER
		} else {
			return value;												//can be null if network is not using TLS
		}
	}

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

	// get the chaincode id on network
	helper.getBlockDelay = function () {
		var ret = getBlockchainField('block_delay');
		if (!ret || isNaN(ret)) ret = 10000;
		return ret;
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
		if (helper.config['use_events']) {
			return helper.config['use_events'];
		}
		return false;
	};

	// get the re-enrollment period in seconds
	helper.getKeepAliveMs = function () {
		var sec = getMarblesField('keep_alive_secs');
		if (!sec) sec = 30;									//default to 30 seconds
		return (sec * 1000);
	};

	// build the marbles lib module options
	helper.makeMarblesLibOptions = function () {
		return {
			block_delay: helper.getBlockDelay(),
			channel_id: helper.getChannelId(),
			chaincode_id: helper.getChaincodeId(),
			event_url: (helper.getEventsSetting()) ? helper.getPeerEventUrl(0) : null,
			chaincode_version: helper.getChaincodeVersion(),
			ca_tls_opts: helper.getCATLScert(0),
			orderer_tls_opts: helper.getOrdererTLScert(0),
			peer_tls_opts: helper.getPeerTLScertOpts(0),
		};
	};

	// build the enrollment options
	helper.makeEnrollmentOptions = function (userIndex) {
		if (userIndex === undefined || userIndex == null) {
			throw new Error('User index not passed');
		} else {
			var user = helper.getUser(userIndex);
			return {
				channel_id: helper.getChannelId(),
				uuid: 'marbles-' + helper.getNetworkId() + '-' + helper.getChannelId() + '-' + helper.getPeersName(0),
				ca_url: helper.getCasUrl(0),
				orderer_url: helper.getOrderersUrl(0),
				peer_urls: [helper.getPeersUrl(0)],
				enroll_id: user.enrollId,
				enroll_secret: user.enrollSecret,
				msp_id: helper.getPeersMspId(0),
				ca_tls_opts: helper.getCATLScert(0),
				orderer_tls_opts: helper.getOrdererTLScert(0),
				peer_tls_opts: helper.getPeerTLScertOpts(0),
			};
		}
	};

	// safely retrieve marbles fields
	function getMarblesField(marbles_field) {
		try {
			if (helper.config[marbles_field]) {
				return helper.config[marbles_field];
			}
			else {
				logger.warn('"' + marbles_field + '" not found in config json: ' + config_path);
				return null;
			}
		}
		catch (e) {
			logger.warn('"' + marbles_field + '" not found in config json: ' + config_path);
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
				logger.warn('"' + field + '" not found in creds json: ' + creds_path);
				return null;
			}
		}
		catch (e) {
			logger.warn('"' + field + '" not found in creds json: ' + creds_path);
			return null;
		}
	}

	// write new settings
	helper.write = function (obj) {
		var config_file = JSON.parse(fs.readFileSync(config_path, 'utf8'));
		var creds_file = JSON.parse(fs.readFileSync(creds_path, 'utf8'));

		if (obj.ordererUrl) {
			creds_file.credentials.orderers[0].discovery = obj.ordererUrl;
		}
		if (obj.peerUrl) {
			creds_file.credentials.peers[0].discovery = obj.peerUrl;
		}
		if (obj.caUrl) {
			creds_file.credentials.cas[0].api = obj.caUrl;
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



	// check if user has changed the settings from the default ones
	helper.checkConfig = function () {
		if (helper.getNetworkId() === 'FakeNetworkId') {
			console.log('\n\n');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('----------------------------- Hey Buddy! -----------------------------');
			logger.warn('------------------------ It looks like you did -----------------------');
			logger.error('------------------------------- not  --------------------------------');
			logger.warn('------------------------- follow my instructions ---------------------');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('Your network config JSON has a network ID of "FakeNetworkID"...');
			logger.warn('You likely have other settings that are wrong too!');
			logger.warn('----------------------------------------------------------------------');
			logger.error('Fix this file: ' + helper.getNetworkCredFileName());
			logger.warn('It must have credentials/hostnames/ports/channels/etc for YOUR network');
			logger.warn('How/where would I get that info? Using the Bluemix service? Then look at these instructions(near the end): ');
			logger.warn('  https://github.com/IBM-Blockchain/marbles/blob/v3.0/docs/install_chaincode.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
		}
	};

	// check if marbles UI and marbles chaincode work together
	helper.errorWithVersions = function (v) {
		var version = packagejson.version;
		if (!v || !v.parsed) v = { parsed: '3.x.x' };		//default
		if (v.parsed[0] !== version[0]) {					//only check the major version
			console.log('\n\n');
			logger.warn('---------------------------------------------------------------');
			logger.warn('----------------------------- Ah! -----------------------------');
			logger.warn('---------------------------------------------------------------');
			logger.error('Looks like you are using an old version of marbles chaincode: v' + v.parsed);
			logger.warn('This UI is expecting chaincode version: v' + version[0] + '.x.x');
			logger.warn('Install and instantiate v' + version[0] + '.x.x' + ' chaincode on channel ' + helper.getChannelId());
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return true;
		}
		return false;
	};

	return helper;
};

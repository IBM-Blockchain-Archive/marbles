// ============================================================================================================================
// 													Helper.js
// This file is to help safely parse the config JSON files found in the "../config/" folder
// ============================================================================================================================
var fs = require('fs');
var path = require('path');
var os = require('os');

module.exports = function (config_filename, logger) {
	var helper = {};
	var package_json = require(path.join(__dirname, '../package.json'));		// get release version of marbles from package.json
	var misc = require(path.join(__dirname, './misc.js'))(logger);

	let cloudy = misc.getConnectionProfileFromEnv();
	if (cloudy) {																// if we are in bluemix, use vcap
		helper.config_path = 'there-is-no-file-using-a-cloud';
		helper.creds_path = 'there-is-no-file-using-a-cloud';
		helper.config = {
			'cred_filename': 'there-is-no-file-using-a-cloud',
			'use_events': true,
			'keep_alive_secs': 120,
			'company': 'United Marbles',
			'usernames': [
				'amy',
				'alice',
				'ava'
			],
			'port': 3001
		};
		helper.creds = cloudy;
		logger.info('Loaded creds from a IBM Cloud binding');
	} else {
		if (!config_filename) {
			config_filename = 'marbles_tls.json';												// default config file name
		}
		helper.config_path = path.join(__dirname, '../config/' + config_filename);
		helper.config = require(helper.config_path);											// load the config file
		helper.creds_path = path.join(__dirname, '../config/' + helper.config.cred_filename);
		helper.creds = require(helper.creds_path);												// load the credential file

		logger.info('Loaded config file', helper.config_path);									// path to config file
		logger.info('Loaded creds file', helper.creds_path);									// path to the blockchain credentials file
	}

	// get network id
	helper.getNetworkName = function () {
		return helper.creds.name;
	};

	// get cred file name
	helper.getNetworkCredFileName = function () {
		return helper.config.cred_filename;
	};


	// --------------------------------------------------------------------------------
	// Peer Getters
	// --------------------------------------------------------------------------------
	// find the first ca in the peers field for this org
	helper.getFirstPeerName = function (ch) {
		const channel = helper.creds.channels[ch];
		if (channel && channel.peers) {
			const peers = Object.keys(channel.peers);
			if (peers && peers[0]) {
				return peers[0];
			}
		}
		throw new Error('Orderer not found for this channel', ch);
	};

	// get a peer object
	helper.getPeer = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer key not passed');
		}
		else {
			if (helper.creds.peers) {
				return helper.creds.peers[key];
			}
			else {
				return null;
			}
		}
	};

	// get a peer's grpc url
	helper.getPeersUrl = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer key not passed');
		}
		else {
			let peer = helper.getPeer(key);
			if (peer) {
				return peer.url;
			}
			else {
				throw new Error('Peer key not found.');
			}
		}
	};

	// get all peers grpc urls and event urls, on this channel
	helper.getAllPeerUrls = function (channelId) {
		let ret = {
			urls: [],
			eventUrls: []
		};
		if (helper.creds.channels && helper.creds.channels[channelId]) {
			for (let peerId in helper.creds.channels[channelId].peers) {	//iter on the peers on this channel
				ret.urls.push(helper.creds.peers[peerId].url);				//get the grpc url for this peer
				ret.eventUrls.push(helper.creds.peers[peerId].eventUrl);	//get the grpc EVENT url for this peer
			}
		}
		return ret;
	};

	// get a peer's grpc event url
	helper.getPeerEventUrl = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer key not passed');
		} else {
			let peer = helper.getPeer(key);
			if (peer) {
				return peer.eventUrl;
			}
			else {
				throw new Error('Peer key not found.');
			}
		}
	};

	// get a peer's tls options
	helper.getPeerTlsCertOpts = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer\'s key not passed');
		} else {
			let peer = helper.getPeer(key);
			return buildTlsOpts(peer);
		}
	};


	// --------------------------------------------------------------------------------
	// Certificate Authorities Getters
	// --------------------------------------------------------------------------------
	// find the first ca in the certificateAuthorities field for this org
	helper.getFirstCaName = function (orgName) {
		const org = helper.creds.organizations[orgName];
		if (org && org.certificateAuthorities) {
			if (org.certificateAuthorities && org.certificateAuthorities[0]) {
				return org.certificateAuthorities[0];
			}
		}
		throw new Error('CAs not found.');
	};

	// get a ca obj
	helper.getCA = function (key) {
		if (key === undefined || key == null) {
			throw new Error('CA key not passed');
		} else {
			if (helper.creds.certificateAuthorities) {
				return helper.creds.certificateAuthorities[key];
			} else {
				return null;
			}
		}
	};

	// get a ca's http url
	helper.getCasUrl = function (key) {
		if (key === undefined || key == null) {
			throw new Error('CA key not passed');
		} else {
			let ca = helper.getCA(key);
			if (ca) {
				return ca.url;
			}
			else {
				throw new Error('CA not found.');
			}
		}
	};

	// get all the ca http urls
	helper.getAllCaUrls = function () {
		let ret = [];
		for (let id in helper.creds.certificateAuthorities) {
			ret.push(helper.creds.certificateAuthorities[id].url);
		}
		return ret;
	};

	// get a ca's name, could be null
	helper.getCaName = function (key) {
		if (key === undefined || key == null) {
			throw new Error('CA key not passed');
		} else {
			let ca = helper.getCA(key);
			if (ca) {
				return ca.caName;
			}
			else {
				throw new Error('CA not found.');
			}
		}
	};

	// get a ca's tls options
	helper.getCaTlsCertOpts = function (key) {
		if (key === undefined || key == null) {
			throw new Error('CAs key not passed');
		} else {
			let ca = helper.getCA(key);
			return buildTlsOpts(ca);
		}
	};

	// get an enrollment user
	helper.getEnrollObj = function (caKey, user_index) {
		if (caKey === undefined || caKey == null) {
			throw new Error('CA key not passed');
		} else {
			var ca = helper.getCA(caKey);
			if (ca && ca.registrar && ca.registrar[user_index]) {
				return ca.registrar[user_index];
			}
			else {
				throw new Error('Cannot find enroll id at index.', caKey, user_index);
			}
		}
	};

	// --------------------------------------------------------------------------------
	// Orderer Getters
	// --------------------------------------------------------------------------------
	// get the first orderer in the channels field
	helper.getFirstOrdererName = function (ch) {
		const channel = helper.creds.channels[ch];
		if (channel && channel.orderers && channel.orderers[0]) {
			return channel.orderers[0];
		}
		throw new Error('Orderer not found for this channel', ch);
	};

	// get an orderer object
	helper.getOrderer = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Orderers key not passed');
		} else {
			if (helper.creds.orderers) {
				return helper.creds.orderers[key];
			} else {
				return null;
			}
		}
	};

	// get an orderer's grpc url
	helper.getOrderersUrl = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Orderers key not passed');
		} else {
			let orderer = helper.getOrderer(key);
			if (orderer) {
				return orderer.url;
			}
			else {
				throw new Error('Orderer not found.');
			}
		}
	};

	// get a orderer's tls options
	helper.getOrdererTlsCertOpts = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Orderer\'s key not passed');
		} else {
			let orderer = helper.getOrderer(key);
			return buildTlsOpts(orderer);
		}
	};


	// --------------------------------------------------------------------------------
	// Other Credential Getters
	// --------------------------------------------------------------------------------
	// build the tls options for the sdk
	function buildTlsOpts(node_obj) {
		let ret = {
			'ssl-target-name-override': null,
			pem: null,
			'grpc.http2.keepalive_time': 300,					//grpc 1.2.4
			'grpc.keepalive_time_ms': 300000,					//grpc 1.3.7
			'grpc.http2.keepalive_timeout': 35,					//grpc 1.2.4
			'grpc.keepalive_timeout_ms': 3500,					//grpc 1.3.7
		};
		if (node_obj) {
			if (node_obj.tlsCACerts) {
				ret.pem = loadPem(node_obj.tlsCACerts);
			}
			if (node_obj.grpcOptions) {
				for (var field in ret) {
					if (node_obj.grpcOptions[field]) {
						ret[field] = node_obj.grpcOptions[field];
					}
				}
			}
		}
		return ret;
	}

	// find the first org name in the organization field
	helper.getFirstOrg = function () {
		if (helper.creds.organizations) {
			const orgs = Object.keys(helper.creds.organizations);
			if (orgs && orgs[0]) {
				return orgs[0];
			}
		}
		throw new Error('Orgs not found.');
	};

	// find the org name in the client field
	helper.getClientOrg = function () {
		if (helper.creds.client && helper.creds.client.organization) {
			return helper.creds.client.organization;
		}
		throw new Error('Org not found.');
	};

	// get this org's msp id
	helper.getOrgsMSPid = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Org key not passed');
		}
		else {
			if (helper.creds.organizations && helper.creds.organizations[key]) {
				return helper.creds.organizations[key].mspid;
			}
			else {
				throw new Error('Org key not found.', key);
			}
		}
	};

	// get an admin private key PEM certificate
	helper.getAdminPrivateKeyPEM = function (orgName) {
		if (orgName && helper.creds.organizations && helper.creds.organizations[orgName]) {
			if (!helper.creds.organizations[orgName].adminPrivateKey) {
				if (!helper.creds.organizations[orgName]['x-certJson'] || !helper.creds.organizations[orgName]['x-certJson'].path) {
					throw new Error('Admin private key is not found in the creds json file: ' + orgName);
				} else {
					const obj = getCryptoFromCertJson(helper.creds.organizations[orgName]['x-certJson'].path);
					return loadPem(obj.adminPrivateKey);
				}
			} else {
				return loadPem(helper.creds.organizations[orgName].adminPrivateKey);
			}
		}
		else {
			throw new Error('Cannot find org.', orgName);
		}
	};

	// get an admin's signed cert PEM
	helper.getAdminSignedCertPEM = function (orgName) {
		if (orgName && helper.creds.organizations && helper.creds.organizations[orgName]) {
			if (!helper.creds.organizations[orgName].signedCert) {
				if (!helper.creds.organizations[orgName]['x-certJson'] || !helper.creds.organizations[orgName]['x-certJson'].path) {
					throw new Error('Admin certificate is not found in the creds json file: ' + orgName);
				} else {
					const obj = getCryptoFromCertJson(helper.creds.organizations[orgName]['x-certJson'].path);
					return loadPem(obj.signedCert);
				}
			} else {
				return loadPem(helper.creds.organizations[orgName].signedCert);
			}
		}
		else {
			throw new Error('Cannot find org.', orgName);
		}
		return null;
	};

	// load cert from file path OR just pass cert back
	function loadPem(obj) {
		if (obj && obj.path) {											// looks like field is a path to a file
			var path2cert = path.join(__dirname, '../config/' + obj.path);
			if (obj.path.indexOf('/') === 0) {
				path2cert = obj.path;									//its an absolute path
			}
			return fs.readFileSync(path2cert, 'utf8') + '\r\n'; 		//read from file, LOOKING IN config FOLDER
		} else {
			return obj.pem;												//can be null if network is not using TLS
		}
		return null;
	}

	// return an object with the private key and the admin cert
	function getCryptoFromCertJson(file_path) {
		const ret = {
			adminPrivateKey: {
				path: null
			},
			signedCert: {
				pem: null
			}
		};
		try {
			const json = fs.readFileSync(file_path);						//open the crypto file, fabcar generated this
			const obj = JSON.parse(json);
			ret.adminPrivateKey.path = path.join(strip_2_folder(file_path), obj.enrollment.signingIdentity + '-priv');	//load it via path
			ret.signedCert.pem = obj.enrollment.identity.certificate;		//load it directly
		} catch (e) {
			logger.error(e);
			throw new Error('Cannot parse crypto json', file_path);
		}
		return ret;

		// take the filename out of the pathname, leave the path to the folder
		function strip_2_folder(pathname) {
			const lastPos = pathname.lastIndexOf('/');
			return pathname.substring(0, lastPos);
		}
	}

	// get the very first channel name from creds
	helper.getFirstChannelId = function () {
		if (helper.creds && helper.creds.channels) {
			var channels = Object.keys(helper.creds.channels);
			if (channels[0]) {
				return channels[0];
			}
		}
		throw Error('No channels found in credentials file... this is problematic. A channel needs to be created before marbles can execute.');
	};

	// get the first chaincode id on the network
	helper.getChaincodeId = function () {
		if (process.env.CHAINCODE_ID) {														// detected a preferred chaincode id instead of first
			//console.log('debug: found preferred chaincode id', process.env.CHAINCODE_ID);
			return process.env.CHAINCODE_ID;
		} else {																			// else get the first chaincode we see
			var channel = helper.getFirstChannelId();
			if (channel && helper.creds.channels[channel] && helper.creds.channels[channel].chaincodes) {
				if (Array.isArray(helper.creds.channels[channel].chaincodes)) {				// config version 1.0.2 way
					let chaincode = helper.creds.channels[channel].chaincodes[0];			// first one
					if (chaincode) {
						return chaincode.split(':')[0];
					}
				} else {
					let chaincode = Object.keys(helper.creds.channels[channel].chaincodes);	// config version 1.0.0 and 1.0.1 way
					return chaincode[0];													// first one
				}
			}
			logger.warn('No chaincode ID found in credentials file... might be okay if we haven\'t instantiated marbles yet');
			return null;
		}
	};

	// get the first chaincode version on the network
	helper.getChaincodeVersion = function () {
		if (process.env.CHAINCODE_VERSION) {												// detected a preferred chaincode version instead of first
			//console.log('debug: found preferred chaincode version', process.env.CHAINCODE_VERSION);
			return process.env.CHAINCODE_VERSION;
		} else {																			// else get the first chaincode we see
			var channel = helper.getFirstChannelId();
			var chaincodeId = helper.getChaincodeId();
			if (channel && chaincodeId) {
				if (Array.isArray(helper.creds.channels[channel].chaincodes)) {				// config version 1.0.2 way
					let chaincode = helper.creds.channels[channel].chaincodes[0];			// first one
					if (chaincode) {
						return chaincode.split(':')[1];
					}
				} else {
					return helper.creds.channels[channel].chaincodes[chaincodeId];			// config version 1.0.0 and 1.0.1 way
				}
			}
			logger.warn('No chaincode version found in credentials file... might be okay if we haven\'t instantiated marbles yet');
			return null;
		}
	};

	// get the chaincode id on network
	helper.getBlockDelay = function () {
		let ret = 1000;
		var channel = helper.getFirstChannelId();
		if (helper.creds.channels && helper.creds.channels[channel] && helper.creds.channels[channel]['x-blockDelay']) {
			if (!isNaN(helper.creds.channels[channel]['x-blockDelay'])) {
				ret = helper.creds.channels[channel]['x-blockDelay'];
			}
		}
		return ret;
	};

	// get key value store location
	helper.getKvsPath = function (opts) {
		const id = helper.makeUniqueId();
		const default_path = path.join(os.homedir(), '.hfc-key-store/', id);

		if (opts && opts.going2delete) {							//if this is for a delete, return default so we don't wipe a kvs someone setup
			return default_path;									//do the default one
		}

		// -- Using Custom KVS -- //
		if (helper.creds.client && helper.creds.client.credentialStore) {
			const kvs_path = helper.creds.client.credentialStore.path;
			let ret = path.join(__dirname, '../config/' + kvs_path + '/');
			if (kvs_path.indexOf('/') === 0) {
				ret = kvs_path;										//its an absolute path
			}
			return ret;												//use the kvs provided in the json
		} else {
			return default_path;									//make a new kvs folder in the home dir
		}
	};


	// --------------------------------------------------------------------------------
	// Config Getters
	// --------------------------------------------------------------------------------
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

	// safely retrieve marbles fields
	function getMarblesField(marbles_field) {
		try {
			if (helper.config[marbles_field]) {
				return helper.config[marbles_field];
			}
			else {
				logger.warn('"' + marbles_field + '" not found in config json: ' + helper.config_path);
				return null;
			}
		}
		catch (e) {
			logger.warn('"' + marbles_field + '" not found in config json: ' + helper.config_path);
			return null;
		}
	}


	// --------------------------------------------------------------------------------
	// Build Options
	// --------------------------------------------------------------------------------
	helper.makeUniqueId = function () {
		const channel = helper.getFirstChannelId();
		const first_peer = helper.getFirstPeerName(channel);
		return 'marbles-' + helper.getNetworkName() + '-' + channel + '-' + first_peer;
	};

	// build the marbles lib module options
	helper.makeMarblesLibOptions = function () {
		const channel = helper.getFirstChannelId();
		const org_2_use = helper.getClientOrg();
		const first_ca = helper.getFirstCaName(org_2_use);
		const first_peer = helper.getFirstPeerName(channel);
		const first_orderer = helper.getFirstOrdererName(channel);
		return {
			block_delay: helper.getBlockDelay(),
			channel_id: helper.getFirstChannelId(),
			chaincode_id: helper.getChaincodeId(),
			event_urls: (helper.getEventsSetting()) ? helper.getAllPeerUrls(channel).eventUrls : null,	//null is important
			chaincode_version: helper.getChaincodeVersion(),
			ca_tls_opts: helper.getCaTlsCertOpts(first_ca),
			orderer_tls_opts: helper.getOrdererTlsCertOpts(first_orderer),
			peer_tls_opts: helper.getPeerTlsCertOpts(first_peer),
			peer_urls: helper.getAllPeerUrls(channel).urls,
		};
	};

	// build the enrollment options for using an enroll ID
	helper.makeEnrollmentOptions = function (userIndex) {
		if (userIndex === undefined || userIndex == null) {
			throw new Error('User index not passed');
		} else {
			const channel = helper.getFirstChannelId();
			const org_2_use = helper.getClientOrg();
			const first_ca = helper.getFirstCaName(org_2_use);
			const first_peer = helper.getFirstPeerName(channel);
			const first_orderer = helper.getFirstOrdererName(channel);
			const org_name = helper.getOrgsMSPid(org_2_use);				//lets use the first org we find
			const user_obj = helper.getEnrollObj(first_ca, userIndex);		//there may be multiple users
			return {
				channel_id: channel,
				uuid: helper.makeUniqueId(),
				ca_urls: helper.getAllCaUrls(),
				ca_name: helper.getCaName(first_ca),
				orderer_url: helper.getOrderersUrl(first_orderer),
				peer_urls: [helper.getPeersUrl(first_peer)],
				enroll_id: user_obj.enrollId,
				enroll_secret: user_obj.enrollSecret,
				msp_id: org_name,
				ca_tls_opts: helper.getCaTlsCertOpts(first_ca),
				orderer_tls_opts: helper.getOrdererTlsCertOpts(first_orderer),
				peer_tls_opts: helper.getPeerTlsCertOpts(first_peer),
				kvs_path: helper.getKvsPath()
			};
		}
	};

	// build the enrollment options using an admin cert
	helper.makeEnrollmentOptionsUsingCert = function () {
		const channel = helper.getFirstChannelId();
		const org_2_use = helper.getClientOrg();
		const first_peer = helper.getFirstPeerName(channel);
		const first_orderer = helper.getFirstOrdererName(channel);
		const org_name = helper.getOrgsMSPid(org_2_use);		//lets use the first org we find
		return {
			channel_id: channel,
			uuid: helper.makeUniqueId(),
			orderer_url: helper.getOrderersUrl(first_orderer),
			peer_urls: [helper.getPeersUrl(first_peer)],
			msp_id: org_name,
			privateKeyPEM: helper.getAdminPrivateKeyPEM(org_name),
			signedCertPEM: helper.getAdminSignedCertPEM(org_name),
			orderer_tls_opts: helper.getOrdererTlsCertOpts(first_orderer),
			peer_tls_opts: helper.getPeerTlsCertOpts(first_peer),
			kvs_path: helper.getKvsPath()
		};
	};

	// write new settings
	helper.write = function (obj) {
		console.log('saving the creds file has been disabled temporarily');

		const channel = helper.getFirstChannelId();
		const org_2_use = helper.getClientOrg();
		const first_peer = helper.getFirstPeerName(channel);
		const first_ca = helper.getFirstCaName(org_2_use);
		const first_orderer = helper.getFirstOrdererName(channel);

		//var config_file = JSON.parse(fs.readFileSync(helper.config_path, 'utf8'));
		var creds_file = JSON.parse(fs.readFileSync(helper.creds_path, 'utf8'));

		if (obj.ordererUrl) {
			creds_file.orderers[first_orderer].url = obj.ordererUrl;
		}
		if (obj.peerUrl) {
			creds_file.peers[first_peer].url = obj.peerUrl;
		}
		if (obj.caUrl) {
			creds_file.certificateAuthorities[first_ca].url = obj.caUrl;
		}
		if (obj.chaincodeId) {
			let version = helper.getChaincodeVersion();
			if (obj.chaincodeVersion) {						// changing both id and version
				version = obj.chaincodeVersion;
			}
			creds_file.channels[channel].chaincodes = [obj.chaincodeId + ':' + version];
		}
		if (obj.chaincodeVersion) {
			let chaincodeId = helper.getChaincodeId();
			if (obj.chaincodeId) {							// changing both id and version
				chaincodeId = obj.chaincodeVersion;
			}
			creds_file.channels[channel].chaincodes = [chaincodeId + ':' + obj.chaincodeVersion];
		}
		if (obj.channelId) {
			const old_channel_obj = JSON.parse(JSON.stringify(creds_file.channels[channel]));
			creds_file.channels = {};
			creds_file.channels[obj.channelId] = old_channel_obj;
		}
		if (obj.enrollId && obj.enrollSecret) {
			creds_file.certificateAuthorities[first_ca].registrar[0] = {
				enrollId: obj.enrollId,
				enrollSecret: obj.enrollSecret
			};
		}

		fs.writeFileSync(helper.creds_path, JSON.stringify(creds_file, null, 4), 'utf8');	//save to file
		helper.creds = creds_file;													//replace old copy
	};


	// --------------------------------------------------------------------------------
	// Input Checking
	// --------------------------------------------------------------------------------
	// check if user has changed the settings from the default ones - returns error array when there is a problem
	helper.checkConfig = function () {
		let errors = [];
		if (helper.getNetworkName() === 'Place Holder Network Name') {
			console.log('\n');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('----------------------------- Hey Buddy! -----------------------------');
			logger.warn('------------------------- It looks like you --------------------------');
			logger.error('----------------------------- skipped -------------------------------');
			logger.warn('------------------------- some instructions --------------------------');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('Your network config JSON has a network name of "Place Holder Network Name"...');
			logger.warn('I\'m afraid you cannot use the default settings as is.');
			logger.warn('These settings must be edited to point to YOUR network.');
			logger.warn('----------------------------------------------------------------------');
			logger.error('Fix this file: ./config/' + helper.getNetworkCredFileName());
			logger.warn('It must have credentials/hostnames/ports/channels/etc for YOUR network');
			logger.warn('How/where would I get that info? Are you using the Bluemix service? Then look at these instructions(near the end): ');
			logger.warn('https://github.com/IBM-Blockchain/marbles/blob/v4.0/docs/install_chaincode.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			errors.push('Using default values');
			return errors;
		}
		return helper.check_for_missing();					//run the next check
	};

	// check if marbles UI and marbles chaincode work together
	helper.errorWithVersions = function (v) {
		var version = package_json.version;
		if (!v || !v.parsed) v = { parsed: '0.x.x' };		//default
		if (v.parsed[0] !== version[0]) {					//only check the major version
			console.log('\n');
			logger.warn('---------------------------------------------------------------');
			logger.warn('----------------------------- Ah! -----------------------------');
			logger.warn('---------------------------------------------------------------');
			logger.error('Looks like you are using an old version of marbles chaincode...');
			logger.warn('The INTERNAL version of the chaincode found is: v' + v.parsed);
			logger.warn('But this UI is expecting INTERNAL chaincode version: v' + version[0] + '.x.x');
			logger.warn('This mismatch won\'t work =(');
			logger.warn('Install and instantiate the chaincode found in the ./chaincode folder on your channel ' + helper.getFirstChannelId());
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return true;
		}
		return false;
	};

	// check if config has missing entries
	helper.check_for_missing = function () {
		let errors = [];
		const channel = helper.getFirstChannelId();

		if (!channel) {
			errors.push('There is no channel data in the "channels" field');
		} else {
			let org_2_use, first_ca, first_orderer, first_peer;
			try {
				org_2_use = helper.getClientOrg();
				first_ca = helper.getFirstCaName(org_2_use);
				first_orderer = helper.getFirstOrdererName(channel);
				first_peer = helper.getFirstPeerName(channel);
			} catch (e) {
				// errors are logged below
			}

			if (!helper.getCA(first_ca)) {
				errors.push('There is no CA data in the "certificateAuthorities" field');
			}
			if (!helper.getOrderer(first_orderer)) {
				errors.push('There is no Orderer data in the "orderers" field');
			}
			if (!helper.getPeer(first_peer)) {
				errors.push('There is no Peer data in the "peers" field');
			}
		}

		if (errors.length > 0) {
			console.log('\n');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('------------------------------- Whoops -------------------------------');
			logger.warn('----------- You are missing some data in your creds file -------------');
			logger.warn('----------------------------------------------------------------------');
			for (var i in errors) {
				logger.error(errors[i]);
			}
			logger.warn('----------------------------------------------------------------------');
			logger.error('Fix this file: ./config/' + helper.getNetworkCredFileName());
			logger.warn('----------------------------------------------------------------------');
			logger.warn('See this file for help:');
			logger.warn('https://github.com/IBM-Blockchain/marbles/blob/v4.0/docs/config_file.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return errors;
		}
		return helper.check_protocols();					//run the next check
	};

	// check if config has protocol errors - returns error array when there is a problem
	helper.check_protocols = function () {
		let errors = [];
		const channel = helper.getFirstChannelId();
		const org_2_use = helper.getClientOrg();
		const first_ca = helper.getFirstCaName(org_2_use);
		const first_orderer = helper.getFirstOrdererName(channel);
		const first_peer = helper.getFirstPeerName(channel);

		if (helper.getCasUrl(first_ca).indexOf('grpc') >= 0) {
			errors.push('You accidentally typed "grpc" in your CA url. It should be "http://" or "https://"');
		}
		if (helper.getOrderersUrl(first_orderer).indexOf('http') >= 0) {
			errors.push('You accidentally typed "http" in your Orderer url. It should be "grpc://" or "grpcs://"');
		}
		if (helper.getPeersUrl(first_peer).indexOf('http') >= 0) {
			errors.push('You accidentally typed "http" in your Peer discovery url. It should be "grpc://" or "grpcs://"');
		}
		if (helper.getPeerEventUrl(first_peer).indexOf('http') >= 0) {
			errors.push('You accidentally typed "http" in your Peer events url. It should be "grpc://" or "grpcs://"');
		}

		if (errors.length > 0) {
			console.log('\n');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('------------------------ Close but no cigar --------------------------');
			logger.warn('---------------- You have at least one protocol typo -----------------');
			logger.warn('----------------------------------------------------------------------');
			for (var i in errors) {
				logger.error(errors[i]);
			}
			logger.warn('----------------------------------------------------------------------');
			logger.error('Fix this file: ./config/' + helper.getNetworkCredFileName());
			logger.warn('----------------------------------------------------------------------');
			logger.warn('See this file for help:');
			logger.warn('https://github.com/IBM-Blockchain/marbles/blob/v4.0/docs/config_file.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return errors;
		}
		return null;
	};

	return helper;
};

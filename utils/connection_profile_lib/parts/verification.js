// ============================================================================================================================
// 											Look over the CP data to see if its a-ok
// ============================================================================================================================
var path = require('path');

module.exports = function (cp, logger) {
	var helper = {};

	// --------------------------------------------------------------------------------------------
	// check if marbles UI and marbles chaincode work together
	// --------------------------------------------------------------------------------------------
	helper.errorWithVersions = function (v) {
		var package_json = require(path.join(__dirname, '../../../package.json'));		// get release version of marbles from package.json
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
			logger.warn('Install and instantiate the chaincode found in the ./chaincode folder on your channel ' + cp.getChannelId());
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return true;
		}
		return false;
	};

	// --------------------------------------------------------------------------------------------
	// check if config has missing entries
	// --------------------------------------------------------------------------------------------
	helper.check_for_missing = function () {
		let errors = [];
		const channel = cp.getChannelId();

		if (!channel) {
			errors.push('There is no channel data in the "channels" field');
		} else {
			let org_2_use, first_ca, first_orderer, first_peer;
			try {
				console.log('Welcome aboard:\t', process.env.marble_company);
				console.log('Channel:\t', channel);
				org_2_use = cp.getClientOrg();
				console.log('Org:\t\t', org_2_use);
				first_ca = cp.getFirstCaName(org_2_use);
				console.log('CA:\t\t', first_ca);
				first_orderer = cp.getFirstOrdererName(channel);
				console.log('Orderer:\t', first_orderer);
				first_peer = cp.getFirstPeerName(channel);
				console.log('Peer:\t\t', first_peer);
			} catch (e) {
				// errors are logged below
			}

			console.log('Chaincode ID:\t', cp.getChaincodeId());
			console.log('Chaincode Version: ', cp.getChaincodeVersion());

			if (!org_2_use) {
				errors.push('There is no org data in the "client" field for provided connection profile');
			}
			if (!cp.getCA(first_ca)) {
				errors.push('There is no CA data in the "certificateAuthorities" field for provided connection profile');
			}
			if (!first_orderer) {
				errors.push('There is no orderer data in the "orderer" field for provided connection profile');
			} else {
				if (!cp.getOrderer(first_orderer)) {
					errors.push('There is no Orderer data in the "orderers" field for provided connection profile');
				}
			}
			if (!first_peer) {
				errors.push('There is no org peer in the "peer" field for provided connection profile');
			} else {
				if (!cp.getPeer(first_peer)) {
					errors.push('There is no Peer data in the "peers" field for provided connection profile');
				}
			}
		}

		if (errors.length > 0) {
			console.log('\n');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('------------------------------- Whoops -------------------------------');
			logger.warn('------- You are missing some data in your connection profile ---------');
			logger.warn('----------------------------------------------------------------------');
			for (var i in errors) {
				logger.error(errors[i]);
			}
			logger.warn('----------------------------------------------------------------------');
			if (!cp.using_env) logger.error('Fix this file: ./config/' + cp.getNetworkCredFileName());
			else logger.error('Fix your env variable "CONNECTION_PROFILE"');
			logger.warn('----------------------------------------------------------------------');
			logger.warn('See this file for help:');
			logger.warn('https://github.com/IBM-Blockchain/marbles/blob/v4.0/docs/config_file.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return errors;
		}
		return helper.check_protocols();					//run the next check
	};

	// --------------------------------------------------------------------------------------------
	// check if config has protocol errors - returns error array when there is a problem
	// --------------------------------------------------------------------------------------------
	helper.check_protocols = function () {
		let errors = [];
		const channel = cp.getChannelId();
		const org_2_use = cp.getClientOrg();
		const first_ca = cp.getFirstCaName(org_2_use);
		const first_orderer = cp.getFirstOrdererName(channel);
		const first_peer = cp.getFirstPeerName(channel);

		if (cp.getCasUrl(first_ca).indexOf('grpc') >= 0) {
			errors.push('You accidentally typed "grpc" in your CA url. It should be "http://" or "https://"');
		}
		if (cp.getOrderersUrl(first_orderer).indexOf('http') >= 0) {
			errors.push('You accidentally typed "http" in your Orderer url. It should be "grpc://" or "grpcs://"');
		}
		if (cp.getPeersUrl(first_peer).indexOf('http') >= 0) {
			errors.push('You accidentally typed "http" in your Peer discovery url. It should be "grpc://" or "grpcs://"');
		}
		if (cp.getPeerEventUrl(first_peer).indexOf('http') >= 0) {
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
			logger.error('Fix this file: ./config/' + cp.getNetworkCredFileName());
			logger.warn('----------------------------------------------------------------------');
			logger.warn('See this file for help:');
			logger.warn('https://github.com/IBM-Blockchain/marbles/blob/v4.0/docs/config_file.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			return errors;
		}
		return null;
	};

	// --------------------------------------------------------------------------------------------
	// check if user has changed the settings from the default ones - returns error array when there is a problem
	// --------------------------------------------------------------------------------------------
	helper.checkConfig = function () {
		let errors = [];
		if (cp.getNetworkName() === 'Place Holder Network Name') {
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
			logger.error('Fix this file: ./config/' + cp.getNetworkCredFileName());
			logger.warn('It must have credentials/hostnames/ports/channels/etc for YOUR network');
			logger.warn('How/where would I get that info? Are you using the IBM Cloud Blockchain service? Then look at these instructions(near the end): ');
			logger.warn('https://github.com/IBM-Blockchain/marbles/blob/v4.0/docs/install_chaincode.md');
			logger.warn('----------------------------------------------------------------------');
			console.log('\n\n');
			errors.push('Using default values');
			return errors;
		}
		return helper.check_for_missing();					//run the next check
	};

	return helper;
};

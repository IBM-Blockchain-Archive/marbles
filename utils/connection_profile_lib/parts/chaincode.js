// ============================================================================================================================
// 													Get chaincode fields from connection profile data
// ============================================================================================================================
module.exports = function (cp, logger) {
	var helper = {};

	// ----------------------------------------------------------
	// get the first chaincode id on the network
	// ----------------------------------------------------------
	helper.getChaincodeId = function () {
		if (process.env.CHAINCODE_ID) {													// detected a preferred chaincode id instead of first
			//console.log('debug: found preferred chaincode id', process.env.CHAINCODE_ID);
			return process.env.CHAINCODE_ID;
		} else {																		// else get the first chaincode we see
			var channel = cp.getChannelId();
			if (channel && cp.creds.channels[channel] && cp.creds.channels[channel].chaincodes) {
				if (Array.isArray(cp.creds.channels[channel].chaincodes)) {				// config version 1.0.2 way
					let chaincode = cp.creds.channels[channel].chaincodes[0];			// first one
					if (chaincode) {
						return chaincode.split(':')[0];
					}
				} else {
					let chaincode = Object.keys(cp.creds.channels[channel].chaincodes);	// config version 1.0.0 and 1.0.1 way
					return chaincode[0];												// first one
				}
			}
			logger.warn('No chaincode ID found in connection profile... might be okay if we haven\'t instantiated marbles yet');
			return null;
		}
	};

	// ----------------------------------------------------------
	// get the first chaincode version on the network
	// ----------------------------------------------------------
	helper.getChaincodeVersion = function () {
		if (process.env.CHAINCODE_VERSION) {											// detected a preferred chaincode version instead of first
			//console.log('debug: found preferred chaincode version', process.env.CHAINCODE_VERSION);
			return process.env.CHAINCODE_VERSION;
		} else {																		// else get the first chaincode we see
			var channel = cp.getChannelId();
			var chaincodeId = helper.getChaincodeId();
			if (channel && chaincodeId) {
				if (Array.isArray(cp.creds.channels[channel].chaincodes)) {				// config version 1.0.2 way
					let chaincode = cp.creds.channels[channel].chaincodes[0];			// first one
					if (chaincode) {
						return chaincode.split(':')[1];
					}
				} else {
					return cp.creds.channels[channel].chaincodes[chaincodeId];			// config version 1.0.0 and 1.0.1 way
				}
			}
			logger.warn('No chaincode version found in connection profile... might be okay if we haven\'t instantiated marbles yet');
			return null;
		}
	};

	return helper;
};

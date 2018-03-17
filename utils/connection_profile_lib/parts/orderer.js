// ============================================================================================================================
// 													Get orderer fields from connection profile data
// ============================================================================================================================

module.exports = function (cp, logger) {
	var helper = {};

	// get the first orderer in the channels field
	helper.getFirstOrdererName = function (ch) {
		const channel = cp.creds.channels[ch];
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
			if (cp.creds.orderers) {
				return cp.creds.orderers[key];
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
			return cp.buildTlsOpts(orderer);
		}
	};


	return helper;
};

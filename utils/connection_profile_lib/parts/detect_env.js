// ============================================================================================================================
// 							Detect if CP is in the env or in a file.  env overrides a file.
// ============================================================================================================================
module.exports = function (logger) {
	var detect_env = {};

	// See if marbles has the connection profile as an environmental variable or not - return cp if so, null if not
	detect_env.getConnectionProfileFromEnv = function () {

		// --- Get Service Credentials  --- //
		if (process.env.VCAP_SERVICES) {												// if we are in IBM Cloud this will be set
			logger.info('Detected that we are in IBM Cloud');
			let VCAP = null;
			try {
				VCAP = JSON.parse(process.env.VCAP_SERVICES);
				console.log('vcap:', JSON.stringify(VCAP, null, 2));
			} catch (e) {
				logger.warn('VCAP from IBM Cloud is not JSON... this is not great');
			}
			for (let plan_name in VCAP) {
				if (plan_name.indexOf('blockchain') >= 0) {
					logger.info('pretty sure this is the IBM Blockchain Platform service:', plan_name);
					if (VCAP[plan_name][0].credentials && VCAP[plan_name][0].credentials) {				// pull the first org
						const firstOrg = Object.keys(VCAP[plan_name][0].credentials)[0];
						if (firstOrg) {
							process.env.SERVICE_CREDENTIALS = VCAP[plan_name][0].credentials[firstOrg];	// found our service credentials
						}
					}
				}
			}
		}

		// --- Get Connection Profile  --- //
		if (process.env.CONNECTION_PROFILE) {
			try {
				const cp = JSON.parse(process.env.CONNECTION_PROFILE);
				//console.log('cp:', typeof cp, Object.keys(cp));
				return cp;
			} catch (e) {
				logger.error('CONNECTION_PROFILE from IBM Cloud is not JSON... this is bad');
			}
			logger.error('uh oh, we are using IBM Cloud but I could not find CONNECTION_PROFILE');
		}

		return null;
	};

	return detect_env;
};

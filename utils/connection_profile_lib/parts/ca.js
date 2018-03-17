// ============================================================================================================================
// 												Get certificate authorities fields from connection profile data
// ============================================================================================================================
module.exports = function (cp, logger) {
	var helper = {};

	// find the first ca in the certificateAuthorities field for this org
	helper.getFirstCaName = function (orgName) {
		const org = cp.creds.organizations[orgName];
		if (org && org.certificateAuthorities) {
			if (org.certificateAuthorities && org.certificateAuthorities[0]) {
				return org.certificateAuthorities[0];
			}
		}
		logger.error('CA not found');
		return null;
	};

	// get a ca obj
	helper.getCA = function (key) {
		if (key === undefined || key == null) {
			logger.error('CA key not passed');
			return null;
		} else {
			if (cp.creds.certificateAuthorities) {
				return cp.creds.certificateAuthorities[key];
			} else {
				return null;
			}
		}
	};

	// get a ca's http url
	helper.getCasUrl = function (key) {
		if (key === undefined || key == null) {
			logger.error('CA key not passed');
			return null;
		} else {
			let ca = helper.getCA(key);
			if (ca) {
				return ca.url;
			} else {
				logger.error('CA not found');
				return null;
			}
		}
	};

	// get all the ca http urls
	helper.getAllCaUrls = function () {
		let ret = [];
		for (let id in cp.creds.certificateAuthorities) {
			ret.push(cp.creds.certificateAuthorities[id].url);
		}
		return ret;
	};

	// get a ca's name, could be null
	helper.getCaName = function (key) {
		if (key === undefined || key == null) {
			logger.error('CA key not passed');
			return null;
		} else {
			let ca = helper.getCA(key);
			if (ca) {
				return ca.caName;
			} else {
				logger.error('CA not found');
				return null;
			}
		}
	};

	// get a ca's tls options
	helper.getCaTlsCertOpts = function (key) {
		if (key === undefined || key == null) {
			logger.error('CA key not passed');
			return null;
		} else {
			let ca = helper.getCA(key);
			return cp.buildTlsOpts(ca);
		}
	};

	// get an enrollment user
	helper.getEnrollObj = function (caKey, user_index) {
		if (caKey === undefined || caKey == null) {
			logger.error('CA key not passed');
			return null;
		} else {
			var ca = helper.getCA(caKey);
			if (ca && ca.registrar && ca.registrar[user_index]) {
				return ca.registrar[user_index];
			} else {
				logger.error('Cannot find enroll id at index.', caKey, user_index);
				return null;
			}
		}
	};

	return helper;
};

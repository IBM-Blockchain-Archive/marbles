// ============================================================================================================================
// 													Get org fields from connection profile data
// ============================================================================================================================
var fs = require('fs');
var path = require('path');

module.exports = function (cp, logger) {
	var helper = {};
	var misc = require('../../misc.js')(logger);												// mis.js has generic (non-blockchain) related functions

	// find the first org name in the organization field
	helper.getFirstOrg = function () {
		if (cp.creds.organizations) {
			const orgs = Object.keys(cp.creds.organizations);
			if (orgs && orgs[0]) {
				return orgs[0];
			}
		}
		logger.error('Org not found.');
		return null;
	};

	// get the org name from the cp or config file
	helper.getClientsOrgName = function () {
		if (cp.creds && cp.creds.client && cp.creds.client['x-organizationName']) {
			return misc.saferCompanyNames(cp.creds.client['x-organizationName']);
		} else {
			return misc.saferCompanyNames(cp.getCompanyNameFromFile());				//fallback
		}
	};

	// find the org name in the client field
	helper.getClientOrg = function () {
		if (cp.creds.client && cp.creds.client.organization) {
			return cp.creds.client.organization;
		}
		logger.error('Org not found.');
		return null;
	};

	// get the marble usernames from the cp or config file
	helper.getMarbleUsernames = function () {
		if (cp.using_env) {
			let org = cp.getClientOrg();
			if (org) org = org.toLowerCase();
			else org = '-';

			if (org.indexOf('org1') >= 0) {
				return ['amy', 'alice', 'ava'];
			} else if (org.indexOf('org2') >= 0) {
				return ['andre', 'andrew', 'aaron'];
			} else if (org.indexOf('org3') >= 0) {
				return ['alexa', 'alex', 'alexandra'];
			} else if (org.indexOf('org4') >= 0) {
				return ['adam', 'abraham', 'anthony'];
			} else if (org.indexOf('org5') >= 0) {
				return ['anjolie', 'april', 'alita'];
			} else if (org.indexOf('org6') >= 0) {
				return ['ace', 'ali', 'allen'];
			} else if (org.indexOf('org7') >= 0) {
				return ['ann', 'anne', 'anna'];
			} else if (org.indexOf('org8') >= 0) {
				return ['al', 'albert', 'david'];
			}
		}

		return cp.getMarbleUsernamesConfig();		// fallback use config file
	};

	// get this org's msp id
	helper.getOrgsMSPid = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Org key not passed');
		}
		else {
			if (cp.creds.organizations && cp.creds.organizations[key]) {
				return cp.creds.organizations[key].mspid;
			}
			else {
				throw new Error('Org key not found.', key);
			}
		}
	};

	// get an admin private key PEM certificate
	helper.getAdminPrivateKeyPEM = function (orgName) {
		if (orgName && cp.creds.organizations && cp.creds.organizations[orgName]) {
			if (!cp.creds.organizations[orgName].adminPrivateKey) {
				if (!cp.creds.organizations[orgName]['x-certJson'] || !cp.creds.organizations[orgName]['x-certJson'].path) {
					throw new Error('Admin private key is not found in the creds json file: ' + orgName);
				} else {
					const obj = getCryptoFromCertJson(cp.creds.organizations[orgName]['x-certJson'].path);
					return cp.loadPem(obj.adminPrivateKey);
				}
			} else {
				return cp.loadPem(cp.creds.organizations[orgName].adminPrivateKey);
			}
		}
		else {
			throw new Error('Cannot find org.', orgName);
		}
	};

	// get an admin's signed cert PEM
	helper.getAdminSignedCertPEM = function (orgName) {
		if (orgName && cp.creds.organizations && cp.creds.organizations[orgName]) {
			if (!cp.creds.organizations[orgName].signedCert) {
				if (!cp.creds.organizations[orgName]['x-certJson'] || !cp.creds.organizations[orgName]['x-certJson'].path) {
					throw new Error('Admin certificate is not found in the creds json file: ' + orgName);
				} else {
					const obj = getCryptoFromCertJson(cp.creds.organizations[orgName]['x-certJson'].path);
					return cp.loadPem(obj.signedCert);
				}
			} else {
				return cp.loadPem(cp.creds.organizations[orgName].signedCert);
			}
		}
		else {
			throw new Error('Cannot find org.', orgName);
		}
		return null;
	};

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

	return helper;
};

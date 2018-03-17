// ============================================================================================================================
// 													Get org fields from connection profile data
// ============================================================================================================================
var fs = require('fs');
var path = require('path');

module.exports = function (cp, logger) {
	var helper = {};

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

	// find the org name in the client field
	helper.getClientOrg = function () {
		if (cp.creds.client && cp.creds.client.organization) {
			return cp.creds.client.organization;
		}
		logger.error('Org not found.');
		return null;
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

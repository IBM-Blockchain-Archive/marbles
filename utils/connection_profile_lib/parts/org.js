// ============================================================================================================================
// 													Get org fields from connection profile data
// ============================================================================================================================
var fs = require('fs');
var os = require('os');
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
				if (!cp.creds.organizations[orgName]['x-adminKeyStore'] || !cp.creds.organizations[orgName]['x-adminKeyStore'].path) {
					throw new Error('Admin private key is not found in the creds json file: ' + orgName);
				} else {
					const path2key = getCryptoFromCP(cp.creds.organizations[orgName]['x-adminKeyStore'].path);
					if (path2key) {
						return cp.loadPem({ path: path2key });
					}
				}
			} else {
				return cp.loadPem(cp.creds.organizations[orgName].adminPrivateKey);
			}
		}
		throw new Error('Cannot find org.', orgName);
	};

	// get an admin's signed cert PEM
	helper.getAdminSignedCertPEM = function (orgName) {
		if (orgName && cp.creds.organizations && cp.creds.organizations[orgName]) {
			if (!cp.creds.organizations[orgName].signedCert) {
				if (!cp.creds.organizations[orgName]['x-adminCert'] || !cp.creds.organizations[orgName]['x-adminCert'].path) {
					throw new Error('Admin certificate is not found in the creds json file: ' + orgName);
				} else {
					return cp.loadPem({ path: cp.creds.organizations[orgName]['x-adminCert'].path });
				}
			} else {
				return cp.loadPem(cp.creds.organizations[orgName].signedCert);
			}
		}
		throw new Error('Cannot find org.', orgName);
	};

	// return path to private key from kvs
	function getCryptoFromCP(kvsPath, cb) {
		let kvs_path = kvsPath;
		if (kvsPath.indexOf('$HOME') >= 0) {
			kvs_path = kvsPath.replace('$HOME', os.homedir()).substr(1);
		}
		if (fs.existsSync(kvs_path)) {							// check if folder exists
			const entries = fs.readdirSync(kvs_path);
			for (let i in entries) {
				const entry_path = path.join(kvs_path, entries[i]);
				if (fs.lstatSync(entry_path).isFile()) {		// found a file, hope its the key/cert we need
					return entry_path;
				}
			}
		}
		return null;
	}

	return helper;
};

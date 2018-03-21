var winston = require('winston');								//logger module
var path = require('path');
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
		new (winston.transports.Console)({ colorize: true }),
	]
});

// --- Set Details Here --- //
var config_file = 'marbles_local.json';							//set config file name
var chaincode_id = 'marbles01';									//use same ID during the PREVIOUS instantiate proposal
var chaincode_ver = 'v5';										//use same version during the INSTALL proposal

//  --- Use (optional) arguments if passed in --- //
var args = process.argv.slice(2);
if (args[0]) {
	config_file = args[0];
	logger.debug('Using argument for config file', config_file);
}
if (args[1]) {
	chaincode_id = args[1];
	logger.debug('Using argument for chaincode id');
}
if (args[2]) {
	chaincode_ver = args[2];
	logger.debug('Using argument for chaincode version');
}

var cp = require(path.join(__dirname, '../utils/connection_profile_lib/index.js'))(config_file, logger);			//set the config file name here
var fcw = require(path.join(__dirname, '../utils/fc_wrangler/index.js'))({ block_delay: cp.getBlockDelay() }, logger);

console.log('---------------------------------------');
logger.info('Lets upgrade some chaincode -', chaincode_id, chaincode_ver);
console.log('---------------------------------------');
logger.warn('Note: the chaincode "' + chaincode_id + '" should have been installed AND instantiated before running this script');
let msg = `Note: the chaincode "` + chaincode_id + `" and version "` + chaincode_ver + `
			should have been installed before running this script`;
logger.warn(msg);

logger.info('First we enroll');
fcw.enrollWithAdminCert(cp.makeEnrollmentOptionsUsingCert(), function (enrollErr, enrollResp) {
	if (enrollErr != null) {
		logger.error('error enrolling', enrollErr, enrollResp);
	} else {
		console.log('---------------------------------------');
		logger.info('Now we upgrade');
		console.log('---------------------------------------');

		const channel = cp.getChannelId();
		const first_peer = cp.getFirstPeerName(channel);
		var opts = {
			peer_urls: [cp.getPeersUrl(first_peer)],
			channel_id: cp.getChannelId(),
			chaincode_id: chaincode_id,
			chaincode_version: chaincode_ver,
			peer_tls_opts: cp.getPeerTlsCertOpts(first_peer),
			cc_args: ['666666'],
		};
		fcw.upgrade_chaincode(enrollResp, opts, function (err, resp) {
			console.log('---------------------------------------');
			logger.info('Upgrade done. Errors:', (!err) ? 'nope' : err);
			console.log('---------------------------------------');
		});
	}
});

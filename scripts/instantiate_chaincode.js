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
var chaincode_id = 'marbles';									//use same ID during the INSTALL proposal
var chaincode_ver = 'v4';										//use same version during the INSTALL proposal

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

var helper = require(path.join(__dirname, '../utils/helper.js'))(config_file, logger);			//set the config file name here
var fcw = require(path.join(__dirname, '../utils/fc_wrangler/index.js'))({ block_delay: helper.getBlockDelay() }, logger);

console.log('---------------------------------------');
logger.info('Lets instantiate some chaincode -', chaincode_id, chaincode_ver);
console.log('---------------------------------------');
logger.warn('Note: the chaincode should have been installed before running this script');

logger.info('First we enroll');
fcw.enrollWithAdminCert(helper.makeEnrollmentOptionsUsingCert(), function (enrollErr, enrollResp) {
	if (enrollErr != null) {
		logger.error('error enrolling', enrollErr, enrollResp);
	} else {
		console.log('---------------------------------------');
		logger.info('Now we instantiate');
		console.log('---------------------------------------');

		const channel = helper.getChannelId();
		const first_peer = helper.getFirstPeerName(channel);
		var opts = {
			peer_urls: [helper.getPeersUrl(first_peer)],
			channel_id: helper.getChannelId(),
			chaincode_id: chaincode_id,
			chaincode_version: chaincode_ver,
			cc_args: ['12345'],
			peer_tls_opts: helper.getPeerTlsCertOpts(first_peer)
		};
		fcw.instantiate_chaincode(enrollResp, opts, function (err, resp) {
			console.log('---------------------------------------');
			logger.info('Instantiate done. Errors:', (!err) ? 'nope' : err);
			console.log('---------------------------------------');
		});
	}
});

var winston = require('winston');								//logger module
var path = require('path');

// --- Set Our Things --- //
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
		new (winston.transports.Console)({ colorize: true }),
	]
});
var helper = require(path.join(__dirname, '../utils/helper.js'))('marbles_local.json', logger);			//set the config file name here
var fcw = require(path.join(__dirname, '../utils/fc_wrangler/index.js'))({ block_delay: helper.getBlockDelay() }, logger);

console.log('---------------------------------------');
logger.info('Lets upgrade some chaincode -', helper.getChaincodeId(), helper.getChaincodeVersion());
console.log('---------------------------------------');
logger.warn('Note: the chaincode "' + helper.getChaincodeId() + '" should have been installed AND instantiated before running this script');
let msg = `Note: the chaincode "` + helper.getChaincodeId() + `" and version "` + helper.getChaincodeVersion() + `
			should have been installed before running this script`;
logger.warn(msg);

logger.info('First we enroll');
fcw.enrollWithAdminCert(helper.makeEnrollmentOptionsUsingCert(0), function (enrollErr, enrollResp) {
	if (enrollErr != null) {
		logger.error('error enrolling', enrollErr, enrollResp);
	} else {
		console.log('---------------------------------------');
		logger.info('Now we upgrade');
		console.log('---------------------------------------');

		const channel = helper.getChannelId();
		const first_peer = helper.getFirstPeerName(channel);
		var opts = {
			peer_urls: [helper.getPeersUrl(first_peer)],
			path_2_chaincode: 'marbles',										//same path used to install it
			channel_id: helper.getChannelId(),									//same ID used that was used in PREVIOUS instantiate
			chaincode_id: helper.getChaincodeId(),								//same ID used that was used in PREVIOUS instantiate
			chaincode_version: helper.getChaincodeVersion(),
			peer_tls_opts: helper.getPeerTlsCertOpts(first_peer)
		};
		fcw.upgrade_chaincode(enrollResp, opts, function (err, resp) {
			console.log('---------------------------------------');
			logger.info('Upgrade done. Errors:', (!err) ? 'nope' : err);
			console.log('---------------------------------------');
		});
	}
});

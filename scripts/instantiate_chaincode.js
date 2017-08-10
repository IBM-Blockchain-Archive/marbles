var winston = require('winston');								//logginer module
var path = require('path');

// --- Set Our Things --- //
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
		new (winston.transports.Console)({ colorize: true }),
	]
});
var helper = require(path.join(__dirname, '../utils/helper.js'))('marbles3.json', logger);			//set the config file name here
var fcw = require(path.join(__dirname, '../utils/fc_wrangler/index.js'))({ block_delay: helper.getBlockDelay() }, logger);

console.log('---------------------------------------');
logger.info('Lets instantiate some chaincode -', helper.getChaincodeId(), helper.getChaincodeVersion());
console.log('---------------------------------------');
logger.warn('Note: the chaincode should have been installed before running this script');

logger.info('First we enroll');
fcw.enroll(helper.makeEnrollmentOptions(0), function (enrollErr, enrollResp) {
	if (enrollErr != null) {
		logger.error('error enrolling', enrollErr, enrollResp);
	} else {
		console.log('---------------------------------------');
		logger.info('Now we instantiate');
		console.log('---------------------------------------');

		var opts = {
			peer_urls: [helper.getPeersUrl(0)],
			path_2_chaincode: 'marbles',										//same path used to install it
			channel_id: helper.getChannelId(),
			chaincode_id: helper.getChaincodeId(),
			chaincode_version: helper.getChaincodeVersion(),
			cc_args: ['12345'],
			peer_tls_opts: helper.getPeerTLScertOpts(0)
		};
		fcw.instantiate_chaincode(enrollResp, opts, function (err, resp) {
			console.log('---------------------------------------');
			logger.info('Instantiate done. Errors:', (!err) ? 'nope' : err);
			console.log('---------------------------------------');
		});
	}
});

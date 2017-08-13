var winston = require('winston');								//logginer module
var path = require('path');

// --- Set Our Things --- //
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
		new (winston.transports.Console)({ colorize: true }),
	]
});

var args = process.argv.slice(2);
if (args[0]) {
	logger.info('Config file passed in as argument: ' + args[0]);
	logger.info('Using ' + args[0] + ' as the config file');
	config_file = args[0];
} else {
	logger.info('Using default config');
	config_file = 'marbles_local.json';
}

var helper = require(path.join(__dirname, '../utils/helper.js'))(config_file, logger);			//set the config file name here
var fcw = require(path.join(__dirname, '../utils/fc_wrangler/index.js'))({ block_delay: helper.getBlockDelay() }, logger);

console.log('---------------------------------------');
logger.info('Lets install some chaincode -', helper.getChaincodeId(), helper.getChaincodeVersion());
console.log('---------------------------------------');

logger.info('First we enroll');
fcw.enrollWithAdminCert(helper.makeEnrollmentOptionsUsingCert(0), function (enrollErr, enrollResp) {
	if (enrollErr != null) {
		logger.error('error enrolling', enrollErr, enrollResp);
	} else {
		console.log('---------------------------------------');
		logger.info('Now we install');
		console.log('---------------------------------------');

		var opts = {
			peer_urls: [helper.getPeersUrl(0)],
			path_2_chaincode: 'marbles',				//path to chaincode from <marblesroot>/chaincode/src/
			chaincode_id: helper.getChaincodeId(),
			chaincode_version: helper.getChaincodeVersion(),
			peer_tls_opts: helper.getPeerTLScertOpts(0)
		};
		fcw.install_chaincode(enrollResp, opts, function (err, resp) {
			console.log('---------------------------------------');
			logger.info('Install done. Errors:', (!err) ? 'nope' : err);
			console.log('---------------------------------------');
		});
	}
});

//-------------------------------------------------------------------
// Deploy Chaincode
//-------------------------------------------------------------------
var path = require('path');
var fs = require('fs');

module.exports = function (logger) {
	var common = require(path.join(__dirname, './common.js'))(logger);
	var Peer = require('fabric-client/lib/Peer.js');
	var EventHub = require('fabric-client/lib/EventHub.js');
	var utils = require('fabric-client/lib/utils.js');
	var deploy_cc = {};

	//-------------------------------------------------------------------
	// Deploy Chaincode
	//-------------------------------------------------------------------
	/*
		options: {
					peer_urls: [array of peer urls],
					path_2_chaincode: "path to chaincode from proj root",
					channel_id: "channel id",
					chaincode_id: "chaincode id",
					endorsed_hook: function(error, res){},
					ordered_hook: function(error, res){},
					cc_args: ["argument 1"],
					deploy_wait: 30000
		}
	*/
	deploy_cc.deploy_chaincode = function (chain, options, cb) {
		logger.debug('\nDeploying Chaincode\n');
		var eventhub;

		if (!fs.existsSync('/tmp')) {								//help out fabric-client sdk (it will need this folder on local fs)
			fs.mkdirSync('/tmp');
		}

		try {
			for (var i in options.peer_urls) {
				chain.addPeer(new Peer(options.peer_urls[i]));
			}
		}
		catch (e) {
			//might error if peer already exists, but we don't care
		}

		// fix GOPATH - does not need to be real!
		process.env.GOPATH = path.join(__dirname, '../chaincode');

		// send proposal to endorser
		var request = {
			chaincodePath: options.path_2_chaincode,		//rel path from /chaincode/src/ to chaincode folder ex: './marbles'
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			txId: utils.buildTransactionID({ length: 12 }),
			nonce: utils.getNonce(),
			fcn: 'init',
			args: options.cc_args,
			'dockerfile-contents': `from hyperledger/fabric-ccenv\n 
									COPY . $GOPATH/src/build-chaincode/\n  
									WORKDIR $GOPATH\n\n 
									RUN go install build-chaincode && mv $GOPATH/bin/build-chaincode $GOPATH/bin/%s`
		};

		// Setup EventHub
		eventhub = new EventHub();
		eventhub.setPeerAddr(options.event_url);
		eventhub.connect();

		chain.sendDeploymentProposal(request
			//nothing
		).then(
			function (results) {

				//check response
				var request = common.check_proposal_res(results, options.endorsed_hook);
				return chain.sendTransaction(request);
			}
			).then(
			function (response) {

				// All good
				if (response.status === 'SUCCESS') {
					logger.debug('[fcw] Successfully ordered deployment endorsement.');

					// Call optional order hook
					if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

					var watchdog = setTimeout(() => {
						var msg = '[fcw] Failed to receive block event within the timeout period';
						logger.error(msg);
						throw msg;
					}, 60000);

					// Wait for block event
					eventhub.registerTxEvent(request.txId.toString(), (tx) => {
						logger.debug('---------------------------------------------------------------------------\n');
						logger.info('[fcw] The chaincode deploy tx block committed successfully\n\n');
						clearTimeout(watchdog);
						//eventhub.disconnect();								//dsh this seems to crash the application...

						if (cb) return cb(null);
						else return;
					});
				}

				// No good
				else {
					logger.error('[fcw] Failed to order the deployment endorsement.');
					throw response;
				}
			}
			).catch(
			function (err) {
				logger.error('[fcw] Error in deploy catch block', typeof err, err);
				var formatted = common.format_error_msg(err);

				if (cb) return cb(formatted, null);
				else return;
			}
		);
	};

	return deploy_cc;
};


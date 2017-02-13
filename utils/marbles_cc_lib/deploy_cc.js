//-------------------------------------------------------------------
// Marbles Chaincode - Deploy Chaincode
//-------------------------------------------------------------------
var path = require('path');
var fs = require('fs');
var Peer = require('fabric-client/lib/Peer.js');
//var EventHub = require('fabric-client/lib/EventHub.js');
var utils = require('fabric-client/lib/utils.js');

module.exports = function (chain, logger) {
	var deploy_cc = {};
	var common = require('./common.js')();

	//-------------------------------------------------------------------
	// Check if Chaincode Is Already Deployed
	//-------------------------------------------------------------------
	deploy_cc.check_if_already_deployed = function (webUser, options, cb) {
		// send query
		var request = {
			targets: options.peer_urls,
			chaincodeId : options.chaincode_id,
			fcn: 'read',
			args: ['_ownerindex']
		};
		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){									//error
					console.log('Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'});
				}
				else{																//success
					for(var i in response_payloads) {								//print each peer's payload
						console.log('Peer' + i, 'payload says:', response_payloads[i].toString('utf8'));
					}
					console.log('---------------------------------------------------------------------------');
					if(cb) return cb(null);
				}
			},
			function(err) {															//error
				console.log('Failed to send query due to error: ' + err.stack ? err.stack : err);
			}
		).catch(
			function(err) {															//error
				console.log('Failed, in catch block?' + err.stack ? err.stack : err);
			}
		);
	};

	//-------------------------------------------------------------------
	// Deploy Chaincode
	//-------------------------------------------------------------------
	deploy_cc.deploy_chaincode = function (chain, options, cb) {
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
			chaincodePath: './marbles',		//rel path from /chaincode/src/ to chaincode folder ex: './marbles'
			chainId: options.channel_id,
			chaincodeId: options.chaincode_id,
			txId: utils.buildTransactionID({ length: 12 }),
			nonce: utils.getNonce(),
			fcn: 'init',
			args: ['99'],
			'dockerfile-contents': `from hyperledger/fabric-ccenv\n 
									COPY . $GOPATH/src/build-chaincode/\n  
									WORKDIR $GOPATH\n\n 
									RUN go install build-chaincode && mv $GOPATH/bin/build-chaincode $GOPATH/bin/%s`
		};

		chain.sendDeploymentProposal(request
			//nothing
		).then(
			function(results) {
				//check response
				var request = common.check_proposal_res(results, options.endorsed_hook);
				return chain.sendTransaction(request);
			}
		).then(
			function(response) {
				if (response.Status === 'SUCCESS') {
					console.log('Successfully ordered deployment endorsement.');
					setTimeout(function(){
						console.log('\n\n---------------------------------------------------------------------------');
						console.log('Chaincode deployed successfully\n\n');
						if(cb) return cb(null);
						else return;
					}, 25000);
				}
				else{
					console.log('Failed to order the deployment endorsement.');
				}
			}
		).catch(
			function(err){
				console.log('Failed to deploy, in catch block');
				if(cb) return cb(err);
			}
		);
	};

	return deploy_cc;
};


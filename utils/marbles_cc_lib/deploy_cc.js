//var async = require('async');
//var path = require('path');
//var url = require('url');

module.exports = function (chain, chaincode_id, logger) {
	var hfc = require('../fabric-sdk-node2/index.js');
	var deploy_cc = {};
	var helper = require(__dirname + '/../helper.js')();

	//-------------------------------------------------------------------
	// Check if Chaincode Is Already Deployed
	//----------------------------------------------------
	deploy_cc.check_if_already_deployed = function (webUser, cb) {
		// send query
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0)), hfc.getPeer(helper.getPeersUrl(1))],
			chaincodeId : chaincode_id,
			fcn: 'read',
			args: ['_marbleindex']
		};
		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'});
				}
				else{
					for(var i in response_payloads) {		//pray to the gods that i===peer_id and they never move
						console.log('Peer' + i, 'payload says:', response_payloads[i].toString('utf8'));
					}
					console.log('---------------------------------------------------------------------------');
					if(cb) return cb(null);
				}
			},
			function(err) {
				console.log('Failed to send query due to error: ' + err.stack ? err.stack : err);
			}
		).catch(
			function(err) {
				console.log('Failed, in catch block?' + err.stack ? err.stack : err);
			}
		);
	};

	//-------------------------------------------------------------------
	// Deploy Chaincode
	//-------------------------------------------------------------------
	deploy_cc.deploy_chaincode = function (webUser, cb) {
		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer(helper.getPeersUrl(0)), hfc.getPeer(helper.getPeersUrl(1))],
			chaincodePath: './chaincode',
			chaincodeId: chaincode_id,
			fcn: 'init',
			args: ['99'],
			'dockerfile-contents' :
			'from hyperledger/fabric-ccenv\n' +
			'COPY . $GOPATH/src/build-chaincode/\n' +
			'WORKDIR $GOPATH\n\n' +
			'RUN go install build-chaincode && mv $GOPATH/bin/build-chaincode $GOPATH/bin/%s'
		};

		webUser.sendDeploymentProposal(request)
		.then(
			function(results) {
				var proposalResponses = results[0];
				//console.log('proposalResponses:'+JSON.stringify(proposalResponses));
				var proposal = results[1];
				if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully sent Proposal and received ProposalResponse: ');
					console.log('\tStatus -', proposalResponses[0].response.status, 'message -', proposalResponses[0].response.message,
						'metadata -', proposalResponses[0].response.payload, 'endorsement signature:', proposalResponses[0].endorsement.signature);
					return webUser.sendTransaction(proposalResponses, proposal);
				} else {
					console.log('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				}
			},
			function(err) {
				console.log('Failed to send deployment proposal due to error: ' + err.stack ? err.stack : err);
			}
		).then(
				function(response) {
					if (response.Status === 'SUCCESS') {
						console.log('Successfully ordered deployment endorsement.');
						console.log(' need to wait now for the committer to catch up');
						return sleep(20000);
					} else {
						console.log('Failed to order the deployment endorsement. Error code: ' + response.status);
					}

				},
				function(err) {
					console.log('Failed to send deployment e due to error: ' + err.stack ? err.stack : err);
				}
		).then(
			function() {
				// send query
				var request = {
					targets: [hfc.getPeer(helper.getPeersUrl(0)), hfc.getPeer(helper.getPeersUrl(1))],
					chaincodeId : chaincode_id,
					fcn: 'read',
					args: ['_marbleindex']
				};
				return webUser.queryByChaincode(request);
			},
			function(err) {
				console.log('Failed to wait-- error: ' + err.stack ? err.stack : err);
			}
		).then(
			function(response_payloads) {
				for(let i = 0; i < response_payloads.length; i++) {
					console.log(response_payloads[i].toString('utf8'),'300','checking query results are correct that user b has 300 now after the move');
				}

				console.log('---------------------------------------------------------------------------');
				console.log('\nChaincode deployed successfully');
				if(cb) return cb(null);
				else return;
			},
			function(err) {
				console.log('Failed to send query due to error: ' + err.stack ? err.stack : err);
			}
		).catch(
			function(err) {
				console.log('Failed, in catch block' + err.stack ? err.stack : err);
			}
		);
	};
	
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	return deploy_cc;
};


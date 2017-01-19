var path = require('path');

module.exports = function (chain, chaincode_id, logger) {
	var deploy_cc = {};

	//-------------------------------------------------------------------
	// Check if Chaincode Is Already Deployed
	//----------------------------------------------------
	deploy_cc.check_if_already_deployed = function (webUser, peerUrls, cb) {
		// send query
		var request = {
			targets: peerUrls,
			chaincodeId : chaincode_id,
			fcn: 'read',
			args: ['_ownerindex']
		};
		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'});
				}
				else{
					for(var i in response_payloads) {
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
	deploy_cc.deploy_chaincode = function (webUser, peerUrls, cb) {
		// send proposal to endorser
		var request = {
			targets: peerUrls,
			chaincodePath: screwy_path('./chaincode'),								//path from marbles root to marbles chaincode folder
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
				var proposal = results[1];
				if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully sent Proposal and received ProposalResponse: ');
					console.log('\tStatus -', proposalResponses[0].response.status, 'message -', proposalResponses[0].response.message);
					console.log('metadata -', proposalResponses[0].response.payload, 'endorsement signature:', proposalResponses[0].endorsement.signature);
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else{
					console.log('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				}
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

	//-----------------------------------------------------------------------------------------------------------------
	// Get the current directory's path and check to make sure the GOPATH exists in that path. If so the GOPATH is
	// removed to create the hfc_path. The chaincode folder, which was passed in, is then appended to the hfc_path
	// and returned as the path to the chaincode folder.
	//-----------------------------------------------------------------------------------------------------------------
	function screwy_path(chaincode_folder) {
			let currentDirectory = path.dirname(require.main.filename);				    //Path to current working directory
			console.log("[debug] currentDirectory: " + currentDirectory);

			if (currentDirectory.indexOf(process.env.GOPATH) === -1) {					//Ensure marbles is in the GOPATH
					let msg = '[Deploy Error] Marbles is not inside your '					//and throw an error if it is not.
							+ 'system GOPATH. Please fix';
					console.log('\n\n' + msg + '\n\n');
					throw msg;
			}
			else {
					let length = process.env.GOPATH.length;									//Length of the GOPATH string

					if (length === 0) {														//Make sure there is a GOPATH.
							let msg = '[Deploy Error] The GOPATH environment variable '			//If not then throw an error.
									+ 'has not been set up. Please fix.';
							console.log('\n\n + msg + \n\n');
							throw msg;
					}
					else if (currentDirectory.indexOf(process.env.GOPATH + '/src/') === -1) {
							let msg = '[Deploy Error] The /src/ folder is not located between '//Make sure /src/ is after GOPATH.
									+ 'the GOPATH and the marbles code. Please fix.';              //If not then throw an error.
							console.log('\n\n + msg + \n\n');
							throw msg;
					}
					else {
							let hfc_path = process.env.PWD.substring(length + 5);				//Remove the GOPATH from the
							console.log('[debug] hfc_path ' + hfc_path);						//current working directory

							let ret = path.join(hfc_path, chaincode_folder);					//Append chaincode directory to
							console.log('[debug] hfc compatible path to chaincode dir', ret);	//the current working directory.
							return ret;
					}
			}
	}

	return deploy_cc;
};

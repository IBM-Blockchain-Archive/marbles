//-------------------------------------------------------------------
// Marbles Chaincode - Deploy Chaincode
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (chain, logger) {
	var deploy_cc = {};
	
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
	deploy_cc.deploy_chaincode = function (webUser, options, cb) {
		// send proposal to endorser
		var request = {
			targets: options.peer_urls,
			chaincodePath: screwy_path('./chaincode'),								//path from marbles root to marbles chaincode folder
			chaincodeId: options.chaincode_id,
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

	//get the path from GOPATH to marble's chaincode folder (b/c hfc expects the path to be this way)
	//hfc builds the path with: projDir = goPath + '/src/' + chaincodePath; - therefore chaincodePath must reference from GOPATH/src/
	function screwy_path(chaincode_folder){
		var gpath = process.env.GOPATH;
		if(!process.env.GOPATH) {
			console.log('\n\n\n WARNING: GOPATH is not set! \n please set GOPATH to deploy chaincode\n\n\n');
			

			
		} else {

			var pos = __dirname.indexOf(path.join(process.env.GOPATH, '/src/'));
		
			if(pos === -1){
				var msg = '[Deploy Error] Marbles is not inside your system GOPATH, please fix';
				console.log('\n\n' + msg + '\n\n');
				throw msg;
			}
			else{
				var removedGo = __dirname.substring(process.env.GOPATH.length + 5);		//remove GOPATH/src part from __dirname
				console.log('[debug] removedGo from marbles path', removedGo);

				var temp = __dirname.split('\\').join('/');								//convert windows path slashes
				var parsed = temp.split('/');
				var root_of_marbles = parsed[parsed.length-3];							//find name of marbles root dir
				console.log('[debug] root_of_marbles path', root_of_marbles);

				var pos3 = removedGo.indexOf(root_of_marbles);
				var hfc_path = removedGo.substring(0, pos3 + root_of_marbles.length);	//get path from GOPATH to marbles root dir
			
				var ret = path.join(hfc_path, chaincode_folder);						//path to chaincode dir
				console.log('[debug] hfc compatible path to chaincode dir', ret);

				return ret;
				//var debug = process.env.GOPATH + '/src/' + ret; 						//<- this is what hfc will build..
				//console.log('debug', debug);
			}
		}
	}

	return deploy_cc;
};


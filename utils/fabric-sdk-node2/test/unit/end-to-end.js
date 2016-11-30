/**
 * Copyright 2016 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// This is an end-to-end test that focuses on exercising all parts of the fabric APIs
// in a happy-path scenario
'use strict';

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);

var path = require('path');

var hfc = require('../..');
var util = require('util');
var grpc = require('grpc');
var testUtil = require('./util.js');
var utils = require('../../lib/utils.js');

var chain = hfc.newChain('testChain-e2e');
var webUser;
var chaincode_id = 'mycc1';

testUtil.setupChaincodeDeploy();

// need to override the default key size 384 to match the member service backend
// otherwise the client will not be able to decrypt the enrollment challenge
utils.setConfigSetting('crypto-keysize', 256);

// need to override the default hash algorithm (SHA3) to SHA2 (aka SHA256 when combined
// with the key size 256 above), in order to match what the peer and COP use
utils.setConfigSetting('crypto-hash-algo', 'SHA2');

chain.setKeyValueStore(hfc.newKeyValueStore({
	path: testUtil.KVS
}));

chain.setMemberServicesUrl('http://192.168.99.100:8888');
chain.setOrderer('grpc://192.168.99.100:5151');

test('End-to-end flow of chaincode deploy, transaction invocation, and query', function(t) {
	chain.enroll('admin', 'adminpw')
	.then(
		function(admin) {
			t.pass('Successfully enrolled user \'admin\'');
			webUser = admin;

			// send proposal to endorser
			var request = {
				targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
				chaincodePath: testUtil.CHAINCODE_PATH,
				chaincodeId: chaincode_id,
				fcn: 'init',
				args: ['a', '100', 'b', '200'],
				'dockerfile-contents' :
				'from hyperledger/fabric-ccenv\n' +
				'COPY . $GOPATH/src/build-chaincode/\n' +
				'WORKDIR $GOPATH\n\n' +
				'RUN go install build-chaincode && mv $GOPATH/bin/build-chaincode $GOPATH/bin/%s'
			};

			return admin.sendDeploymentProposal(request);
		},
		function(err) {
			t.fail('Failed to enroll user \'admin\'. ' + err);
			t.end();
		}
	).then(
		function(results) {
			var proposalResponses = results[0];
			//console.log('proposalResponses:'+JSON.stringify(proposalResponses));
			var proposal = results[1];
			if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
				t.pass(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));
				return webUser.sendTransaction(proposalResponses, proposal);
			} else {
				t.fail('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				t.end();
			}
		},
		function(err) {
			t.fail('Failed to send deployment proposal due to error: ' + err.stack ? err.stack : err);
			t.end();
		}
	).then(
			function(response) {
				if (response.Status === 'SUCCESS') {
					t.pass('Successfully ordered deployment endorsement.');
					console.log(' need to wait now for the committer to catch up');
					return sleep(20000);
				} else {
					t.fail('Failed to order the deployment endorsement. Error code: ' + response.status);
					t.end();
				}

			},
			function(err) {
				t.fail('Failed to send deployment e due to error: ' + err.stack ? err.stack : err);
				t.end();
			}
	).then(
		function() {
			// send proposal to endorser
			var request = {
				targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
				chaincodeId : chaincode_id,
				fcn: 'invoke',
				args: ['move', 'a', 'b','100']
			};
			return webUser.sendTransactionProposal(request);
		},
		function(err) {
			t.fail('Failed to wait due to error: ' + err.stack ? err.stack : err);
			t.end();
		}
	).then(
		function(results) {
			var proposalResponses = results[0];
			var proposal = results[1];
			if (proposalResponses[0].response.status === 200) {
				t.pass('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
				return webUser.sendTransaction(proposalResponses, proposal);
			} else {
				t.fail('Failed to obtain transaction endorsement. Error code: ' + status);
				t.end();
			}
		},
		function(err) {
			t.fail('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
			t.end();
		}
	).then(
		function(response) {
			if (response.Status === 'SUCCESS') {
				t.pass('Successfully ordered endorsement transaction.');
				console.log(' need to wait now for the committer to catch up');
				return sleep(20000);
			} else {
				t.fail('Failed to order the endorsement of the transaction. Error code: ' + response.status);
				t.end();
			}
		},
		function(err) {
			t.fail('Failed to send transaction proposal due to error: ' + err.stack ? err.stack : err);
			t.end();
		}
	).then(
		function() {
			// send query
			var request = {
				targets: [hfc.getPeer('grpc://192.168.99.100:7051'), hfc.getPeer('grpc://192.168.99.100:7056')],
				chaincodeId : chaincode_id,
				fcn: 'invoke',
				args: ['query','b']
			};
			return webUser.queryByChaincode(request);
		},
		function(err) {
			t.fail('Failed to wait-- error: ' + err.stack ? err.stack : err);
			t.end();
		}
	).then(
		function(response_payloads) {
			for(let i = 0; i < response_payloads.length; i++) {
				t.equal(response_payloads[i].toString('utf8'),'300','checking query results are correct that user b has 300 now after the move');
			}
			t.end();
		},
		function(err) {
			t.fail('Failed to send query due to error: ' + err.stack ? err.stack : err);
			t.end();
		}
	).catch(
		function(err) {
			t.fail('Failed to end to end test with error:' + err.stack ? err.stack : err);
			t.end();
		}
	);
});

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


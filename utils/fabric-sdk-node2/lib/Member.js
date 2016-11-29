/*
 Copyright 2016 IBM All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the 'License');
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

	  http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an 'AS IS' BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

'use strict';

var api = require('./api.js');
var util = require('util');
var fs = require('fs');
var Peer = require('./Peer.js');
var sdkUtils = require('./utils.js');
var grpc = require('grpc');
var settle = require('promise-settle');
var crypto = require('crypto');

var _ccProto = grpc.load(__dirname + '/protos/peer/chaincode.proto').protos;
var _ccProposalProto = grpc.load(__dirname + '/protos/peer/chaincode_proposal.proto').protos;
var _ccTransProto = grpc.load(__dirname + '/protos/peer/chaincode_transaction.proto').protos;
var _transProto = grpc.load(__dirname + '/protos/peer/fabric_transaction.proto').protos;
var _headerProto = grpc.load(__dirname + '/protos/peer/fabric_transaction_header.proto').protos;
var _proposalProto = grpc.load(__dirname + '/protos/peer/fabric_proposal.proto').protos;
var _responseProto = grpc.load(__dirname + '/protos/peer/fabric_proposal_response.proto').protos;
var _commonProto = grpc.load(__dirname + '/protos/common/common.proto').common;

var logger = sdkUtils.getLogger('Member.js');

/**
 * Represents an authenticated user of the application or an entity used by a Peer node.
 * A member can be in any of these following states:
 *
 * - unregistered: the user has successfully authenticated to the application but has not been
 * added to the user registry maintained by the member services
 *
 * - registered but un-enrolled: the use has been added to the user registry and assigned a member ID
 * with a one-time password, but it has not been enrolled
 *
 * - enrolled: the user has used the one-time password to exchange for an Enrollment Certificate (ECert)
 * which can be used to identify him/herself to the member services
 *
 * @class
 */
var Member = class {

	/**
	 * Constructor for a member.
	 *
	 * @param {string} cfg - The member name or registration request.
	 * @param {Chain} chain - The {@link Chain} object associated with this member.
	 */
	constructor(cfg, chain) {
		if (util.isString(cfg)) {
			this._name = cfg;
			this._roles = null; //string[]
			this._affiliation = '';
		} else if (util.isObject(cfg)) {
			var req = cfg;
			this._name = req.enrollmentID || req.name;
			this._roles = req.roles || ['fabric.user'];
			this._affiliation = req.affiliation;
		}

		this._chain = chain;
		this._memberServices = chain.getMemberServices();
		this._keyValStore = chain.getKeyValueStore();
		this._keyValStoreName = toKeyValueStoreName(this._name);
		this._tcertBatchSize = chain.getTCertBatchSize();

		this._enrollmentSecret = '';
		this._enrollment = null;
		this._tcertGetterMap = {}; //{[s:string]:TCertGetter}
	}

	/**
	 * Get the member name.
	 * @returns {string} The member name.
	 */
	getName() {
		return this._name;
	}

	/**
	 * Get the chain.
	 * @returns {Chain}{@link Chain} The chain.
	 */
	getChain() {
		return this._chain;
	}

	/**
	 * Get the member services.
	 * @returns {MemberServices} The member services.
	 */
	getMemberServices() {
		return this._memberServices;
	}

	/**
	 * Get the roles.
	 * @returns {string[]} The roles.
	 */
	getRoles() {
		return this._roles;
	}

	/**
	 * Set the roles.
	 * @param roles {string[]} The roles.
	 */
	setRoles(roles) {
		this._roles = roles;
	}

	/**
	 * Get the affiliation.
	 * @returns {string} The affiliation.
	 */
	getAffiliation() {
		return this._affiliation;
	}

	/**
	 * Set the affiliation.
	 * @param {string} affiliation The affiliation.
	 */
	setAffiliation(affiliation) {
		this._affiliation = affiliation;
	}

	/**
	 * Get the transaction certificate (tcert) batch size, which is the number of tcerts retrieved
	 * from member services each time (i.e. in a single batch).
	 * @returns {int} The tcert batch size.
	 */
	getTCertBatchSize() {
		if (this._tcertBatchSize === undefined) {
			return this._chain.getTCertBatchSize();
		} else {
			return this._tcertBatchSize;
		}
	}

	/**
	 * Set the transaction certificate (tcert) batch size.
	 * @param {int} batchSize
	 */
	setTCertBatchSize(batchSize) {
		this._tcertBatchSize = batchSize;
	}

	/**
	 * Get the enrollment info.
	 * @returns {Enrollment} The enrollment.
	 */
	getEnrollment() {
		return this._enrollment;
	}

	/**
	 * Determine if this name has been registered.
	 * @returns {boolean} True if registered; otherwise, false.
	 */
	isRegistered() {
		return this._enrollmentSecret !== '';
	}

	/**
	 * Determine if this name has been enrolled.
	 * @returns {boolean} True if enrolled; otherwise, false.
	 */
	isEnrolled() {
		return this._enrollment !== null;
	}

	/**
	 * Register the member.
	 * @param {Object} registrationRequest
	 */
	register(registrationRequest) {
		var self = this;

		return new Promise(function(resolve, reject) {
			if (registrationRequest.enrollmentID !== self.getName()) {
				reject(new Error('registration enrollment ID and member name are not equal'));
			}

			var enrollmentSecret = self._enrollmentSecret;
			if (enrollmentSecret && enrollmentSecret !== '') {
				return resolve(enrollmentSecret);
			} else {
				self._memberServices.register(registrationRequest, self._chain.getRegistrar())
				.then(
					function(enrollmentSecret) {

						self._enrollmentSecret = enrollmentSecret;
						return self.saveState();
					}
				).then(
					function(data) {
						return resolve(self._enrollmentSecret);
					}
				).catch(
					function(err) {
						logger.error('Failed to register user "%s". Error: %s', registrationRequest.enrollmentID, err.stack ? err.stack : err);
						reject(err);
					}
				);
			}
		});
	}

	/**
	 * Enroll the member and return the enrollment results.
	 * @param {Object} enrollmentSecret The password or enrollment secret as returned by register.
	 */
	enroll(enrollmentSecret) {
		var self = this;

		return new Promise(function(resolve, reject) {
			var enrollment = self._enrollment;
			if (self.isEnrolled()) {
				return resolve(self.getEnrollment());
			} else {
				var req = {
					enrollmentID: self.getName(),
					enrollmentSecret: enrollmentSecret
				};

				self._memberServices.enroll(req)
					.then(
						function(enrollment) {

							self._enrollment = enrollment;

							// Save state
							return self.saveState()
								.then(function() {
									return resolve(enrollment);
								});
						}
					).then(
						function(enrollment) {
							return resolve(enrollment);
						}
					).catch(
						function(err) {
							logger.error('Failed to enroll user "%s". Error: %s', self.getName(), err.stack ? err.stack : err);
							reject(err);
						}
					);
			}
		});
	}

	/**
	 * Perform both registration and enrollment.
	 * @param {Object} registrationRequest
	 */
	registerAndEnroll(registrationRequest) {
		var self = this;

		return new Promise(function(resolve, reject) {
			var enrollment = self._enrollment;
			if (enrollment) {
				return resolve(enrollment);
			} else {
				self.register(registrationRequest)
					.then(
						function(enrollmentSecret) {
							return self.enroll(enrollmentSecret);
						}
					).then(
						function(enrollment) {
							return resolve(enrollment);
						}
					).catch(
						function(err) {
							logger.error('Failed to register and enroll user "%s". Error: %s', self.getName(), err.stack ? err.stack : err);
							reject(err);
						}
					);
			}
		});
	}

	/**
	 * Save the state of this member to the key value store.
	 * @returns {Promise} A Promise for a 'true' upon successful save
	 */
	saveState() {
		return this._keyValStore.setValue(this._keyValStoreName, this.toString());
	}

	/**
	 * Restore the state of this member from the key value store (if found).  If not found, do nothing.
	 * @returns {Promise} A Promise for a 'true' upon successful restore
	 */
	restoreState() {
		var self = this;

		return new Promise(function(resolve, reject) {
			self._keyValStore.getValue(self._keyValStoreName)
			.then(
				function(memberStr) {
					if (memberStr) {
						// The member was found in the key value store, so restore the state.
						return self.fromString(memberStr)
						.then(function(data) {
							logger.info('Successfully loaded user "%s" from local key value store', self.getName());
							return resolve(true);
						});
					} else {
						logger.info('User "%s" does not exist in the local key value store. Returning a new instance', self.getName());
						return resolve(true);
					}
				}
			).catch(
				function(err) {
					logger.error('Failed to load user "%s" from local key value store. Error: %s', self.getName(), err.stack ? err.stack : err);
					reject(err);
				}
			);
		});
	}

	/**
	 * Sends the orderer an endorsed proposal.
	 * The caller must use the proposal response returned from the endorser along
	 * with the original proposal request sent to the endorser.
	 *
	 * @param {Array} proposalResponses - An array or single {ProposalResponse} objects containing
	 *        the response from the endorsement
	 * @see fabric_proposal_response.proto
	 * @param {Proposal} chaincodeProposal - A Proposal object containing the original
	 *        request for endorsement(s)
	 * @see fabric_proposal.proto
	 * @returns {Promise} A Promise for a `BroadcastResponse`.
	 *         This will be an acknowledgement from the orderer of successfully submitted transaction.
	 * @see the ./proto/atomicbroadcast/ab.proto
	 */
	sendTransaction(proposalResponses, chaincodeProposal) {
		logger.debug('Member.sendTransaction - start :: chain '+this._chain);

		// Verify that data is being passed in
		if (!proposalResponses) {
			logger.error('Member.sendTransaction - input proposalResponse missing');
			return Promise.reject(new Error('Missing proposalResponse object parameter'));
		}
		if (!chaincodeProposal) {
			logger.error('Member.sendTransaction - input chaincodeProposal missing');
			return Promise.reject(new Error('Missing chaincodeProposal object parameter'));
		}
		// verify that we have an orderer configured
		if(!this._chain.getOrderer()) {
			logger.error('Member.sendTransaction - no orderer defined');
			return Promise.reject(new Error('no Orderer defined'));
		}

		var endorsements = [];
		let proposalResponse = proposalResponses;
		if(Array.isArray(proposalResponses)) {
			for(let i=0; i<proposalResponses.length; i++) {
				// make sure only take the valid responses to set on the consolidated response object
				// to use in the transaction object
				if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
					proposalResponse = proposalResponses[i];
					endorsements.push(proposalResponse.endorsement);
				}
			}
		} else {
			endorsements.push(proposalResponse.endorsement);
		}

//		logger.debug('Member.sendTransaction - proposalResponse %j', proposalResponse);
//		logger.debug('Member.sendTransaction - chaincodePropsoal %j', chaincodeProposal);

		var chaincodeEndorsedAction = new _ccTransProto.ChaincodeEndorsedAction();
		chaincodeEndorsedAction.setProposalResponsePayload(proposalResponse.payload);
		chaincodeEndorsedAction.setEndorsements(endorsements);

		var chaincodeActionPayload = new _ccTransProto.ChaincodeActionPayload();
		chaincodeActionPayload.setAction(chaincodeEndorsedAction);
		chaincodeActionPayload.setChaincodeProposalPayload(chaincodeProposal.payload);

		var transactionAction = new _transProto.TransactionAction();
		transactionAction.setHeader(chaincodeProposal.header);
		transactionAction.setPayload(chaincodeActionPayload.toBuffer());

		var actions = [];
		actions.push(transactionAction);

		var transaction2 = new _transProto.Transaction2();
		transaction2.setActions(actions);

		let header = Member._buildHeader(this._enrollment.certificate, null);

		var payload = new _commonProto.Payload();
		payload.setHeader(header);
		payload.setData(transaction2.toBuffer());

		// building manually or will get protobuf errors on send
		var envelope = {
			payload : payload.toBuffer()
		};

		var orderer = this._chain.getOrderer();
		return orderer.sendBroadcast(envelope);
	}

	/**
	 * Sends a deployment proposal to one or more endorsing peers.
	 *
	 * @param {Object} request - An object containing the following fields:
	 *		<br>`targets` : required - An array or single Endorsing {@link Peer} objects as the targets of the request
	 *		<br>`chaincodePath` : required - String of the path to location of the source code of the chaincode
	 *		<br>`chaincodeId` : required - String of the name of the chaincode
	 *		<br>`fcn` : optional - String of the function to be called on the chaincode once deployed (default 'init')
	 *		<br>`args` : optional - String Array arguments specific to the chaincode being deployed
	 *		<br>`dockerfile-contents` : optional - String defining the
	 * @returns {Promise} A Promise for a `ProposalResponse`
	 * @see /protos/peer/fabric_proposal_response.proto
	 */
	sendDeploymentProposal(request) {
		// Verify that chaincodePath is being passed
		if (!request.chaincodePath || request.chaincodePath === '') {
			logger.error('Invalid input parameter to "sendDeploymentProposal": must have "chaincodePath"');
		  	return Promise.reject(new Error('Missing chaincodePath in Deployment proposal request'));
		}

		if(!request.chaincodeId) {
			logger.error('Missing chaincodeId in the Deployment proposal request');
			return Promise.reject(new Error('Missing chaincodeId in the Deployment proposal request'));
		}

		// verify that the caller has included a peer object
		if(!request.targets) {
			logger.error('Invalid input parameter to "sendDeploymentProposal": must have "targets" object');
			return Promise.reject(new Error('Missing "targets" for the endorsing peer objects in the Deployment proposal request'));
		}

		// args is optional because some chaincode may not need any input parameters during initialization
		if (!request.args) {
			request.args = [];
		}
		let self = this;

		return packageChaincode(request.chaincodePath, request.chaincodeId, request['dockerfile-contents'])
		.then(
			function(data) {
				var targzFilePath = data;

				logger.debug('Member.sendDeployment- Successfully generated chaincode deploy archive and name (%s)', request.chaincodeId);

				// at this point, the targzFile has been successfully generated

				// step 1: construct a ChaincodeSpec
				var args = [];
				args.push(Buffer.from(request.fcn ? request.fcn : 'init', 'utf8'));

				for (let i=0; i<request.args.length; i++)
					args.push(Buffer.from(request.args[i], 'utf8'));

				let ccSpec = {
					type: _ccProto.ChaincodeSpec.Type.GOLANG,
					chaincodeID: {
						name: request.chaincodeId
					},
					ctorMsg: {
						args: args
					}
				};

				// step 2: construct the ChaincodeDeploymentSpec
				let chaincodeDeploymentSpec = new _ccProto.ChaincodeDeploymentSpec();
				chaincodeDeploymentSpec.setChaincodeSpec(ccSpec);

				return new Promise(function(resolve, reject) {
					fs.readFile(targzFilePath, function(err, data) {
						if(err) {
							reject(new Error(util.format('Error reading deployment archive [%s]: %s', targzFilePath, err)));
						} else {
							chaincodeDeploymentSpec.setCodePackage(data);

							// TODO add ESCC/VSCC info here ??????
							let lcccSpec = {
								type: _ccProto.ChaincodeSpec.Type.GOLANG,
								chaincodeID: {
									name: 'lccc'
								},
								ctorMsg: {
									args: [Buffer.from('deploy', 'utf8'), Buffer.from('default', 'utf8'), chaincodeDeploymentSpec.toBuffer()]
								}
							};

							let proposal = self._buildProposal(lcccSpec, 'lccc');
							let signed_proposal = self._signProposal(proposal);

							return Member._sendPeersProposal(request.targets, signed_proposal)
							.then(
								function(responses) {
									resolve([responses, proposal]);
								}
							).catch(
								function(err) {
									logger.error('Sending the deployment proposal failed. Error: %s', err.stack ? err.stack : err);
									reject(err);
								}
							);
						}
					});
				});
			}
		).catch(
			function(err) {
				logger.error('Building the deployment proposal failed. Error: %s', err.stack ? err.stack : err);
				return Promise.reject(err);
			}
		);
	}

	/**
	 * Sends a transaction proposal to one or more endorsing peers.
	 *
	 * @param {Object} request
	 *		<br>`targets` : An array or single Endorsing {@link Peer} objects as the targets of the request
	 *		<br>`chaincodeId` : The id of the chaincode to perform the transaction proposal
	 *		<br>`args` : an array of arguments specific to the chaincode 'innvoke'
	 * @returns {Promise} A Promise for a `ProposalResponse`
	 */
	sendTransactionProposal(request) {
		logger.debug('Member.sendTransactionProposal - start');

		// verify that the caller has included a peer object
		if(!request.targets) {
			logger.error('Missing "targets" endorser peer objects in the Transaction proposal request');
			return Promise.reject(new Error('Missing "targets" for endorser peer objects in the Transaction proposal request'));
		}

		if(!request.chaincodeId) {
			logger.error('Missing chaincodeId in the Transaction proposal request');
			return Promise.reject(new Error('Missing chaincodeId in the Transaction proposal request'));
		}

		// args is not optional because we need for transaction to execute
		if (!request.args) {
			logger.error('Missing arguments in Transaction proposal request');
			return Promise.reject(new Error('Missing arguments in Transaction proposal request'));
		}

		var args = [];
		// leaving this for now... but this call is always an invoke and we are not telling caller to include 'fcn' any longer
		args.push(Buffer.from(request.fcn ? request.fcn : 'invoke', 'utf8'));
		logger.debug('Member.sendTransactionProposal - adding function arg:%s', request.fcn ? request.fcn : 'invoke');

		for (let i=0; i<request.args.length; i++) {
			args.push(Buffer.from(request.args[i], 'utf8'));
			logger.debug('Member.sendTransactionProposal - adding arg:%s', request.args[i]);
		}

		let invokeSpec = {
			type: _ccProto.ChaincodeSpec.Type.GOLANG,
			chaincodeID: {
				name: request.chaincodeId
			},
			ctorMsg: {
				args: args
			}
		};

		let proposal = this._buildProposal(invokeSpec, request.chaincodeId);
		let signed_proposal = this._signProposal(proposal);

		return Member._sendPeersProposal(request.targets, signed_proposal)
		.then(
			function(responses) {
				return Promise.resolve([responses,proposal]);
			}
		).catch(
			function(err) {
				logger.error('Failed Proposal. Error: %s', err.stack ? err.stack : err);
				return Promise.reject(err);
			}
		);
	}

	/**
	 * Sends a proposal to one or more endorsing peers that will be handled by the chaincode.
	 * This request will be presented to the chaincode 'invoke' and must understand
	 * from the arguments that this is a query request. The chaincode must also return
	 * results in the byte array format and the caller will have to be able to decode
	 * these results
	 *
	 * @param {Object} request A JSON object with the following
	 *		<br>targets : An array or single Endorsing {@link Peer} objects as the targets of the request
	 *		<br>chaincodeId : The id of the chaincode to perform the query
	 *		<br>`args` : an array of arguments specific to the chaincode 'innvoke'
	 *             that represent a query invocation on that chaincode
	 * @returns {Promise} A Promise for an array of byte array results from the chaincode on all Endorsing Peers
	 */
	queryByChaincode(request) {
		logger.debug('Member.sendQueryProposal - start');

		return this.sendTransactionProposal(request)
		.then(
			function(results) {
				var responses = results[0];
				var proposal = results[1];
				logger.debug('Member-sendQueryProposal - response %j', responses);
				if(responses && Array.isArray(responses)) {
					var results = [];
					for(let i = 0; i < responses.length; i++) {
						if(responses[i].response && responses[i].response.payload) {
							results.push(responses[i].response.payload);
						}
					}
					return Promise.resolve(results);
				}
				return Promise.reject(new Error('Payload results are missing from the chaincode query'));
			}
		).catch(
			function(err) {
				logger.error('Failed Query by chaincode. Error: %s', err.stack ? err.stack : err);
				return Promise.reject(err);
			}
		);
	}

	// internal utility method to build the header
	/**
	 * @private
	 */
	static _buildHeader(creator, chaincode_id) {
		let chainHeader = new _commonProto.ChainHeader();
		chainHeader.setType(_commonProto.HeaderType.ENDORSER_TRANSACTION);
		chainHeader.setVersion(0); //TODO what should this be
		if(chaincode_id) {
			let chaincodeID = new _ccProto.ChaincodeID();
			chaincodeID.setName(chaincode_id);

			let headerExt = new _ccProposalProto.ChaincodeHeaderExtension();
			headerExt.setChaincodeID(chaincodeID);
//			headerExt.setPayloadVisibility(TODO);

			chainHeader.setChainID(chaincodeID.toBuffer());
			chainHeader.setExtension(headerExt.toBuffer());
		}

		let signatureHeader = new _commonProto.SignatureHeader();

		signatureHeader.setCreator(Buffer.from(creator, 'hex'));
		signatureHeader.setNonce(crypto.randomBytes(sdkUtils.getConfigSetting('nonce-size', 24)));

		let header = new _commonProto.Header();
		header.setSignatureHeader(signatureHeader);
		header.setChainHeader(chainHeader);

		return header;
	}

	// internal utility method to build the proposal
	/**
	 * @private
	 */
	_buildProposal(invokeSpec, chaincode_id) {
		// construct the ChaincodeInvocationSpec
		let cciSpec = new _ccProto.ChaincodeInvocationSpec();
		cciSpec.setChaincodeSpec(invokeSpec);
//		cciSpec.setIdGenerationAlg('');

		let cc_payload = new _ccProposalProto.ChaincodeProposalPayload();
		cc_payload.setInput(cciSpec.toBuffer());
		//cc_payload.setTransient(n/a); // TODO application-level confidentiality related

		let header = Member._buildHeader(this._enrollment.certificate, chaincode_id);

		// proposal -- will switch to building the proposal once the signProposal is used
		let proposal = new _proposalProto.Proposal();
		proposal.setHeader(header.toBuffer());
		proposal.setPayload(cc_payload.toBuffer()); // chaincode proposal payload
		//proposal.setExtension(chaincodeAction); //optional chaincode action

		return proposal;
	}

	 // internal utility method to return one Promise when sending a proposal to many peers
	/**
	 * @private
	 */
	 static _sendPeersProposal(peers, proposal) {
		if(!Array.isArray(peers)) {
			peers = [peers];
		}
		// make function to return an individual promise
		var fn = function peerSendProposal(peer) {
			return new Promise(function(resolve,reject) {
				peer.sendProposal(proposal)
				.then(
					function(result) {
						resolve(result);
					}
				).catch(
					function(err) {
						logger.error('Member-sendPeersProposal - Promise is rejected: %s',err.stack ? err.stack : err);
						return reject(err);
					}
				);
			});
		};
		// create array of promises mapping peers array to peer parameter
		// settle all the promises and return array of responses
		var promises = peers.map(fn);
		var responses = [];
		return settle(promises)
		  .then(function (results) {
			results.forEach(function (result) {
			  if (result.isFulfilled()) {
				logger.debug('Member-sendPeersProposal - Promise is fulfilled: '+result.value());
				responses.push(result.value());
			  } else {
				logger.debug('Member-sendPeersProposal - Promise is rejected: '+result.reason());
				responses.push(result.reason());
			  }
			});
			return responses;
		});
	}

	//internal method to sign a proposal
	/**
	 * @private
	 */
	_signProposal(proposal) {
		let proposal_bytes = proposal.toBuffer();
		// sign the proposal
		let sig = this._chain.cryptoPrimitives.sign(this._enrollment.privateKey, proposal_bytes);
		let signature = new Buffer(sig.toDER());

		logger.debug('_signProposal - signature::'+JSON.stringify(signature));

//		Should be doing the following, but it does not work
//		let signedProposal = new _proposalProto.SignedProposal();
//		signedProposal.setSignature(signature);
//		signedProposal.setProposalBytes(proposal_bytes);

		// build manually for now
		let signedProposal = {
			signature :  signature,
			proposalBytes : proposal_bytes
		};
		return signedProposal;
	}

	/**
	 * Set the current state of this member from a string based JSON object
	 * @return {Member} Promise of the unmarshalled Member object represented by the serialized string
	 */
	fromString(str) {
		logger.debug('Member-fromString --start');
		var state = JSON.parse(str);

		if (state.name !== this.getName()) {
			throw new Error('name mismatch: \'' + state.name + '\' does not equal \'' + this.getName() + '\'');
		}

		this._name = state.name;
		this._roles = state.roles;
		this._affiliation = state.affiliation;
		this._enrollmentSecret = state.enrollmentSecret;
		this._enrollment = state.enrollment;

		var self = this;

		// during serialization (see toString() below) only the key's SKI are saved
		// swap out that for the real key from the crypto provider
		var promise = this._chain.cryptoPrimitives.getKey(this._enrollment.privateKey)
		.then(function(key) {
			self._enrollment.privateKey = key;
			return this;
		});

		return promise;
	}

	/**
	 * Save the current state of this member as a string
	 * @return {string} The state of this member as a string
	 */
	toString() {
		var serializedEnrollment = (this._enrollment) ? Object.assign({}, this._enrollment) : null;
		if (this._enrollment && this._enrollment.privateKey) {
			serializedEnrollment.privateKey = this._enrollment.privateKey.getSKI();
		}

		var state = {
			name: this._name,
			roles: this._roles,
			affiliation: this._affiliation,
			enrollmentSecret: this._enrollmentSecret,
			enrollment: serializedEnrollment
		};

		return JSON.stringify(state);
	}
};

function toKeyValueStoreName(name) {
	return 'member.' + name;
}

function packageChaincode(chaincodePath, chaincodeId, dockerfileContents) {

	// Determine the user's $GOPATH
	let goPath =  process.env['GOPATH'];

	// Compose the path to the chaincode project directory
	let projDir = goPath + '/src/' + chaincodePath;

	// Compose the Dockerfile commands
	if (dockerfileContents === undefined) {
		dockerfileContents = sdkUtils.getConfigSetting('dockerfile-contents', undefined);
	}

	// Substitute the hashStrHash for the image name
	dockerfileContents = util.format(dockerfileContents, chaincodeId);

	return new Promise(function(resolve, reject) {
		// Create a Docker file with dockerFileContents
		let dockerFilePath = projDir + '/Dockerfile';
		fs.writeFile(dockerFilePath, dockerfileContents, function(err) {
			if (err) {
				reject(new Error(util.format('Error writing file [%s]: %s', dockerFilePath, err)));
			} else {
				// Create the .tar.gz file of the chaincode package
				let targzFilePath = '/tmp/deployment-package.tar.gz';
				// Create the compressed archive
				return sdkUtils.generateTarGz(projDir, targzFilePath)
				.then(
					function(targzFilePath) {
						// return both the hash and the tar.gz file path as resolved data
						resolve(targzFilePath);
					}
				).catch(
					function(err) {
						logger.error('Failed to build chaincode package: %s', err.stack ? err.stack : err);
						reject(err);
					}
				);
			}
		});
	});
}

module.exports = Member;

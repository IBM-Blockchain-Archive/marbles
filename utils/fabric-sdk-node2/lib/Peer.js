/*
 Copyright 2016 IBM All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

'use strict';

var api = require('./api.js');
var utils = require('./utils.js');
var Remote = require('./Remote');
var grpc = require('grpc');

var _serviceProto = grpc.load(__dirname + '/protos/peer/fabric_service.proto').protos;

var logger = utils.getLogger('Peer.js');

/**
 * The Peer class represents a peer in the target blockchain network to which
 * HFC sends endorsement proposals, transaction ordering or query requests.
 *
 * @class
 */
var Peer = class extends Remote {

	/**
	 * Constructs a Peer given its endpoint configuration settings.
	 *
	 * @param {string} url The URL with format of "grpcs://host:port".
	 * @param {Object} opts The options for the connection to the peer.
	 */
	constructor(url, opts) {
		super(url, opts);
		logger.info('Peer.const - url: %s options ',url, this._options);
		this._endorserClient = new _serviceProto.Endorser(this._endpoint.addr, this._endpoint.creds, this._options);
	}

	/**
	 * Send an endorsement proposal to an endorser.
	 *
	 * @param {Proposal} proposal A proposal of type Proposal
	 * @see /protos/peer/fabric_proposal.proto
	 * @returns Promise for a ProposalResponse
	 */
	sendProposal(proposal) {
		logger.debug('Peer.sendProposal - Start');
		var self = this;

		// Send the transaction to the peer node via grpc
		// The rpc specification on the peer side is:
		//     rpc ProcessProposal(Proposal) returns (ProposalResponse) {}
		return new Promise(function(resolve, reject) {
			self._endorserClient.processProposal(proposal, function(err, proposalResponse) {
				if (err) {
					logger.error('GRPC client got an error response from the peer. %s', err.stack ? err.stack : err);
					reject(new Error(err));
				} else {
					if (proposalResponse) {
						logger.info('Received proposal response: code - %s', JSON.stringify(proposalResponse.response));
						resolve(proposalResponse);
					} else {
						logger.error('GRPC client failed to get a proper response from the peer.');
						reject(new Error('GRPC client failed to get a proper response from the peer.'));
					}
				}
			});
		});
	}

	/**
	* return a printable representation of this object
	*/
	toString() {
		return ' Peer : {' +
			'url:' + this._url +
		'}';
	}
};

module.exports = Peer;

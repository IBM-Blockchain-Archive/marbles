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

var api = require('../api.js');
var utils = require('../utils');
var jsrsa = require('jsrsasign');
var asn1 = jsrsa.asn1;
var path = require('path');
var grpc = require('grpc');
var _caProto = grpc.load(path.join(__dirname, '../../lib/protos/ca.proto')).protos;

var logger = utils.getLogger('MemberServices.js');

/**
 * This is the default implementation of a member services client.
 *
 * @class
 */
var MemberServices = class extends api.MemberServices {

	/**
	 * constructor
	 *
	 * @param {string} url The endpoint URL for the member services of the form: "grpc://host:port" or "grpcs://host:port"
	 * @param {Object} options for the connection to the member services
	 */
	constructor(url, opts) {
		super(url, opts);

		this._ecaaClient = new _caProto.ECAA(this._endpoint.addr, this._endpoint.creds, this._options);
		this._ecapClient = new _caProto.ECAP(this._endpoint.addr, this._endpoint.creds, this._options);
		this._tcapClient = new _caProto.TCAP(this._endpoint.addr, this._endpoint.creds, this._options);
		this._tlscapClient = new _caProto.TLSCAP(this._endpoint.addr, this._endpoint.creds, this._options);
		this.cryptoPrimitives = utils.getCryptoSuite();

		logger.info('Successfully constructed member service client: endpoint - %j', this._endpoint);
		this._asymmetricKeyAlgo = utils.getConfigSetting('crypto-asymmetric-key-algo');
	}

	getCrypto() {
		return this.cryptoPrimitives;
	}

	/**
	 * Register the member and return an enrollment secret.
	 * @param {Object} req Registration request with the following fields: enrollmentID, roles, registrar
	 * @param {Member} registrar The identity of the registrar (i.e. who is performing the registration)
	 * @returns Promise for the enrollmentSecret
	 * @ignore
	 */
	register(req, registrar) {
		var self = this;

		return new Promise(function(resolve, reject) {
			if (!req.enrollmentID) {
				logger.error('Invalid register request, missing enrollmentID');
				return reject(new Error('missing req.enrollmentID'));
			}

			if (!registrar) {
				logger.error('Invalid register call, missing registrar parameter');
				return reject(new Error('chain registrar is not set'));
			}

			var protoReq = new _caProto.RegisterUserReq();
			protoReq.setId({id:req.enrollmentID});
			protoReq.setRole(MemberServices._rolesToMask(req.roles));
			protoReq.setAffiliation(req.affiliation);

			// Create registrar info
			var protoRegistrar = new _caProto.Registrar();
			protoRegistrar.setId({id:registrar.getName()});
			if (req.registrar) {
				if (req.registrar.roles) {
					protoRegistrar.setRoles(req.registrar.roles);
				}
				if (req.registrar.delegateRoles) {
					protoRegistrar.setDelegateRoles(req.registrar.delegateRoles);
				}
			}

			protoReq.setRegistrar(protoRegistrar);

			// Sign the registration request
			var buf = protoReq.toBuffer();
			var signKey = registrar.getEnrollment().privateKey;
			var sig = self.cryptoPrimitives.sign(signKey, buf);
			protoReq.setSig( new _caProto.Signature(
				{
					type: _caProto.CryptoType[self._asymmetricKeyAlgo],
					r: new Buffer(sig.r.toString()),
					s: new Buffer(sig.s.toString())
				}
			));

			// Send the registration request
			self._ecaaClient.registerUser(protoReq, function (err, token) {
				if (err) {
					logger.error('Received error from server on the register request. %s', err);
					return reject(err);
				} else {
					logger.info('Successfully registered user "%s"', protoReq.getId().id);
					return resolve(token ? token.tok.toString() : null);
				}
			});
		});
	}

	/**
	 * Enroll the member and return an opaque member object.
	 * @param req Enrollment request with the following fields: name, enrollmentSecret
	 * @returns Promise for [Enrollment]{@link module:api.Enrollment}
	 * @ignore
	 */
	enroll(req) {
		var self = this;

		return new Promise(function(resolve, reject) {
			if (!req.enrollmentID) {
				logger.error('Invalid enroll request, missing enrollmentID');
				return reject(new Error('req.enrollmentID is not set'));
			}

			if (!req.enrollmentSecret) {
				logger.error('Invalid enroll request, missing enrollmentSecret');
				return reject(new Error('req.enrollmentSecret is not set'));
			}

			// generate certificate pairs for signing and encryption
			// 1) signature verifcation key
			var spki, spki2, signingKey;
			self.cryptoPrimitives.generateKey()
			.then(
				function(result) {
					signingKey = result;

					spki = new asn1.x509.SubjectPublicKeyInfo(signingKey.getPublicKey()._key);
					// 2) encryption key
					return self.cryptoPrimitives.generateKey();
				})
			.then(
				function(encryptionKey) {
					spki2 = new asn1.x509.SubjectPublicKeyInfo(encryptionKey.getPublicKey()._key);

					// create the proto message
					var eCertCreateRequest = new _caProto.ECertCreateReq();
					var timestamp = utils.generateTimestamp();
					eCertCreateRequest.setTs(timestamp);
					eCertCreateRequest.setId({id: req.enrollmentID});
					eCertCreateRequest.setTok({tok: new Buffer(req.enrollmentSecret)});

					// public signature verification key
					var signPubKey = new _caProto.PublicKey(
						{
							type: _caProto.CryptoType[self._asymmetricKeyAlgo],
							key: new Buffer(spki.getASN1Object().getEncodedHex(), 'hex')
						});
					eCertCreateRequest.setSign(signPubKey);

					// public encryption key
					var encPubKey = new _caProto.PublicKey(
						{
							type: _caProto.CryptoType[self._asymmetricKeyAlgo],
							key: new Buffer(spki2.getASN1Object().getEncodedHex(), 'hex')
						});
					eCertCreateRequest.setEnc(encPubKey);

					self._ecapClient.createCertificatePair(eCertCreateRequest, function (err, eCertCreateResp) {
						if (err) {
							logger.error('Failed to receive challenge response from CA. Error: %s', err.stack ? err.stack : err);
							return reject(err);
						}

						// response from the member service on a certificate request is a challenge to prove
						// possession of the private key. Use the private key to decrypt the token that has
						// been encrypted by the member service with the encryption public key included in the
						// certificate request
						var cipherText = eCertCreateResp.tok.tok;
						var decryptedTokBytes = self.cryptoPrimitives.decrypt(encryptionKey, cipherText);

						eCertCreateRequest.setTok({tok: decryptedTokBytes});
						eCertCreateRequest.setSig(null);

						var buf = eCertCreateRequest.toBuffer();

						var sig = self.cryptoPrimitives.sign(signingKey, buf);

						eCertCreateRequest.setSig(new _caProto.Signature(
							{
								type: _caProto.CryptoType[self._asymmetricKeyAlgo],
								r: new Buffer(sig.r.toString()),
								s: new Buffer(sig.s.toString())
							}
						));
						self._ecapClient.createCertificatePair(eCertCreateRequest, function (err, eCertCreateResp) {
							if (err) {
								logger.error('Failed to receive certificate issuance response from CA. Error: %s', err.stack ? err.stack : err);
								return reject(err);
							}

							var enrollment = new api.Enrollment(signingKey, eCertCreateResp.certs.sign.toString('hex'));

							logger.info('Successfully enrolled user "%s"', eCertCreateRequest.getId().id);
							return resolve(enrollment);
						});
					});
				});
		});
	}


	/*
	 * Utility method to Convert a list of member type names to the role mask currently used by the peer
	 */
	static _rolesToMask(roles /*string[]*/) {
		var mask = 0;

		if (roles) {
			for (var role in roles) {
				switch (roles[role]) {
				case 'client':
					mask |= 1;
					break;       // Client mask
				case 'peer':
					mask |= 2;
					break;       // Peer mask
				case 'validator':
					mask |= 4;
					break;  // Validator mask
				case 'auditor':
					mask |= 8;
					break;    // Auditor mask
				}
			}
		}

		if (mask === 0)
			mask = 1;  // Client

		return mask;
	}

	/**
	* return a printable representation of this object
	*/
	toString() {
		return ' MemberServices : {' +
			'url:' + this._url +
		'}';
	}
};


module.exports = MemberServices;


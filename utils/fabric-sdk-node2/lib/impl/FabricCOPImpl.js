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
var util = require('util');
var jsrsa = require('jsrsasign');
var asn1 = jsrsa.asn1;
var path = require('path');
var http = require('http');
var https = require('https');
var urlParser = require('url');


var logger = utils.getLogger('FabricCOPImpl.js');

/**
 * This is an implementation of the member service client which communicates with the Fabric COP server.
 *
 * @class
 */
var FabricCOPServices = class {

	/**
	 * constructor
	 *
	 * @param {string} url The endpoint URL for Fabric COP services of the form: "http://host:port" or "https://host:port"
	 * @param {Object} options Connection options for Fabric COP services
	 */
	constructor(url, opts) {

		var endpoint = FabricCOPServices._parseURL(url);

		this._fabricCOPClient = new FabricCOPClient({
			protocol: endpoint.protocol,
			hostname: endpoint.hostname,
			port: endpoint.port
		});

		this.cryptoPrimitives = utils.getCryptoSuite();

		logger.info('Successfully constructed Fabric COP service client: endpoint - %j', endpoint);

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

	}

	/**
	 * Enroll the member and return an opaque member object.
	 * @param req Enrollment request
	 * @param {string} req.enrollmentID The registered ID to use for enrollment
	 * @param {string} req.enrollmentSecret The secret associated with the enrollment ID
	 * @returns Promise for [Enrollment]{@link module:api.Enrollment}
	 */
	enroll(req) {
		var self = this;

		return new Promise(function (resolve, reject) {
			if (!req.enrollmentID) {
				logger.error('Invalid enroll request, missing enrollmentID');
				return reject(new Error('req.enrollmentID is not set'));
			}

			if (!req.enrollmentSecret) {
				logger.error('Invalid enroll request, missing enrollmentSecret');
				return reject(new Error('req.enrollmentSecret is not set'));
			}

			var enrollmentID = req.enrollmentID;
			var enrollmentSecret = req.enrollmentSecret;

			//generate enrollment certificate pair for signing
			self.cryptoPrimitives.generateKey()
				.then(
				function (privateKey) {
					//generate CSR using enrollmentID for the subject
					try {
						var csr = privateKey.generateCSR('CN=' + req.enrollmentID);
						self._fabricCOPClient.enroll(req.enrollmentID, req.enrollmentSecret, csr)
							.then(
							function (csrPEM) {
								//Need to convert from PEM to DER and hex encode the response
								return resolve(new api.Enrollment(privateKey, FabricCOPClient.pemToDER(csrPEM)));
							},
							function (err) {
								return reject(err);
							}
							);

					} catch (err) {
						return reject(new Error(util.format('Failed to generate CSR for enrollmemnt due to error [%s]', err)));
					}
				},
				function (err) {
					return reject(new Error(util.format('Failed to generate key for enrollment due to error [%s]', err)));
				}
				);

		});
	}

	/**
	 * @typedef {Object} FabricCOPServices-HTTPEndpoint
	 * @property {string} hostname
	 * @property {number} port
	 * @property {string} protocol
	 */

	/**
	 * Utility function which parses an HTTP URL into its component parts
	 * @param {string} url HTTP or HTTPS url including protocol, host and port
	 * @returns {...FabricCOPServices-HTTPEndpoint}
	 * @throws InvalidURL for malformed URLs
	 * @ignore
	 */
	static _parseURL(url) {

		var endpoint = {};

		var purl = urlParser.parse(url, true);

		if (purl.protocol && purl.protocol.startsWith('http')) {
			if (purl.protocol.slice(0, -1) != 'https') {
				if (purl.protocol.slice(0, -1) != 'http') {
					throw new Error('InvalidURL: url must start with http or https.');
				}
			}
			endpoint.protocol = purl.protocol.slice(0, -1);
			if (purl.hostname) {
				endpoint.hostname = purl.hostname;

				if (purl.port) {
					endpoint.port = parseInt(purl.port);
				}

			} else {
				throw new Error('InvalidURL: missing hostname.');
			}

		} else {
			throw new Error('InvalidURL: url must start with http or https.');
		}

		return endpoint;
	}

	/**
	* return a printable representation of this object
	*/
	toString() {
		return ' FabricCOPServices : {' +
			'hostname: ' + this._fabricCOPClient._hostname +
			', port: ' + this._fabricCOPClient._port +
			'}';
	}
};

/**
 * Client for communciating with the Fabric COP APIs
 *
 * @class
 */
var FabricCOPClient = class {

	/**
	 * @typedef {Object} FabricCOPServices-HTTPEndpoint
	 * @property {string} hostname
	 * @property {number} port
	 * @property {boolean} isSecure
	 */

	/**
	 * constructor
	 *
	 * @param {object} connect_opts Connection options for communciating with the Fabric COP server
	 * @param {string} connect_opts.protocol The protocol to use (either HTTP or HTTPS)
	 * @param {string} connect_opts.hostname The hostname of the Fabric COP server endpoint
	 * @param {number} connect_opts.port The port of the Fabric COP server endpoint
	 * @param {Buffer[]} connect_opts.ca An array of trusted certificates in PEM format
	 * @throws Will throw an error if connection options are missing or invalid
	 *
	 */
	constructor(connect_opts) {

		//check connect_opts
		try {
			this._validateConnectionOpts(connect_opts);
		} catch (err) {
			throw new Error('Invalid connection options.  ' + err.message);
		}


		this._httpClient = (connect_opts.protocol = 'http') ? http : https;
		this._hostname = connect_opts.hostname;
		if (connect_opts.port) {
			this._port = connect_opts.port;
		} else {
			this._port = (connect_opts.protocol === 'http' ? 80 : 443);
		}
		this._ca = (connect_opts.ca) ? ca : null;
		this._baseAPI = '/api/v1/cfssl/';


	}

	/**
	 * Enroll a registered user in order to receive a signed X509 certificate
	 * @param {string} enrollmentID The registered ID to use for enrollment
	 * @param {string} enrollmentSecret The secret associated with the enrollment ID
	 * @param {string} csr PEM-encoded PKCS#10 certificate signing request
	 * @returns {Promise} PEM-encoded X509 certificate
	 * @throws Will throw an error if all parameters are not provided
	 * @throws Will throw an error if calling the enroll API fails for any reason
	 */
	enroll(enrollmentID, enrollmentSecret, csr) {

		var self = this;
		var numArgs = arguments.length;

		return new Promise(function (resolve, reject) {
			//check for required args
			if (numArgs < 3) {
				return reject(new Error('Missing required parameters.  \'enrollmentID\', \'enrollmentSecret\' and \'csr\' are all required.'));
			}

			var requestOptions = {
				hostname: self._hostname,
				port: self._port,
				path: self._baseAPI + 'enroll',
				method: 'POST',
				auth: enrollmentID + ':' + enrollmentSecret,
				ca: self._ca
			};

			var request = self._httpClient.request(requestOptions, function (response) {

				const responseBody = [];
				response.on('data', function (chunk) {
					responseBody.push(chunk);
				});

				response.on('end', function () {

					var payload = responseBody.join('');

					if (!payload) {
						reject(new Error(
							util.format('Enrollment failed with HTTP status code ', response.statusCode)));
					}
					//response should be JSON
					try {
						var enrollResponse = JSON.parse(payload);
						if (enrollResponse.success) {
							//we want the result field which is Base64-encoded PEM
							return resolve(new Buffer.from(enrollResponse.result, 'base64').toString());
						} else {
							return reject(new Error(
								util.format('Enrollment failed with errors [%s]', JSON.stringify(enrollResponse.errors))));
						}

					} catch (err) {
						reject(new Error(
							util.format('Could not parse enrollment response [%s] as JSON due to error [%s]', payload, err)));
					}
				});

			});

			request.on('error', function (err) {
				reject(new Error(util.format('Calling enrollment endpoint failed with error [%s]', err)));
			});

			request.write(csr);
			request.end();

		});

	}

	/**
	 * Convert a PEM encoded certificate to DER format
	 * @param {string) pem PEM encoded public or private key
	 * @returns {string} hex Hex-encoded DER bytes
	 * @throws Will throw an error if the conversation fails
	 */
	static pemToDER(pem) {

		//PEM format is essentially a nicely formatted base64 representation of DER encoding
		//So we need to strip "BEGIN" / "END" header/footer and string line breaks
		//Then we simply base64 decode it and convert to hex string
		var contents = pem.toString().trim().split(/\r?\n/);
		//check for BEGIN and END tags
		if (!(contents[0].match(/\-\-\-\-\-\s*BEGIN ?([^-]+)?\-\-\-\-\-/) &&
			contents[contents.length - 1].match(/\-\-\-\-\-\s*END ?([^-]+)?\-\-\-\-\-/))) {
			throw new Error('Input parameter does not appear to be PEM-encoded.');
		};
		contents.shift(); //remove BEGIN
		contents.pop(); //remove END
		//base64 decode and encode as hex string
		var hex = Buffer.from(contents.join(''), 'base64').toString('hex');
		return hex;
	}

	/**
	 * Validate the connection options
	 * @throws Will throw an error if any of the required connection options are missing or invalid
	 * @ignore
	 */
	_validateConnectionOpts(connect_opts) {
		//check for protocol
		if (!connect_opts.protocol) {
			throw new Error('Protocol must be set to \'http\' or \'https\'');
		};

		if (connect_opts.protocol != 'http') {
			if (connect_opts.protocol != 'https') {
				throw new Error('Protocol must be set to \'http\' or \'https\'');
			}
		};

		if (!connect_opts.hostname) {
			throw new Error('Hostname must be set');
		};

		if (connect_opts.port) {
			if (!Number.isInteger(connect_opts.port)) {
				throw new Error('Port must be an integer');
			}
		}

	}
};

module.exports = FabricCOPServices;
module.exports.FabricCOPClient = FabricCOPClient;


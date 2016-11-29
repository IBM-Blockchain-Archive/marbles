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
var utils = require('./utils.js');

var grpc = require('grpc');
var logger = utils.getLogger('Remote.js');


/**
 * The Remote class represents a the base class for all remote nodes, Peer, Orderer , and MemberServicespeer.
 *
 * @class
 */
var Remote = class {

	/**
	 * Constructs a Node with the endpoint configuration settings.
	 *
	 * @param {string} url The orderer URL with format of 'grpcs://host:port'.
	 * @param {opts} An Object that may contain options to override the global settings
	 *    pem The certificate file, in PEM format,
	 *       to use with the gRPC protocol (that is, with TransportCredentials).
	 *       Required when using the grpcs protocol.
	 */
	constructor(url, opts) {
		var pem = null;
		if(opts) {
			if(opts.pem) {
				pem = opts.pem;
			}
		}

		var ssl_target_name_override = 'tlsca';
		var default_authority = 'tlsca';
		if(opts && opts['ssl-target-name-override']) {
			ssl_target_name_override = opts['ssl-target-name-override'];
		}
		else {
			ssl_target_name_override = utils.getConfigSetting('ssl-target-name-override','tlsca');
		}
		if(opts && opts['default-authority']) {
			default_authority = opts['default-authority'];
		}
		else {
			default_authority = utils.getConfigSetting('default-authority','tlsca');
		}

		// connection options
		this._options = {};
		if(ssl_target_name_override) this._options['grpc.ssl_target_name_override'] = ssl_target_name_override;
		if(default_authority) this._options['grpc.default_authority'] = default_authority;

		// service connection
		this._url = url;
		this._endpoint = new utils.Endpoint(url, pem);
	}

	/**
	 * Get the URL of the orderer.
	 * @returns {string} Get the URL associated with the Orderer.
	 */
	getUrl() {
		logger.debug('Remote.getUrl::'+this._url);
		return this._url;
	}

	/**
	* return a printable representation of this object
	*/
	toString() {
		return ' Remote : {' +
			'url:' + this._url +
		'}';
	}
};

module.exports = Remote;

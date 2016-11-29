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
var certPaser = require('./utils-x509cert.js');

/**
 * A model to represent x.509 certificate
 *
 * @class
 */
var X509Certificate = class {

	constructor(buffer) {
		debug('cert:', JSON.stringify(buffer));
		// convert certBuffer to arraybuffer
		var certBuffer = utils.toArrayBuffer(buffer);
		// parse the DER-encoded buffer
		var asn1 = certPaser.org.pkijs.fromBER(certBuffer);
		this._cert = {};
		try {
			this._cert = new certPaser.org.pkijs.simpl.CERT({schema: asn1.result});
			debug('decoded certificate:\n', JSON.stringify(this._cert, null, 4));
		} catch (ex) {
			debug('error parsing certificate bytes: ', ex);
			throw ex;
		}
	}

	/**
	 * What would be a suitable description of this method?
	 *
	 * @param {Object} Object ID
	 */
	criticalExtension(oid) {
		var ext;
		debug('oid: ', oid);
		this._cert.extensions.some(function (extension) {
			debug('extnID: ', extension.extnID);
			if (extension.extnID === oid) {
				ext = extension;
				return true;
			}
		});
		debug('found extension: ', ext);
		debug('extValue: ', _toBuffer(ext.extnValue.value_block.value_hex));
		return _toBuffer(ext.extnValue.value_block.value_hex);
	}

};

// utility function to convert Javascript arraybuffer to Node buffers
function _toBuffer(ab) {
	var buffer = new Buffer(ab.byteLength);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
		buffer[i] = view[i];
	}
	return buffer;
}

module.exports = X509Certificate;

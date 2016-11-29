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

'use strict';

// requires
var api = require('../api.js');

var crypto = require('crypto');
var elliptic = require('elliptic');
var EC = elliptic.ec;
var sjcl = require('sjcl');
var jsrsa = require('jsrsasign');
var KEYUTIL = jsrsa.KEYUTIL;
var util = require('util');
var hashPrimitives = require('../hash.js');
var utils = require('../utils');
var ECDSAKey = require('./ecdsa/key.js');

// constants
const AESKeyLength = 32;
const HMACKeyLength = 32;
const ECIESKDFOutput = 512; // bits
const IVLength = 16; // bytes

var logger = utils.getLogger('crypto_ecdsa_aes');

/**
 * The {@link module:api.CryptoSuite} implementation for ECDSA, and AES algorithms using software key generation.
 * This class implements a software-based key generation (as opposed to Hardware Security Module based key management)
 *
 * @class
 */
var CryptoSuite_ECDSA_AES = class extends api.CryptoSuite {

	/**
	 * constructor
	 *
	 * @param {number} keySize Key size for the ECDSA algorithm, can only be 256 or 384
	 * @param {KeyValueStore} kvs An instance of a {@link module:api.KeyValueStore} implementation used to save private keys
	 */
	constructor(keySize, kvs) {
		if (keySize !== 256 && keySize !== 384) {
			throw new Error('Illegal key size: ' + keySize + ' - this crypto suite only supports key sizes 256 or 384');
		}

		super();

		if (typeof kvs === 'undefined' || kvs === null) {
			logger.info('This class requires a KeyValueStore to save keys, no store was passed in, using the default store');
			this._store = utils.newKeyValueStore({
				path: '/tmp/hfc-key-store'
			});
		} else {
			if (typeof kvs.getValue !== 'function' || typeof kvs.setValue !== 'function') {
				throw new Error('The "kvs" parameter for this constructor must be an instance of a KeyValueStore implementation');
			}

			this._store = kvs;
		}

		this._keySize = keySize;
		this._initialize();
	}

	_initialize() {
		if (this._keySize === 256) {
			this._curveName = 'secp256r1';
			this._ecdsaCurve = elliptic.curves['p256'];
		} else if (this._keySize === 384) {
			this._curveName = 'secp384r1';
			this._ecdsaCurve = elliptic.curves['p384'];
		}

		// hash function must be set carefully to produce the hash size compatible with the key algorithm
		// https://www.ietf.org/rfc/rfc5480.txt (see page 9 "Recommended key size, digest algorithm and curve")
		var hashAlgo = utils.getConfigSetting('crypto-hash-algo');

		logger.debug('Hash algorithm: %s, hash output size: %s', hashAlgo, this._keySize);

		switch (hashAlgo.toLowerCase() + '-' + this._keySize) {
		case 'sha3-256':
			this._hashFunction = hashPrimitives.sha3_256;
			this._hashFunctionKeyDerivation = hashPrimitives.hash_sha3_256;
			break;
		case 'sha3-384':
			this._hashFunction = hashPrimitives.sha3_384;
			this._hashFunctionKeyDerivation = hashPrimitives.hash_sha3_384;
			break;
		case 'sha2-256':
			this._hashFunction = hashPrimitives.sha2_256;
			this._hashFunctionKeyDerivation = hashPrimitives.hash_sha2_256;
			break;
		default:
			throw Error(util.format('Unsupported hash algorithm and key size pair: %s-%s', hashAlgo, this._keySize));
		}

		this._hashOutputSize = this._keySize / 8;

		this._ecdsa = new EC(this._ecdsaCurve);
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#generateKey}
	 * Returns an instance of {@link module.api.Key} representing the private key, which also
	 * encapsulates the public key. It'll also save the private key in the KeyValueStore
	 *
	 * @returns {Key} Promise of an instance of {@link module:ECDSA_KEY} containing the private key and the public key
	 */
	generateKey(opts) {
		var pair = KEYUTIL.generateKeypair('EC', this._curveName);

		if (typeof opts !== 'undefined' && typeof opts.ephemeral !== 'undefined' && opts.ephemeral === true) {
			return Promise.resolve(new ECDSAKey(pair.prvKeyObj, this._keySize));
		} else {
			// unless "opts.ephemeral" is explicitly set to "true", default to saving the key
			var key = new ECDSAKey(pair.prvKeyObj, this._keySize);

			var self = this;
			return new Promise(
				function(resolve, reject) {
					self._store.setValue(key.getSKI(), KEYUTIL.getPEM(pair.prvKeyObj, 'PKCS8PRV'))
					.then(
						function() {
							return resolve(key);
						}
					).catch(
						function(err) {
							reject(err);
						}
					);
				}
			);
		}
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#deriveKey}
	 * To be implemented
	 */
	deriveKey(key, opts) {
		throw new Error('Not implemented yet');
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#importKey}
	 * To be implemented
	 */
	importKey(raw, opts) {
		throw new Error('Not implemented yet');
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#getKey}
	 * Returns the key this CSP associates to the Subject Key Identifier ski.
	 */
	getKey(ski) {
		var self = this;

		return new Promise(
			function(resolve, reject) {
				self._store.getValue(ski)
				.then(function(raw) {
					if (raw !== null) {
						var privKey = KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(raw);
						return resolve(new ECDSAKey(privKey, self._keySize));
					} else {
						return resolve(null);
					}
				})
				.catch(function(err) {
					reject(err);
				});
			}
		);
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#hash}
	 * Hashes messages msg using options opts.
	 */
	hash(msg, opts) {
		return this._hashFunction(msg);
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#sign}
	 * Signs digest using key k.
	 *
	 * The opts argument is not needed.
	 */
	sign(key, digest, opts) {
		if (typeof key === 'undefined' || key === null) {
			throw new Error('A valid key is required to sign');
		}

		if (typeof digest === 'undefined' || digest === null) {
			throw new Error('A valid message is required to sign');
		}

		// Note that the statement below uses internal implementation specific to the
		// module './ecdsa/key.js'
		var signKey = this._ecdsa.keyFromPrivate(key._key.prvKeyHex, 'hex');
		var sig = this._ecdsa.sign(new Buffer(this.hash(digest), 'hex'), signKey);
		logger.debug('ecdsa signature: ', sig);
		return sig;
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#verify}
	 * Verifies signature against key k and digest
	 * The opts argument should be appropriate for the algorithm used.
	 */
	verify(key, signature, digest) {
		if (typeof key === 'undefined' || key === null) {
			throw new Error('A valid key is required to verify');
		}

		if (typeof signature === 'undefined' || signature === null) {
			throw new Error('A valid signature is required to verify');
		}

		if (typeof digest === 'undefined' || digest === null) {
			throw new Error('A valid message is required to verify');
		}

		var pubKey = this._ecdsa.keyFromPublic(key.getPublicKey()._key.pubKeyHex, 'hex');
		// note that the signature is generated on the hash of the message, not the message itself
		return pubKey.verify(this.hash(digest), signature);
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#encrypt}
	 * Encrypts plaintext using key k.
	 * The opts argument should be appropriate for the algorithm used.
	 */
	encrypt(key, plaintext, opts) {
		throw new Error('Not implemented yet');
	}

	/**
	 * This is an implementation of {@link module:api.CryptoSuite#decrypt}
	 * Decrypts ciphertext using key k.
	 * The opts argument should be appropriate for the algorithm used.
	 */
	decrypt(key, cipherText, opts) {
		key = key._key;
		var self = this;

		var level = key.ecparams.keylen;

		if (this._keySize !== level) {
			throw Error(util.format('Invalid key. It\'s security %s does not match the current security level represented by the key size %s', level, this._keySize));
		}
		//cipherText = ephemeralPubKeyBytes + encryptedTokBytes + macBytes
		//ephemeralPubKeyBytes = first ((384+7)/8)*2 + 1 bytes = first 97 bytes
		//hmac is sha3_384 = 48 bytes or sha3_256 = 32 bytes
		var Rb_len = Math.floor((level + 7) / 8) * 2 + 1;
		var D_len = level >> 3;
		var ct_len = cipherText.length;

		if (ct_len <= Rb_len + D_len)
			throw new Error('Illegal cipherText length: ' + ct_len + ' must be > ' + (Rb_len + D_len));

		var Rb = cipherText.slice(0, Rb_len);  // ephemeral public key bytes
		var EM = cipherText.slice(Rb_len, ct_len - D_len);  // encrypted content bytes
		var D = cipherText.slice(ct_len - D_len);

		logger.debug('Rb :\n%s', new Buffer(Rb).toString('hex'));
		logger.debug('EM :\n%s', new Buffer(EM).toString('hex'));
		logger.debug('D  :\n%s', new Buffer(D).toString('hex'));

		//convert bytes to usable key object
		var ephPubKey = this._ecdsa.keyFromPublic(new Buffer(Rb, 'hex'), 'hex');
		var privKey = this._ecdsa.keyFromPrivate(key.prvKeyHex, 'hex');
		logger.debug('computing Z... %s, %s', privKey, ephPubKey);

		var Z = privKey.derive(ephPubKey.pub);
		logger.debug('Z computed: %s', Z);
		logger.debug('Shared secret:  ', new Buffer(Z.toArray(), 'hex'));
		var kdfOutput = self._hkdf(Z.toArray(), ECIESKDFOutput, null, null);
		// obtain the encryption key used to decrypt the token bytes
		var aesKey = kdfOutput.slice(0, AESKeyLength);
		// obtain the hashing key for verifying the token bytes with MAC
		var hmacKey = kdfOutput.slice(AESKeyLength, AESKeyLength + HMACKeyLength);
		logger.debug('aesKey:  ', new Buffer(aesKey, 'hex'));
		logger.debug('hmacKey: ', new Buffer(hmacKey, 'hex'));

		var recoveredD = self._hmac(hmacKey, EM);
		logger.debug('recoveredD:  ', new Buffer(recoveredD).toString('hex'));

		if (D.compare(new Buffer(recoveredD)) != 0) {
			// debug('D='+D.toString('hex')+' vs '+new Buffer(recoveredD).toString('hex'));
			throw new Error('HMAC verify failed when trying to decrypt token challenge during user enrollment');
		}
		var iv = EM.slice(0, IVLength);
		var cipher = crypto.createDecipheriv('aes-256-cfb', new Buffer(aesKey), iv);
		var decryptedBytes = cipher.update(EM.slice(IVLength));
		logger.debug('decryptedBytes: ',new Buffer(decryptedBytes).toString('hex'));
		return decryptedBytes;
	}

	_hkdf(ikm, keyBitLength, salt, info) {

		if (!salt)
			salt = _zeroBuffer(this._hashOutputSize);

		if (!info)
			info = '';

		var key = CryptoSuite_ECDSA_AES._hkdf2(bytesToBits(new Buffer(ikm)), keyBitLength, bytesToBits(salt), info, this._hashFunctionKeyDerivation);

		return bitsToBytes(key);

	}


	_hmac(key, bytes) {
		logger.debug('HMAC key: ', JSON.stringify(key));
		logger.debug('bytes to digest: ', JSON.stringify(bytes));

		var hmac = new sjcl.misc.hmac(bytesToBits(key), this._hashFunctionKeyDerivation);
		hmac.update(bytesToBits(bytes));
		var result = hmac.digest();
		logger.debug('HMAC digest: ', bitsToBytes(result));
		return bitsToBytes(result);
	}

	/** HKDF with the specified hash function.
	 * @param {bitArray} ikm The input keying material.
	 * @param {Number} keyBitLength The output key length, in bits.
	 * @param {String|bitArray} salt The salt for HKDF.
	 * @param {String|bitArray} info The info for HKDF.
	 * @param {Object} [Hash=sjcl.hash.sha256] The hash function to use.
	 * @return {bitArray} derived key.
	 * @ignore
	 */
	static _hkdf2(ikm, keyBitLength, salt, info, Hash) {
		var hmac, key, i, hashLen, loops, curOut, ret = [];

		// Hash = Hash || sjcl.hash.sha256;
		if (typeof info === 'string') {
			info = sjcl.codec.utf8String.toBits(info);
		} else if (!info) {
			info = sjcl.codec.utf8String.toBits('');
		}
		if (typeof salt === 'string') {
			salt = sjcl.codec.utf8String.toBits(salt);
		} else if (!salt) {
			salt = [];
		}

		hmac = new sjcl.misc.hmac(salt, Hash);
		//key = hmac.mac(ikm);
		hmac.update(ikm);
		key = hmac.digest();
		// debug('prk: %j', new Buffer(bitsToBytes(key)).toString('hex'));
		hashLen = sjcl.bitArray.bitLength(key);

		loops = Math.ceil(keyBitLength / hashLen);
		if (loops > 255) {
			throw new sjcl.exception.invalid('key bit length is too large for hkdf');
		}

		curOut = [];
		for (i = 1; i <= loops; i++) {
			hmac = new sjcl.misc.hmac(key, Hash);
			hmac.update(curOut);
			hmac.update(info);
			// debug('sjcl.bitArray.partial(8, i): %j', sjcl.bitArray.partial(8, i));
			hmac.update(bytesToBits([i]));

			// hmac.update([sjcl.bitArray.partial(8, i)]);
			curOut = hmac.digest();
			ret = sjcl.bitArray.concat(ret, curOut);
		}
		return sjcl.bitArray.clamp(ret, keyBitLength);
	}
};  // end Crypto class

function _zeroBuffer(length) {
	var buf = new Buffer(length);
	buf.fill(0);
	return buf;
}

module.exports = CryptoSuite_ECDSA_AES;

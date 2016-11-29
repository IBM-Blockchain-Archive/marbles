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
var urlParser = require('url');
var net = require('net');
var util = require('util');
var MemberServices = utils.getMemberService();
var Member = require('./Member.js');
var Orderer = require('./Orderer.js');

var logger = utils.getLogger('Chain.js');

/**
 * The class representing a chain with which the client SDK interacts.
 *
 * @class
 */
var Chain = class {

	/**
	 * @param {string} name to identify different chain instances. The naming of chain instances
	 * is completely at the client application's discretion.
	 */
	constructor(name) {
		// Name of the chain is only meaningful to the client
		this._name = name;

		// Security enabled flag
		this._securityEnabled = true;

		// A member cache associated with this chain
		// TODO: Make an LRU to limit size of member cache
		this._members = {}; // associated array of [name] <-> Member

		// The number of tcerts to get in each batch
		this._tcertBatchSize = utils.getConfigSetting('tcert-batch-size',200);

		// The registrar (if any) that registers & enrolls new members/users
		this._registrar = null; // Member

		// The member services used for this chain
		this._memberServices = null; // MemberServices

		// The key-val store used for this chain
		this._keyValStore = null; // KeyValueStore;

		// Is in dev mode or network mode
		this._devMode = false;

		// If in prefetch mode, we prefetch tcerts from member services to help performance
		this._preFetchMode = true;

		// Temporary variables to control how long to wait for deploy and invoke to complete before
		// emitting events.  This will be removed when the SDK is able to receive events from the
		this._deployWaitTime = utils.getConfigSetting('deploy-wait-time',20);
		this._invokeWaitTime = utils.getConfigSetting('invoke-wait-time',5);

		/**
		 * @member [CryptoSuite]{@link module:api.CryptoSuite} cryptoPrimitives The crypto primitives object provides access to the crypto suite
		 * for functions like sign, encrypt, decrypt, etc.
		 * @memberof module:api.Chain.prototype
		 */
		this.cryptoPrimitives = utils.getCryptoSuite();

		logger.info('Constructed Chain instance: name - %s, securityEnabled: %s, TCert download batch size: %s, network mode: %s', this._name, this._securityEnabled, this._tcertBatchSize, !this._devMode);
	}

	/**
	 * Get the chain name.
	 * @returns {string} The name of the chain.
	 */
	getName() {
		return this._name;
	}

	/**
	 * Get the member whose credentials are used to register and enroll other users, or undefined if not set.
	 * @returns [Member]{@link module:api.Member} The member whose credentials are used to perform registration, or undefined if not set.
	 */
	getRegistrar() {
		return this._registrar;
	}

	/**
	 * Set the member whose credentials are used to register and enroll other users.
	 * @param [Member]{@link module:api.Member} registrar The member whose credentials are used to perform registration.
	 */
	setRegistrar(registrar) {
		this._registrar = registrar;
	}

	/**
	 * Set the member services URL
	 * @param {string} url Member services URL of the form: 'grpc://host:port' or 'grpcs://host:port'
	 * @param {Object} opts Object with all connections settings including the 'pem' value of the TLS certificate for the local client
	 */
	setMemberServicesUrl(url, opts) {
		this.setMemberServices(new MemberServices(url, opts));
	}

	/**
	 * Get the member service associated this chain.
	 * @returns [MemberService]{@link module:api.MemberService} Return the current member service, or undefined if not set.
	 */
	getMemberServices() {
		return this._memberServices;
	}

	/**
	 * Set the member service associated this chain.  This allows the default implementation of member service to be overridden.
	 * @param [MemberService]{@link module:api.MemberService} an instance of the MemberServices class
	 */
	setMemberServices(memberServices) {
		this._memberServices = memberServices;
		if (memberServices instanceof MemberServices) {
			this.cryptoPrimitives = memberServices.getCrypto();
		}
	}

	/**
	 * Determine if security is enabled.
	 */
	isSecurityEnabled() {
		return this._memberServices !== undefined;
	}

	/**
	 * Determine if pre-fetch mode is enabled to prefetch tcerts.
	 */
	isPreFetchMode() {
		return this._preFetchMode;
	}

	/**
	 * Set prefetch mode to true or false.
	 */
	setPreFetchMode(preFetchMode) {
		this._preFetchMode = preFetchMode;
	}

	/**
	 * Determine if dev mode is enabled.
	 */
	isDevMode() {
		return this._devMode;
	}

	/**
	 * Set dev mode to true or false.
	 */
	setDevMode(devMode) {
		this._devMode = devMode;
	}

	/**
	 * Get the key val store implementation (if any) that is currently associated with this chain.
	 * @returns {KeyValueStore} Return the current KeyValueStore associated with this chain, or undefined if not set.
	 */
	getKeyValueStore() {
		return this._keyValStore;
	}

	/**
	 * Set the key value store implementation.
	 */
	setKeyValueStore(keyValStore) {
		this._keyValStore = keyValStore;
	}

	/**
	 * Get the tcert batch size.
	 */
	getTCertBatchSize() {
		return this._tcertBatchSize;
	}

	/**
	 * Set the tcert batch size.
	 */
	setTCertBatchSize(batchSize) {
		this._tcertBatchSize = batchSize;
	}

	/**
	 * Get the user member named 'name' or create
	 * a new member if the member does not exist.
	 * @returns Promise for the Member object
	 */
	getMember(name) {
		var self = this;
		return new Promise(function(resolve, reject) {
			if (!self._keyValStore) {
				logger.error('No key value store was found on this Chain instance: name - "%s"', self._name);
				return reject(new Error('No key value store was found.  You must first call Chain.configureKeyValueStore or Chain.setKeyValueStore'));
			}

			if (!self._memberServices) {
				logger.error('No member services was found on this Chain instance: name - "%s"', self._name);
				return reject(new Error('No member services was found.  You must first call Chain.configureMemberServices or Chain.setMemberServices'));
			}

			self._getMemberHelper(name).then(
				function(member) {
					logger.debug('Requested member "%s" resolved successfully on this Chain instance: name - %s', name, self._name);
					return resolve(member);
				}
			).catch(
				function(err) {
					logger.error('Failed to construct an instance of requested member "%s" on this Chain instance: name - "%s". Error: %s', name, self._name, err.stack ? err.stack : err);
					reject(err);
				}
			);
		});
	}

	/**
	 * Get a user.
	 * A user is a specific type of member.
	 * Another type of member is a peer.
	 * @returns Promise for the Member object
	 */
	getUser(name) {
		return this.getMember(name);
	}

	// Try to get the member from cache.
	// If not found, create a new one.
	// If member is found in the key value store,
	//    restore the state to the new member, store in cache and return the member.
	// If there are no errors and member is not found in the key value store,
	//    return the new member.
	_getMemberHelper(name) {
		logger.debug('Chain._getMemberHelper - start name:'+name);
		var self = this;

		return new Promise(function(resolve, reject) {
			// Try to get the member state from the cache
			var member = self._members[name];
			if (member) {
				logger.debug('Requested member "%s" resolved from cache', name);
				return resolve(member);
			}

			// Create the member and try to restore it's state from the key value store (if found).
			member = new Member(name, self);
			logger.debug('Chain._getMemberHelper - create new member - will try to restoreState -name:'+name);
			member.restoreState()
			.then(
				function() {
					self._members[name] = member;
					logger.debug('Requested member "%s" loaded from key value store', name);
					return resolve(member);
				}
			).catch(
				function(err) {
					logger.error('Failed to load requested member "%s" locally in cache or key value store. Error: %s', name, err.stack ? err.stack : err);
					reject(err);
				}
			);
		});
	}

	/**
	 * Register a user or other member type with the chain.
	 * @param registrationRequest Registration information.
	 * @returns Promise for a 'true' status on successful registration
	 */
	register(registrationRequest) {
		if (!registrationRequest.enrollmentID) {
			logger.error('Invalid parameter to "register()" function, object must include property "enrollmentID"');
			return Promise.reject(new Error('Invalid parameter to "register()" function, object must include property "enrollmentID"'));
		}

		var self = this;

		return new Promise(function(resolve, reject) {
			self.getMember(registrationRequest.enrollmentID)
			.then(
				function(member) {
					if (member.isRegistered()) {
						return resolve(member._enrollmentSecret);
					} else {
						return member.register(registrationRequest);
					}
				}
			).then(
				function(enrollmentSecret) {
					return resolve(enrollmentSecret);
				}
			).catch(
				function(err) {
					logger.error('Failed to register member "%s". Error: %s', registrationRequest.enrollmentID, err.stack ? err.stack : err);
					reject(err);
				}
			);
		});
	}

	/**
	 * Enroll a user or other identity which has already been registered.
	 * If the user has already been enrolled, this will still succeed.
	 * @param name The name of the user or other member to enroll.
	 * @param secret The secret of the user or other member to enroll.
	 * @param cb The callback to return the user or other member.
	 */
	enroll(name, secret) {
		logger.debug('Chain.enroll - start name:'+name);
		var self = this;

		return new Promise(function(resolve, reject) {
			var _member;
			self.getMember(name)
			.then(
				function(member) {
					_member = member;
					logger.debug('Chain.enroll - call member.enroll');
					return _member.enroll(secret);
				}
			).then(
				function() {
					logger.debug('Chain.enroll - resolved - member:'+name);
					return resolve(_member);
				}
			).catch(
				function(err) {
					logger.error('Failed to enroll member "%s". Error: %s', name, err.stack ? err.stack : err);
					reject(err);
				}
			);
		});
	}

	/**
	 * Register and enroll a user or other member type.
	 * This assumes that a registrar with sufficient privileges has been set.
	 * @param registrationRequest Registration information.
	 * @params
	 */
	registerAndEnroll(registrationRequest) {
		if (!registrationRequest.enrollmentID) {
			logger.error('Invalid parameter to "registerAndEnroll()" function, object must include property "enrollmentID"');
			return Promise.reject(new Error('Invalid parameter to "registerAndEnroll()" function, object must include property "enrollmentID"'));
		}

		var self = this;

		return new Promise(function(resolve, reject) {
			var _member;

			self.getMember(registrationRequest.enrollmentID)
			.then(
				function(member) {
					if (member.isEnrolled()) {
						return resolve(member);
					}

					_member = member;
					return _member.registerAndEnroll(registrationRequest);
				}
			).then(
				function() {
					return resolve(_member);
				}
			).catch(
				function(err) {
					logger.error('Failed to register and enroll member "%s". Error: %s', registrationRequest.enrollmentID, err.stack ? err.stack : err);
					reject(err);
				}
			);
		});
	}

	/**
	 * Set the orderer given an endpoint specification.
	 * Will replace the existing orderer if one exists.
	 * @param url The URL of the orderer.
	 * @param opts Optional GRPC options.
	 * @returns {Orderer} Returns the new Orderer.
	 */
	setOrderer(url, opts) {
		logger.debug('Chain.setOrderer - start url:'+url);
		var orderer = new Orderer(url, opts);
		this._orderer = orderer;
		return orderer;
	}

	/**
	 * Get the current orderer for this chain.
	 */
	getOrderer() {
		return this._orderer;
	}

	/**
	* return a printable representation of this object
	*/
	toString() {
		var state = {
			name: this._name,
			orderer: this._orderer ? this._orderer._url : 'N/A'
		};

		return JSON.stringify(state);
	}

};

module.exports = Chain;

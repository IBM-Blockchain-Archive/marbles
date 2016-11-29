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

/**
 * This is the main module for the "hfc" (Hyperledger Fabric Client) package. It provides the convenience
 * APIs to the classes of the package including [Chain]{@link module:api.Chain}
 *
 * @module hfc
 */

var util = require('util');
var Chain = require('./lib/Chain.js');
var Config = require('./lib/Config.js');
var Peer = require('./lib/Peer.js');
var utils = require('./lib/utils.js');

var _chains = {};

/**
 * Create a new chain.  If it already exists, throws an Error.
 * @param name {string} Name of the chain.  It can be any name and has value only for the client.
 *
 * @returns [Chain]{@link module:api.Chain} a new instance of the Chain class
 */
module.exports.newChain = function(name) {
	var chain = _chains[name];

	if (chain)
		throw new Error(util.format('Chain %s already exists', name));

	chain = new Chain(name);

	_chains[name] = chain;
	return chain;
};

/**
 * Get a chain.  If it doesn't yet exist and 'create' is true, create it.
 * @param {string} chainName The name of the chain to get or create.
 * @param {boolean} create If the chain doesn't already exist, specifies whether to create it.
 * @returns {Chain} Returns the chain, or null if it doesn't exist and create is false.
 */
module.exports.getChain = function(chainName, create) {
	var chain = _chains[chainName];

	if (!chain && create) {
		chain = this.newChain(chainName);
	}

	return chain;
};

/**
 * Constructs and returns a Peer given its endpoint configuration settings.
 *
 * @param {string} url The URL with format of "grpcs://host:port".
 * @param {Object} opts The options for the connection to the peer.
 * @returns {Peer} Returns the new peer.
 */
module.exports.getPeer = function(url, opts) {
	var peer = new Peer(url, opts);

	return peer;
};


/**
 * Obtains an instance of the [KeyValueStore]{@link module:api.KeyValueStore} class. By default
 * it returns the built-in implementation, which is based on files ([FileKeyValueStore]{@link module:api.FileKeyValueStore}).
 * This can be overriden with an environment variable KEY_VALUE_STORE, the value of which is the
 * full path of a CommonJS module for the alternative implementation.
 *
 * @param {Object} options is whatever the implementation requires for initializing the instance. For the built-in
 * file-based implementation, this requires a single property "path" to the top-level folder for the store
 * @returns [KeyValueStore]{@link module:api.KeyValueStore} an instance of the KeyValueStore implementation
 */
module.exports.newKeyValueStore = function(options) {
	return utils.newKeyValueStore(options);
};

/**
 * Configures a logger for the entire HFC SDK to use and override the default logger. Unless this method is called,
 * HFC uses a default logger (based on winston). When using the built-in "winston" based logger, use the environment
 * variable HFC_LOGGING to pass in configurations in the following format:
 *
 * {
 *   'error': 'error.log',				// 'error' logs are printed to file 'error.log' relative of the current working dir for node.js
 *   'debug': '/tmp/myapp/debug.log',	// 'debug' and anything more critical ('info', 'warn', 'error') can also be an absolute path
 *   'info': 'console'					// 'console' is a keyword for logging to console
 * }
 *
 * @param {Object} logger a logger instance that defines the following methods: debug(), info(), warn(), error() with
 * string interpolation methods like [util.format]{@link https://nodejs.org/api/util.html#util_util_format_format}.
 */
module.exports.setLogger = function(logger) {
	var err = '';

	if (typeof logger.debug !== 'function') {
		err += 'debug() ';
	}

	if (typeof logger.info !== 'function') {
		err += 'info() ';
	}

	if (typeof logger.warn !== 'function') {
		err += 'warn() ';
	}

	if (typeof logger.error !== 'function' ) {
		err += 'error()';
	}

	if (err !== '') {
		throw new Error('The "logger" parameter must be an object that implements the following methods, which are missing: ' + err);
	}

	if (global.hfc) {
		global.hfc.logger = logger;
	} else {
		global.hfc = {
			logger: logger
		};
	}
};

/**
 * Adds a file to the top of the list of configuration setting files that are
 * part of the hierarchical configuration.
 * These files will override the default settings and be overriden by environment,
 * command line arguments, and settings programmatically set into configuration settings.
 *
 * hierarchy search order:
 *  1. memory - all settings added with utils.setConfigSetting(name,value)
 *  2. Command-line arguments
 *  3. Environment variables (names will be change from AAA-BBB to aaa-bbb)
 *  4. Custom Files - all files added with the addConfigFile(path)
 *     will be ordered by when added, were last one added will override previously added files
 *  5. The file located at 'config/default.json' with default settings
 *
 * @param {String} path - The path to the file to be added to the top of list of configuration files
 */
module.exports.addConfigFile = function(path) {

	utils.addConfigFile(path);
};

/**
 * Adds a setting to override all settings that are
 * part of the hierarchical configuration.
 *
 * hierarchy search order:
 *  1. memory - settings added with this call
 *  2. Command-line arguments
 *  3. Environment variables (names will be change from AAA-BBB to aaa-bbb)
 *  4. Custom Files - all files added with the addConfigFile(path)
 *     will be ordered by when added, were last one added will override previously added files
 *  5. The file located at 'config/default.json' with default settings
 *
 * @param {String} name - The name of a setting
 * @param {Object} value - The value of a setting
 */
module.exports.setConfigSetting = function(name, value) {

	utils.setConfigSetting(name, value);
};

/**
 * Retrieves a setting from the hierarchical configuration and if not found
 * will return the provided default value.
 *
 * hierarchy search order:
 *  1. memory - settings added with utils.setConfigSetting(name,value)
 *  2. Command-line arguments
 *  3. Environment variables (names will be change from AAA-BBB to aaa-bbb)
 *  4. Custom Files - all files added with the addConfigFile(path)
 *     will be ordered by when added, were last one added will override previously added files
 *  5. The file located at 'config/default.json' with default settings
 *
 * @param {String} name - The name of a setting
 * @param {Object} default_value - The value of a setting if not found in the hierarchical configuration
 */
module.exports.getConfigSetting = function(name, default_value) {

	return utils.getConfigSetting(name, default_value);
};


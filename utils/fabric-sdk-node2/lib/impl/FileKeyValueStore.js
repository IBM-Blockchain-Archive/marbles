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
var fs = require('fs-extra');
var path = require('path');
var utils = require('../utils');

/**
 * This is a default implementation of the [KeyValueStore]{@link module:api.KeyValueStore} API.
 * It uses files to store the key values.
 *
 * @class
 */
var KeyValueStore = class extends api.KeyValueStore {

	/**
	 * constructor
	 *
	 * @param {Object} options contains a single property "path" which points to the top-level directory
	 * for the store
	 */
	constructor(options) {
		if (!options || !options.path) {
			throw new Error('Must provide the path to the directory to hold files for the store.');
		}

		super();

		this._dir = options.path;
		if (!utils.existsSync(this._dir)) {
			fs.mkdirsSync(this._dir);
		}
	}

	/**
	 * Get the value associated with name.
	 * @param {string} name
	 * @returns Promise for the value
	 * @ignore
	 */
	getValue(name) {
		var self = this;

		return new Promise(function(resolve, reject) {
			var p = path.join(self._dir, name);
			fs.readFile(p, 'utf8', function (err, data) {
				if (err) {
					if (err.code !== 'ENOENT') {
						reject(err);
					} else {
						return resolve(null);
					}
				}

				return resolve(data);
			});
		});
	}

	/**
	 * Set the value associated with name.
	 * @param {string} name
	 * @param {string} value
	 * @returns Promise for a "true" value on successful completion
	 * @ignore
	 */
	setValue(name, value) {
		var self = this;

		return new Promise(function(resolve, reject) {
			var p = path.join(self._dir, name);
			fs.writeFile(p, value, function(err) {
				if (err) {
					reject(err);
				} else {
					return resolve(true);
				}
			});
		});
	}
};

module.exports = KeyValueStore;


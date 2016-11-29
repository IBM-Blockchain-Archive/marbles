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
 * This is the configuration class for the "hfc" (Hyperledger Fabric Client) package.
 * It provides all configuration settings using "config" node.js package to retrieve the
 * settings from JSON based files, environment settings, and command line startup settings
 *
 * configuration settings will be overridden in this order
 *  first files are loaded in this order
 *    $NODE_CONFIG_DIR/default.json
 *    $NODE_CONFIG_DIR/$NODE_ENV.json
 *
 *  NODE_CONFIG_DIR defaults to './config'  the configuration directory is relative to where the application is started
 *  NODE_ENV        defaults to 'development'
 *
 * then then following environment setting will override file settings
 *     $NODE_CONFIG
 *  $ export NODE_CONFIG='{"request-timeout": 3000 }'
 *
 * then the command line setting will override all
 *     node myapp.js --NODE_CONFIG='{"request-timeout": 7000 }'
 *
 *
 *   see the following for complete information on the configuration settings
 *         https://www.npmjs.com/package/config
 */

'use strict';

var nconf = require('nconf');
var path  = require('path');

//
// The class representing the hierarchy of configuration settings.
//
//

var Config = class {

	//	 Setup nconf to use (search order):
	//	  1. in memory - all settings added with utils.setConfigSetting(name,value)
	//	  2. Command-line arguments
	//	  3. Environment variables (names will be change from AAA-BBB to aaa-bbb)
	//	  4. user Files - all files added with the addConfigFile(path)
	//	     will be ordered by when added, were last one added will override previously added files
	//	  5. The file located at 'config/default.json' with default settings
	//
	constructor() {
		nconf.use('memory');
		nconf.argv();
		nconf.env();
		nconf.use('mapenv', {type:'memory'});
		this.mapSettings(nconf.stores['mapenv'], process.env);
		this._fileStores = [];
		// reference to configuration settings
		this._config = nconf;
		// setup the location of the default config shipped with code
		var default_config = path.resolve( __dirname, '../config/default.json');
		this.reorderFileStores(default_config);
	}

	//
	//	 utility method to map (convert) the environment(upper case and underscores) style
	//	 names to configuration (lower case and dashes) style names
	//
	mapSettings(store, settings) {
		for(var key in settings) {
			var value = settings[key];
			key = key.toLowerCase();
			key = key.replace(/_/g, '-');
//			if(store.get(key)) {
//				throw new Error('Unable to map environment variable to configuration setting. There is another config setting with the same converted name:'+key);
//			}
			store.set(key,value);
		}
	}

	//
	//	 utility method to reload the file based stores so
	//	 the last one added is on the top of the files hierarchy
	//
	reorderFileStores(path) {
		// first remove all the file stores
		for(var x in this._fileStores) {
			this._config.remove(this._fileStores[x]);
		}
		// now add this new file store to the front of the list
		this._fileStores.unshift(path);
		// now load all the file stores
		for(var x in this._fileStores) {
			var name = this._fileStores[x];
			this._config.file(name, name);
		}
	}

	//
	//    Add an additional file
	//
	file(path) {
		if(typeof path !== 'string') {
			throw new Error('The "path" parameter must be a string');
		}
		// just reuse the path name as the store name...will be unique
		this.reorderFileStores(path);
	}

	//
	//   Get the config setting with name.
	//   If the setting is not found returns the default value provided.
	//
	get(name, default_value) {
		var return_value = null;

		try {
			return_value = this._config.get(name);
		}
		catch(err) {
			return_value = default_value;
		}

		if(return_value === null || return_value === undefined) {
			return_value = default_value;
		}

		return return_value;
	}

	//
	//	  Set a value into the 'memory' store of config settings. This will override all other settings
	//
	set(name, value) {
		this._config.set(name,value);
	}

};

module.exports = Config;
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

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);

var hfc = require('../..');
var FabricCOPServices = require('../../lib/impl/FabricCOPImpl');

var utils = require('../../lib/utils.js');
var testUtil = require('./util.js');

var keyValStorePath = testUtil.KVS;


test('Attempt to use FabricCOPServices',function(t){


	var chain = hfc.newChain('copTest');

	utils.setConfigSetting('crypto-keysize', 256);
	chain.setKeyValueStore(hfc.newKeyValueStore({
		path: keyValStorePath
	}));

	var copService = new FabricCOPServices('http://localhost:8888');

	chain.setMemberServices(copService);

	chain.enroll('admin', 'adminpw')
	.then(
		function(admin) {
			console.log(admin);
			t.pass('Successfully enrolled admin');
		},
		function(err){
			t.fail(err);
		}
	);

	t.end();

});
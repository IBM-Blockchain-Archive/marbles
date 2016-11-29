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
var util = require('util');
var fs = require('fs');
var path = require('path');
var testUtil = require('./util.js');
var utils = require('../../lib/utils.js');

var keyValStorePath = testUtil.KVS;


var FabricCOPServices = require('../../lib/impl/FabricCOPImpl');
var FabricCOPClient = FabricCOPServices.FabricCOPClient;

/**
 * FabricCOPClient class tests
 */

//test constructor
test('FabricCOPClient: Test constructor', function (t) {

	var connectOpts = {};

	t.throws(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Protocol must be set to 'http' or 'https'/,
		'Throw error for missing protocol'
	);

	connectOpts.protocol = 'dummy';

	t.throws(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Protocol must be set to 'http' or 'https'/,
		'Throw error for invalid protocol'
	);

	connectOpts.protocol = 'http';
	connectOpts.hostname = 'hostname';

	t.doesNotThrow(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Protocol must be set to 'http' or 'https'/,
		'HTTP is a valid protocol'
	);

	connectOpts.protocol = 'https';

	t.doesNotThrow(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Protocol must be set to 'http' or 'https'/,
		'HTTPS is a valid protocol'
	);

	delete connectOpts.hostname;

	t.throws(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Hostname must be set/,
		'Throw error for missing hostname'
	);

	connectOpts.hostname = 'hostname';

	t.doesNotThrow(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Port must be an integer/,
		'Should not throw error if port is not set'
	);

	connectOpts.port = '8888';

	t.throws(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Port must be an integer/,
		'Throw error for invalid port'
	);

	connectOpts.port = 8888;

	t.doesNotThrow(
		function () {
			var client = new FabricCOPClient(connectOpts);
		},
		/Invalid connection options.  Port must be an integer/,
		'Integer is a valid type for port'
	);

	t.end();

});


//FabricCOPClient _pemToDER tests
var ecertPEM = fs.readFileSync(path.resolve(__dirname, '../fixtures/fabriccop/ecert.pem'));

test('FabricCOPClient: Test _pemToDer static method',function(t){

	t.plan(2);

	//call function with garbage
	t.throws(
		function(){
			var hex = FabricCOPClient.pemToDER('garbage');
		},
		/Input parameter does not appear to be PEM-encoded./,
		'Throw an error when input is not PEM-encoded'
	);

	try {
		var hex = FabricCOPClient.pemToDER(ecertPEM.toString());
		t.pass('Sucessfully converted ecert from PEM to DER');
	} catch(err) {
		t.fail('Failed to convert PEM to DER due to ' + err);
	}

	t.end();
});


//FabricCOPClient enroll tests
test('FabricCOPClient: Test enroll with missing parameters', function (t) {

	var client = new FabricCOPClient({
		protocol: 'http',
		hostname: '127.0.0.1',
		port: 8888
	});

	//
	return client.enroll()
		.then(function (csr) {
			t.fail('Enrollment must fail when missing required parameters');
		})
		.catch(function (err) {
			if (err.message.startsWith('Missing required parameters')) {
				t.pass('Enrollment should fail when missing required parameters');
			} else {
				t.fail('Enrollment should have failed with \'Missing equired parameters\'');
			}
		});
});

var enrollmentID = 'testUser';
var enrollmentSecret = 'user1';
var csr = fs.readFileSync(path.resolve(__dirname, '../fixtures/fabriccop/enroll-csr.pem'));


test('FabricCOPClient: Test enroll', function (t) {

	var client = new FabricCOPClient({
		protocol: 'http',
		hostname: '127.0.0.1',
		port: 8888
	});

	//
	return client.enroll(enrollmentID,enrollmentSecret, csr)
		.then(function (csr) {
			t.comment(csr);
			t.pass('Successfully enrolled with enrollmentID \''+ enrollmentID + '\'');
		})
		.catch(function (err) {
			t.fail('Failed to enroll \'' + enrollmentID + '\'.  ' + err);
		});
});

/**
 * FabricCOPServices class tests
 */
test('FabricCOPServices: Test _parseURL() function', function (t) {

	var goodHost = 'www.example.com';
	var goodPort = 8888;
	var goodURL = 'http://' + goodHost + ':' + goodPort;
	var goodURLSecure = 'https://' + goodHost + ':' + goodPort;

	var badHost = '';
	var badURL = 'http://' + badHost + ':' + goodPort;
	var badURL2 = 'httpD://' + goodHost + ':' + goodPort;
	var badURL3 = 'httpsD://' + goodHost + ':' + goodPort;
	var badURL4 = goodHost + ':' + goodPort;


	t.plan(10);

	//valid http endpoint
	var endpointGood = FabricCOPServices._parseURL(goodURL);
	t.equals(endpointGood.protocol, 'http', 'Check that protocol is set correctly to \'http\'');
	t.equals(endpointGood.hostname, goodHost, 'Check that hostname is set correctly');
	t.equals(endpointGood.port, goodPort, 'Check that port is set correctly');

	//valid https endpoint
	var endpointGoodSecure = FabricCOPServices._parseURL(goodURLSecure);
	t.equals(endpointGoodSecure.protocol, 'https', 'Check that protocol is set correctly to \'https\'');
	t.equals(endpointGoodSecure.hostname, goodHost, 'Check that hostname is set correctly');
	t.equals(endpointGoodSecure.port, goodPort, 'Check that port is set correctly');

	//check invalid endpoints
	t.throws(
		function () {
			FabricCOPServices._parseURL(badURL);
		},
		/InvalidURL: missing hostname./,
		'Throw error for missing hostname'
	);

	t.throws(
		function () {
			FabricCOPServices._parseURL(badURL2);
		},
		/InvalidURL: url must start with http or https./,
		'Throw error for invalid protocol'
	);

	t.throws(
		function () {
			FabricCOPServices._parseURL(badURL3);
		},
		/InvalidURL: url must start with http or https./,
		'Throw error for invalid protocol'
	);

	t.throws(
		function () {
			FabricCOPServices._parseURL(badURL3);
		},
		/InvalidURL: url must start with http or https./,
		'Throw error for missing protocol'
	);
});

//run the enroll test

test('FabricCOPServices: Test enroll()', function (t) {


	//
	// Create and configure the test chain
	//
	var chain = hfc.newChain('testChain-ca');

	// need to override the default key size 384 to match the member service backend
	// otherwise the client will not be able to decrypt the enrollment challenge
	utils.setConfigSetting('crypto-keysize', 256);

	chain.setKeyValueStore(hfc.newKeyValueStore({
		path: keyValStorePath
	}));

	var cop = new FabricCOPServices('http://localhost:8888');

	var req = {
		enrollmentID: 'admin',
		enrollmentSecret: 'adminpw'
	};

	return cop.enroll(req)
		.then(
		function (enrollment) {
			console.log(enrollment.toString());
			t.pass('Successfully enrolled \'' + req.enrollmentID + '\'.');
		},
		function (err) {
			t.fail('Failed to enroll \'' + req.enrollmentID + '\'.  ' + err);
		}
		);

});
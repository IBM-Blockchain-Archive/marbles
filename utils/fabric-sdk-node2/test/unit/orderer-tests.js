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
var testUtil = require('./util.js');

var Orderer = require('../../lib/Orderer.js');

var keyValStorePath = testUtil.KVS;

//
// Orderer happy path test
//
// Send a broadcast message containing data as Buffer. A successful response is
// expected in this case.
//
test('orderer happy path test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:5151');

	client.sendBroadcast('some data')
	.then(
		function(status) {
			console.log('response status: ' + JSON.stringify(status));
			t.pass('Successfully sent to orderer.');
			t.end();
		},
		function(err) {
			t.fail('Failed to send to orderer!' + err.stack ? err.stack : err);
			t.end();
		}
	).catch(function(err) {
		t.fail('Caught Error: ' + err.stack ? err.stack : err);
		t.end();
	});
});

//
// Orderer bad address test
//
// Attempt to initialize an orderer with a bad URL address. An invalid protocol
// error is expected in this case.
//

test('orderer bad address test', function(t) {
	try {
		var client = new Orderer('xxxxx');
		t.fail('Orderer allowed setting a bad URL.');
	}
	catch(err) {
		console.log('Caught Error: ' + err);
		t.pass('Orderer did not allow setting bad URL.');
	}
	t.end();
});

//
// Orderer missing address test
//
// Attempt to initialize an orderer with a missing URL address. A TypeError
// indicating that the URL must be a "string" is expected in this case.
//

test('orderer missing address test', function(t) {
	try {
		var client = new Orderer();
		t.fail('Orderer allowed setting a missing address.');
	}
	catch(err) {
		console.log('Caught Error: ' + err);
		t.pass('Orderer did not allow setting a missing address.');
	}
	t.end();
});

//
// Orderer missing data test
//
// Send an empty broadcast message to an orderer. An error indicating that no
// data was sent is expected in this case.
//

test('orderer missing data test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:5005');

	client.sendBroadcast()
	.then(
		function(status) {
			console.log('response status: ' + JSON.stringify(status));
			t.fail('Should have noticed missing data.');
		},
		function(err) {
			console.log('Caught Error: ' + err);
			t.pass('Successfully found missing data: ' + err);
		}
	).catch(function(err) {
		t.fail('Caught Error: should not be here if we defined promise error function: ' + err);
	});
	t.end();
});

//
// Orderer unknown address  test
//
// Send a broadcast message to a bad orderer address. An error indicating
// a connection failure is expected in this case.
//

test('orderer unknown address test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:51006');

	client.sendBroadcast('some data')
	.then(
		function(status) {
			console.log('response status: ' + JSON.stringify(status));
			t.fail('Should have noticed a bad address.');
		},
		function(err) {
			t.pass('Successfully found bad address!');
		}
	).catch(function(err) {
		t.fail('Caught Error: should not be here if we defined promise error function: '
		+ err);
	});
	t.end();
});

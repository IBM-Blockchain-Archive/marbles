/**
 * Copyright 2016 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
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
var Member = require('../../lib/Member.js');

var keyValStorePath = testUtil.KVS;

//
// Orderer via chain setOrderer/getOrderer
//
// Set the orderer URL through the chain setOrderer method. Verify that the
// orderer URL was set correctly through the getOrderer method. Repeat the
// process by updating the orderer URL to a different address.
//
test('\n\n** TEST ** orderer via chain setOrderer/getOrderer', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain-orderer-member', true);
	try {
		var order_address = 'grpc://localhost:5151';
		chain.setOrderer(order_address);
		t.pass('Successfully set the new orderer URL');
		t.end();

		var order = chain.getOrderer();
		if(order.getUrl() === order_address) {
			t.pass('Successfully retrieved the new orderer URL from the chain');
			t.end();
		}
		else {
			t.fail('Failed to retieve the new orderer URL from the chain');
			t.end();
		}

		try {
			var order_address2 = 'grpc://localhost:5152';
			chain.setOrderer(order_address2);
			t.pass('Successfully updated the orderer URL');
			t.end();

			var order2 = chain.getOrderer();
			if(order2.getUrl() === order_address2) {
				t.pass('Successfully retrieved the upated orderer URL from the chain');
				t.end();
			}
			else {
				t.fail('Failed to retieve the updated orderer URL from the chain');
				t.end();
			}
		}
		catch(err2) {
			t.fail('Failed to update the order URL ' + err);
			t.end();
		}
	}
	catch(err) {
		t.fail('Failed to set the new order URL ' + err);
		t.end();
	}
});

//
// Orderer via chain set/get bad address
//
// Set the orderer URL to a bad address through the chain setOrderer method.
// Verify that an error is reported when trying to set a bad address.
//
test('\n\n** TEST ** orderer via chain set/get bad address', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain', true);
	try {
		var order_address = 'xxx';
		chain.setOrderer(order_address);
		t.failed('Failed by setting the orderer to a bad address');
		t.end();
	}
	catch(err) {
		t.pass('Successfully caught setting of a bad address ' + err);
		t.end();
	}
});

//
// Orderer via chain set/get empty address
//
// Set the orderer URL to an empty address through the chain setOrderer method.
// Verify that an error is reported when trying to set an empty address.
//
test('\n\n** TEST ** orderer via chain set/get empty address', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain', true);
	try {
		chain.setOrderer();
		t.failed('Failed by setting the orderer to a empty address');
		t.end();
	}
	catch(err) {
		t.pass('Successfully caught the setting of a empty address ' + err);
		t.end();
	}
});

//
// Orderer via member missing orderer
//
// Attempt to send a request to the orderer with the sendTransaction method
// before the orderer URL was set. Verify that an error is reported when tying
// to send the request.
//
test('\n\n** TEST ** orderer via member missing orderer', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain', true);

	chain.setKeyValueStore(hfc.newKeyValueStore({
		path: keyValStorePath
	}));

	chain.setMemberServicesUrl('grpc://localhost:7054');

	chain.enroll('admin', 'Xurw3yU9zI0l')
	.then(
		function(admin) {
			t.pass('Successfully enrolled user \'admin\'');

			// send to orderer
			return admin.sendTransaction('data');
		},
		function(err) {
			t.fail('Failed to enroll user \'admin\'. ' + err);
			t.end();
		}
	).then(
		function(status) {
			console.log('Status: ' + status + ', type: (' + typeof status + ')');
			if (status === 0) {
				t.fail('Successfully submitted request.');
			} else {
				t.pass('Failed to submit. Error code: ' + status);
			}

			t.end();
		},
		function(err) {
			console.log('Error: ' + err);
			t.pass('Failed to submit. Error code: ' + err);
			t.end();
		}
	).catch(function(err) {
		t.pass('Failed request. ' + err);
		t.end();
	});
});

//
// Orderer via member null data
//
// Attempt to send a request to the orderer with the sendTransaction method
// with the data set to null. Verify that an error is reported when tying
// to send null data.
//
test('\n\n** TEST ** orderer via member null data', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain', true);

	chain.setKeyValueStore(hfc.newKeyValueStore({
		path: keyValStorePath
	}));

	chain.setMemberServicesUrl('grpc://localhost:7054');
	chain.setOrderer('grpc://localhost:5151');

	chain.enroll('admin', 'Xurw3yU9zI0l')
	.then(
		function(admin) {
			t.pass('Successfully enrolled user \'admin\'');

			// send to orderer
			return admin.sendTransaction(null);
		},
		function(err) {
			t.fail('Failed to enroll user \'admin\'. ' + err);
			t.end();
		}
	).then(
		function(status) {
			console.log('Status: ' + status + ', type: (' + typeof status + ')');
			if (status === 0) {
				t.fail('Successfully submitted request.');
			} else {
				t.pass('Failed to submit. Error code: ' + status);
			}

			t.end();
		},
		function(err) {
			console.log('Error: ' + err);
			t.pass('Failed to submit. Error code: ' + err);
			t.end();
		}
	).catch(function(err) {
		t.pass('Failed request. ' + err);
		t.end();
	});
});

//
// Orderer via member bad orderer address
//
// Attempt to send a request to the orderer with the sendTransaction method
// with the orderer address set to a bad URL. Verify that an error is reported
// when tying to send the request.
//
test('\n\n** TEST ** orderer via member bad orderer address', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain', true);

	chain.setKeyValueStore(hfc.newKeyValueStore({
		path: keyValStorePath
	}));

	chain.setMemberServicesUrl('grpc://localhost:7054');
	// Set bad orderer address here
	chain.setOrderer('grpc://localhost:5199');

	chain.enroll('admin', 'Xurw3yU9zI0l')
	.then(
		function(admin) {
			t.pass('Successfully enrolled user \'admin\'');

			// send to orderer
			return admin.sendTransaction('some data');
		},
		function(err) {
			t.fail('Failed to enroll user \'admin\'. ' + err);
			t.end();
		}
	).then(
		function(status) {
			console.log('Status: ' + status + ', type: (' + typeof status + ')');
			if (status === 0) {
				t.fail('Successfully submitted request.');
			} else {
				t.pass('Failed to submit. Error code: ' + status);
			}
			t.end();
		},
		function(err) {
			t.pass('Failed to submit ::' + err);
			t.end();
		}
	).catch(function(err) {
		t.pass('Failed to submit orderer request. ' + err);
		t.end();
	});
});

//
// Orderer via member good data
//
// Attempt to send a request to the orderer with the sendTransaction method
// with the orderer address set to the correct URL and the data not being null.
// Verify that a success is returned when tying to send the request.
//
test('\n\n** TEST ** orderer via member bad data', function(t) {
	//
	// Create and configure the test chain
	//
	var chain = hfc.getChain('testChain', true);

	chain.setKeyValueStore(hfc.newKeyValueStore({
		path: keyValStorePath
	}));

	chain.setMemberServicesUrl('grpc://localhost:7054');
	chain.setOrderer('grpc://localhost:5151');

	chain.enroll('admin', 'Xurw3yU9zI0l')
	.then(
		function(admin) {
			t.pass('Successfully enrolled user \'admin\'');

			return admin.sendTransaction('some data');
		},
		function(err) {
			t.fail('Failed to enroll user \'admin\'. ' + err);
			t.end();
		}
	).then(
		function(status) {
			console.log('Status: ' + status + ', type: (' + typeof status + ')');
			if (status.Status === 'SUCCESS') {
				t.fail('Successfully submitted request.');
			} else {
				t.pass('Failed to submit. Error code: ' + status);
			}
			t.end();
		},
		function(err) {
			t.pass('Failed to submit. Error code:'+ err);
			t.end();
		}
	).catch(function(err) {
		t.fail('Failed to submit orderer request. ' + err);
		t.end();
	});
});

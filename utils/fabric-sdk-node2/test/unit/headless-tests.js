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

'use strict';

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);

var path = require('path');
var util = require('util');
var hfc = require('../..');
var fs = require('fs');
var execSync = require('child_process').execSync;
var utils = require('../../lib/utils.js');
var cryptoSuiteReq = require('../../lib/impl/CryptoSuite_ECDSA_AES.js');
var bunyan = require('bunyan');
var log4js = require('log4js');
var intercept = require('intercept-stdout');

// FileKeyValueStore tests /////////////
var FileKeyValueStore = require('../../lib/impl/FileKeyValueStore.js');

var keyValStorePath = path.join(getUserHome(), 'kvsTemp');
//Note: unix relative path does not start with '/'
//windows relative path starts with '/'
var keyValStorePath1 = 'tmp/keyValStore1';
var keyValStorePath2 = '/tmp/keyValStore2';
var keyValStorePath3 = '/tmp/keyValStore3';
var keyValStorePath4 = '/tmp/keyValStore4';
var testKey = 'keyValFileStoreName';
var testValue = 'secretKeyValue';
var store1 = '';
var store2 = '';
// End: FileKeyValueStore tests ////////

// Chain tests /////////////
var Chain = require('../../lib/Chain.js');
var _chain = null;
var chainName = 'testChain';
var chainKeyValStorePath = 'tmp/chainKeyValStorePath';
var store3 = '';
// End: Chain tests ////////

// Member tests //////////
var Member = require('../../lib/Member.js');
var memberName = 'Donald T. Duck';
var enrollmentID = 123454321;
var roles = ['admin', 'user'];
var affiliation = 'Hyperledger Community';
var memberCfg = {
	'enrollmentID': enrollmentID,
	'roles': roles,
	'affiliation': affiliation
};

// GRPC Options tests ///////////////
var Remote = require('../../lib/Remote.js');
var Peer = require('../../lib/Peer.js');
var Orderer = require('../../lib/Orderer.js');
var Config = require('../../lib/Config.js');
var MemberServices = require('../../lib/impl/MemberServices.js');
var aPem = '-----BEGIN CERTIFICATE-----' +
	'MIIBwTCCAUegAwIBAgIBATAKBggqhkjOPQQDAzApMQswCQYDVQQGEwJVUzEMMAoG' +
	'A1UEChMDSUJNMQwwCgYDVQQDEwNPQkMwHhcNMTYwMTIxMjI0OTUxWhcNMTYwNDIw' +
	'MjI0OTUxWjApMQswCQYDVQQGEwJVUzEMMAoGA1UEChMDSUJNMQwwCgYDVQQDEwNP' +
	'QkMwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAR6YAoPOwMzIVi+P83V79I6BeIyJeaM' +
	'meqWbmwQsTRlKD6g0L0YvczQO2vp+DbxRN11okGq3O/ctcPzvPXvm7Mcbb3whgXW' +
	'RjbsX6wn25tF2/hU6fQsyQLPiJuNj/yxknSjQzBBMA4GA1UdDwEB/wQEAwIChDAP' +
	'BgNVHRMBAf8EBTADAQH/MA0GA1UdDgQGBAQBAgMEMA8GA1UdIwQIMAaABAECAwQw' +
	'CgYIKoZIzj0EAwMDaAAwZQIxAITGmq+x5N7Q1jrLt3QFRtTKsuNIosnlV4LR54l3' +
	'yyDo17Ts0YLyC0pZQFd+GURSOQIwP/XAwoMcbJJtOVeW/UL2EOqmKA2ygmWX5kte' +
	'9Lngf550S6gPEWuDQOcY95B+x3eH' +
	'-----END CERTIFICATE-----';
var aHostname = 'atesthostname';
var aHostnameOverride = 'atesthostnameoverride';

// specifically set the values to defaults because they may have been overridden when
// running in the overall test bucket ('gulp test')
function resetDefaults() {
	var defaultSettings = require('../../config/default.json');
	for (var setting in defaultSettings) {
		hfc.setConfigSetting(setting, defaultSettings[setting]);
	}
}

test('\n\n ** Index **\n\n', function (t) {
	var chain = hfc.getChain('someChain', true);
	t.equals(chain.getName(), 'someChain', 'Checking chain names match');
	t.throws(
		function () {
			hfc.newChain('someChain');
		},
		/^Error: Chain someChain already exist/,
		'Index tests: checking that chain already exists.'
	);
	var peer = hfc.getPeer('grpc://somehost.com:9000');
	t.throws(
		function () {
			hfc.getPeer('http://somehost.com:9000');
		},
		/^InvalidProtocol: Invalid protocol: http.  URLs must begin with grpc:\/\/ or grpcs:\/\//,
		'Index tests: checking that getPeer will fail with bad address.'
	);
	t.end();
});

/*
 * This test assumes that there is a ./config directory from the running location
 * and that there is file called 'config.json'.
 */
test('\n\n ** Config **\n\n', function (t) {
	// setup the environment
	process.argv.push('--test-4=argv');
	process.argv.push('--test-5=argv');
	process.env.TEST_3 = 'env';
	process.env.test_6 = 'mapped';
	// internal call. clearing the cached config.
	global.hfc.config = undefined;
	t.equals(hfc.getConfigSetting('request-timeout', 'notfound'), 3000, 'checking that able to get "request-timeout" value from an additional configuration file');
	//try adding another config file
	hfc.addConfigFile('test/fixtures/local.json');
	t.equals(hfc.getConfigSetting('test-2', 'notfound'), 'local', 'checking that able to test-2 value from an additional configuration file');
	t.equals(hfc.getConfigSetting('test-3', 'notfound'), 'env', 'checking that test-3 environment values are used');
	t.equals(hfc.getConfigSetting('test-4', 'notfound'), 'argv', 'checking that test-4 argument values are used');
	hfc.setConfigSetting('test-5', 'program');
	t.equals(hfc.getConfigSetting('test-5', 'notfound'), 'program', 'checking that test-5 program values are used');
	t.equals(hfc.getConfigSetting('test-6', 'notfound'), 'mapped', 'checking that test-6 is enviroment mapped value');
	t.end();
});

//
// Run the FileKeyValueStore tests
//

test('\n\n ** FileKeyValueStore - read and write test **\n\n', function (t) {
	// clean up
	if (utils.existsSync(keyValStorePath)) {
		execSync('rm -rf ' + keyValStorePath);
	}

	var store = utils.newKeyValueStore({
		path: keyValStorePath
	});

	if (utils.existsSync(keyValStorePath)) {
		t.pass('FileKeyValueStore read and write test: Successfully created new directory for testValueStore');

		store.setValue(testKey, testValue)
			.then(
			function (result) {
				t.pass('FileKeyValueStore read and write test: Successfully set value');

				if (utils.existsSync(path.join(keyValStorePath, testKey))) {
					t.pass('FileKeyValueStore read and write test: Verified the file for key ' + testKey + ' does exist');

					return store.getValue(testKey);
				} else {
					t.fail('FileKeyValueStore read and write test: Failed to create file for key ' + testKey);
					t.end();
				}
			},
			function (reason) {
				t.fail('FileKeyValueStore read and write test: Failed to set value, reason: ' + reason);
				t.end();
			})
			.then(
			// Log the fulfillment value
			function (val) {
				if (val != testValue)
					t.fail('FileKeyValueStore read and write test: ' + val + ' does not equal testValue of ' + testValue);
				else
					t.pass('FileKeyValueStore read and write test: Successfully retrieved value');

				t.end();
			},
			// Log the rejection reason
			function (reason) {
				t.fail('FileKeyValueStore read and write test: Failed getValue, reason: ' + reason);
				t.end();
			});
	} else {
		t.fail('FileKeyValueStore read and write test: Failed to create new directory: ' + keyValStorePath);
		t.end();
	}
});

test('\n\n ** FileKeyValueStore - constructor test **\n\n', function (t) {
	cleanupFileKeyValueStore(keyValStorePath1);
	cleanupFileKeyValueStore(keyValStorePath2);

	store1 = new FileKeyValueStore({ path: getRelativePath(keyValStorePath1) });
	var exists = utils.existsSync(getAbsolutePath(keyValStorePath1));
	if (exists)
		t.pass('FileKeyValueStore constructor test:  Successfully created new directory');
	else
		t.fail('FileKeyValueStore constructor test:  Failed to create new directory: ' + keyValStorePath1);

	store2 = new FileKeyValueStore({ path: getRelativePath(keyValStorePath2) });
	exists = utils.existsSync(getAbsolutePath(keyValStorePath2));
	if (exists)
		t.pass('FileKeyValueStore constructor test:  Successfully created new directory');
	else
		t.fail('FileKeyValueStore constructor test:  Failed to create new directory: ' + keyValStorePath2);


	t.end();
});

test('\n\n ** FileKeyValueStore - setValue test **\n\n', function (t) {
	store1.setValue(testKey, testValue)
		.then(
		function (result) {
			t.pass('FileKeyValueStore store1 setValue test:  Successfully set value');

			var exists = utils.existsSync(getAbsolutePath(keyValStorePath1), testKey);
			if (exists) {
				t.pass('FileKeyValueStore store1 setValue test:  Verified the file for key ' + testKey + ' does exist');
				return store1.getValue(testKey);
			} else {
				t.fail('FileKeyValueStore store1 setValue test:  Failed to create file for key ' + testKey);
				t.end();
			}
		},
		function (reason) {
			t.fail('FileKeyValueStore store1 setValue test:  Failed to set value: ' + reason);
			t.end();
		})
		.then(
		// Log the fulfillment value
		function (val) {
			if (val != testValue) {
				t.fail('FileKeyValueStore store1 getValue test:  ' + val + ' does not equal testValue of ' + testValue);
			} else {
				t.pass('FileKeyValueStore store1 getValue test:  Successfully retrieved value');
			}

			return store2.setValue(testKey, testValue);
		},
		function (reason) {
			t.fail(reason);
			t.end();
		})
		.then(
		function (result) {
			t.pass('FileKeyValueStore store2 setValue test:  Successfully set value');

			var exists = utils.existsSync(getAbsolutePath(keyValStorePath2), testKey);
			if (exists) {
				t.pass('FileKeyValueStore store2 setValue test:  Verified the file for key ' + testKey + ' does exist');

				return store2.getValue(testKey);
			} else {
				t.fail('FileKeyValueStore store2 setValue test:  Failed to create file for key ' + testKey);
				t.end();
			}
		},
		function (reason) {
			t.fail('FileKeyValueStore store2 setValue test:  Failed to set value: ' + reason);
			t.end();
		})
		.then(
		// Log the fulfillment value
		function (val) {
			if (val != testValue)
				t.fail('FileKeyValueStore store2 getValue test:  ' + val + ' does not equal testValue of ' + testValue);
			else
				t.pass('FileKeyValueStore store2 getValue test:  Successfully retrieved value');

			t.end();
		})
		.catch(
		// Log the rejection reason
		function (reason) {
			t.fail(reason);
			t.end();
		});
});

test('\n\n** FileKeyValueStore error check tests **\n\n', function (t) {

	t.throws(
		function () {
			store3 = new FileKeyValueStore();
		},
		/^Error: Must provide the path/,
		'FileKeyValueStore error check tests: new FileKeyValueStore with no options should throw ' +
		'"Must provide the path to the directory to hold files for the store."'
	);

	t.throws(
		function () {
			store3 = new FileKeyValueStore({ dir: getRelativePath(keyValStorePath3) });
		},
		/^Error: Must provide the path/,
		'FileKeyValueStore error check tests: new FileKeyValueStore with no options.path should throw ' +
		'"Must provide the path to the directory to hold files for the store."'
	);

	cleanupFileKeyValueStore(keyValStorePath3);
	var store3 = new FileKeyValueStore({ path: getRelativePath(keyValStorePath3) });
	store3.setValue(testKey, testValue)
		.then(
		function (result) {
			t.comment('FileKeyValueStore error check tests:  Delete store & getValue test. Successfully set value');

			var exists = utils.existsSync(getAbsolutePath(keyValStorePath3), testKey);
			if (exists) {
				t.comment('FileKeyValueStore error check tests:  Delete store & getValue test. Verified the file for key ' + testKey + ' does exist');
				cleanupFileKeyValueStore(keyValStorePath3);
				exists = utils.existsSync(getAbsolutePath(keyValStorePath3), testKey);
				t.comment('FileKeyValueStore error check tests:  Delete store & getValue test. Deleted store, exists: ' + exists);
				return store3.getValue(testKey);
			} else {
				t.fail('FileKeyValueStore error check tests:  Delete store & getValue test. Failed to create file for key ' + testKey);
			}
		})
		.then(
		// Log the fulfillment value
		function (val) {
			if (val === null) {
				t.pass('FileKeyValueStore error check tests:  Delete store & getValue test. getValue is null');
			} else {
				t.fail('FileKeyValueStore error check tests:  Delete store & getValue test. getValue successfully retrieved value: ' + val);
			}
		},
		function (reason) {
			t.fail('FileKeyValueStore error check tests:  Delete store & getValue test. getValue caught unexpected error: ' + reason);
		})
		.then(
		function () {
			cleanupFileKeyValueStore(keyValStorePath4);
			var store4 = new FileKeyValueStore({ path: getRelativePath(keyValStorePath4) });
			cleanupFileKeyValueStore(keyValStorePath4);
			var exists = utils.existsSync(getAbsolutePath(keyValStorePath4));
			t.comment('FileKeyValueStore error check tests:  Delete store & setValue test. Deleted store, exists: ' + exists);
			return store4.setValue(testKey, testValue);
		})
		.then(
		function (result) {
			t.fail('FileKeyValueStore error check tests:  Delete store & setValue test.  Successfully set value but should have failed.');
			t.end();
		},
		function (reason) {
			t.pass('FileKeyValueStore error check tests:  Delete store & setValue test.  Failed to set value as expected: ' + reason);
			t.end();
		})
		.catch(
		function (err) {
			t.fail('Failed with unexpected error: ' + err.stack ? err.stack : err);
			t.end();
		});
});


// Chain tests /////////////
test('\n\n ** Chain - constructor test **\n\n', function (t) {
	_chain = new Chain(chainName);
	if (_chain.getName() === chainName)
		t.pass('Chain constructor test: getName successful');
	else t.fail('Chain constructor test: getName not successful');

	// trying to get member on a chain without keyvalue store, should fail
	_chain.getMember('randomName')
		.then(function (member) {
			t.fail('Should not have Successfully resolved a member without having keyvalue store configured first');
		}, function (err) {
			if (err.message && err.message.indexOf('No key value store was found') === 0) {
				t.pass('Successfully rejected a "getMember()" call on a chain without keyvalue store');
			} else {
				t.fail('Error: ' + err.stack ? err.stack : err);
			}
		})
		.then(function () {
			_chain.setKeyValueStore({}); // set a dummy keyvalue store to get past the check

			return _chain.getMember('randomName');
		})
		.then(function (member) {
			t.fail('Should not have Successfully resolved a member without having member services configured first');
			t.end();
		}, function (err) {
			if (err.message && err.message.indexOf('No member services was found') === 0) {
				t.pass('Successfully rejected a "getMember()" call on a chain without member services');
			} else {
				t.fail('Error: ' + err.stack ? err.stack : err);
			}
			t.end();
		});
});

test('\n\n ** Chain - setKeyValueStore getKeyValueStore test **\n\n', function (t) {
	cleanupFileKeyValueStore(chainKeyValStorePath);

	_chain.setKeyValueStore(hfc.newKeyValueStore({ path: getRelativePath(chainKeyValStorePath) }));

	var exists = utils.existsSync(getAbsolutePath(chainKeyValStorePath));
	if (exists)
		t.pass('Chain setKeyValueStore test:  Successfully created new directory');
	else
		t.fail('Chain setKeyValueStore test:  Failed to create new directory: ' + chainKeyValStorePath);

	store3 = _chain.getKeyValueStore();
	store3.setValue(testKey, testValue)
		.then(
		function (result) {
			t.pass('Chain getKeyValueStore test:  Successfully set value, result: ' + result);

			var exists = utils.existsSync(getAbsolutePath(chainKeyValStorePath), testKey);
			if (exists)
				t.pass('Chain getKeyValueStore test:  Verified the file for key ' + testKey + ' does exist');
			else
				t.fail('Chain getKeyValueStore test:  Failed to create file for key ' + testKey);

			t.end();
		})
		.catch(
		function (reason) {
			t.fail('Chain getKeyValueStore test:  Failed to set value, reason: ' + reason);
			t.end();
		});
});

test('\n\n ** Chain register methods parameters tests **\n\n', function (t) {
	let chain = new Chain('testChain1');

	chain.register({})
		.then(function () {
			t.fail('Should not have worked becaused the input param was missing user enrollmentID');
		}, function (err) {
			if (err.message && err.message.indexOf('Invalid parameter to "register()" function') === 0) {
				t.pass('Successfully rejected call to "register()" method with invalid parameter missing enrollmentID');
			} else {
				t.fail('Something unexpected happened. Error: ' + err.stack ? err.stack : err);
			}
		})
		.then(function () {
			return chain.registerAndEnroll({});
		})
		.then(function () {
			t.fail('Should not have worked becaused the input param was missing user enrollmentID');
			t.end();
		}, function (err) {
			if (err.message && err.message.indexOf('Invalid parameter to "registerAndEnroll()" function') === 0) {
				t.pass('Successfully rejected call to "registerAndEnroll()" method with invalid parameter missing enrollmentID');
			} else {
				t.fail('Something unexpected happened. Error: ' + err.stack ? err.stack : err);
			}
			t.end();
		});
});

test('\n\n ** Chain - method tests **\n\n', function (t) {
	t.doesNotThrow(
		function () {
			_chain.setRegistrar('something');
		},
		null,
		'checking the setRegistrar'
	);
	t.equal(_chain.getRegistrar(), 'something', 'checking the getRegistrar');
	t.doesNotThrow(
		function () {
			_chain.setMemberServicesUrl('http://somehost.com:9999');
		},
		null,
		'checking the setMemberServicesUrl'
	);
	t.doesNotThrow(
		function () {
			_chain.setMemberServicesUrl('https://somehost.com:9999');
		},
		null,
		'checking the setMemberServicesUrl'
	);
	t.equal(_chain.getMemberServices().toString(), ' FabricCOPServices : {hostname: somehost.com, port: 9999}', 'checking the getMemberServices');
	t.equal(_chain.isSecurityEnabled(), true, 'checking security setting');
	t.doesNotThrow(
		function () {
			_chain.setPreFetchMode(true);
		},
		null,
		'checking the set of prefetchMode'
	);
	t.equal(_chain.isPreFetchMode(), true, 'checking prefetchMode');
	t.doesNotThrow(
		function () {
			_chain.setDevMode(true);
		},
		null,
		'checking the set of DevMode'
	);
	t.equal(_chain.isDevMode(), true, 'checking DevMode');
	t.doesNotThrow(
		function () {
			_chain.setKeyValueStore('something');
		},
		null,
		'checking the set of KeyValueStore'
	);
	t.equal(_chain.getKeyValueStore(), 'something', 'checking getKeyValueStore');
	t.doesNotThrow(
		function () {
			_chain.setTCertBatchSize(123);
		},
		null,
		'checking the set of TCertBatchSize'
	);
	t.equal(_chain.getTCertBatchSize(), 123, 'checking getTCertBatchSize');
	t.doesNotThrow(
		function () {
			_chain.setOrderer('grpc://somehost.com:1234');
		},
		null,
		'checking the set of Orderer'
	);
	t.equal(_chain.getOrderer().toString(), ' Orderer : {url:grpc://somehost.com:1234}', 'checking getOrderer');
	t.equal(_chain.toString(), '{"name":"testChain","orderer":"grpc://somehost.com:1234"}', 'checking chain toString');
	t.end();
});

// Member tests /////////
test('\n\n ** Member - constructor set get tests **\n\n', function (t) {
	var member1 = new Member(memberName, _chain);
	if (member1.getName() === memberName)
		t.pass('Member constructor set get tests 1: new Member getName was successful');
	else
		t.fail('Member constructor set get tests 1: new Member getName was not successful');

	member1.setRoles(roles);
	if (member1.getRoles() &&
		member1.getRoles().indexOf('admin') > -1 &&
		member1.getRoles().indexOf('user') > -1)
		t.pass('Member constructor set get tests 1: setRoles getRoles was successful');

	if (member1.getChain().getName() === chainName)
		t.pass('Member constructor get set tests 1: getChain getName was successful');
	else
		t.fail('Member constructor get set tests 1: getChain getName was not successful');

	member1.setAffiliation(affiliation);
	if (member1.getAffiliation() === affiliation)
		t.pass('Member constructor get set tests 1: setAffiliation getAffiliation was successful');
	else
		t.pass('Member constructor get set tests 1: setAffiliation getAffiliation was not successful');

	var member2 = new Member(memberCfg, _chain);
	if (member2.getName() === enrollmentID)
		t.pass('Member constructor test 2: new Member cfg getName was successful');
	else
		t.fail('Member constructor test 2: new Member cfg getName was not successful');

	if (member2.getRoles() &&
		member2.getRoles().indexOf('admin') > -1 &&
		member2.getRoles().indexOf('user') > -1)
		t.pass('Member constructor test 2: new Member cfg getRoles was successful');
	else
		t.fail('Member constructor test 2: new Member cfg getRoles was not successful');

	if (member1.getAffiliation() === affiliation)
		t.pass('Member constructor get set tests 1: new Member cfg getAffiliation was successful');
	else
		t.pass('Member constructor get set tests 1: new Member cfg getAffiliation was not successful');

	if (member2.getChain().getName() === chainName)
		t.pass('Member constructor get set tests 2: getChain new Member cfg getName was successful');
	else
		t.fail('Member constructor get set tests 2: getChain new Member cfg getName was not successful');

	t.end();
});

test('\n\n ** Member sendDeploymentProposal() tests **\n\n', function (t) {
	var m = new Member('does not matter', _chain);

	var p1 = m.sendDeploymentProposal({
		chaincodePath: 'blah',
		chaincodeId: 'blah',
		fcn: 'init'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "peer" parameter');
	}).catch(function (err) {
		if (err.message === 'Missing "targets" for the endorsing peer objects in the Deployment proposal request') {
			t.pass('Successfully caught missing peer error');
		} else {
			t.fail('Failed to catch the missing peer error. Error: ' + err.stack ? err.stask : err);
		}
	});

	var p2 = m.sendDeploymentProposal({
		endorserUrl: 'blah',
		fcn: 'init'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "chaincodePath" parameter');
	}).catch(function (err) {
		if (err.message === 'Missing chaincodePath in Deployment proposal request') {
			t.pass('Successfully caught missing chaincodePath error');
		} else {
			t.fail('Failed to catch the missing chaincodePath error. Error: ' + err.stack ? err.stask : err);
		}
	});

	var p3 = m.sendDeploymentProposal({
		chaincodePath: 'blah',
		fcn: 'init'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "chaincodeId" parameter');
	}).catch(function (err) {
		if (err.message === 'Missing chaincodeId in the Deployment proposal request') {
			t.pass('Successfully caught missing chaincodeId error');
		} else {
			t.fail('Failed to catch the missing chaincodeId error. Error: ' + err.stack ? err.stask : err);
		}
	});

	Promise.all([p1, p2, p3])
		.then(
		function (data) {
			t.end();
		}
		).catch(
		function (err) {
			t.fail(err.stack ? err.stack : err);
			t.end();
		}
		);
});

test('\n\n ** Member sendTransactionProposal() tests **\n\n', function (t) {
	var m = new Member('does not matter', _chain);

	var p1 = m.sendTransactionProposal({
		chaincodeId: 'someid'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "targets" parameter');
	}, function (err) {
		if (err.message === 'Missing "targets" for endorser peer objects in the Transaction proposal request') {
			t.pass('Successfully caught missing targets error');
		} else {
			t.fail('Failed to catch the missing targets error. Error: ' + err.stack ? err.stask : err);
		}
	}).catch(function (err) {
		if (err.message === 'Missing "targets" for endorser peer objects in the Transaction proposal request') {
			t.pass('Successfully caught missing targets error');
		} else {
			t.fail('Failed to catch the missing targets error. Error: ' + err.stack ? err.stask : err);
		}
	});

	var p2 = m.sendTransactionProposal({
		targets: [hfc.getPeer('grpc://somehost.com:9000')]
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "chaincodePath" parameter');
	}, function (err) {
		if (err.message === 'Missing chaincodeId in the Transaction proposal request') {
			t.pass('Successfully caught missing chaincodeid error');
		} else {
			t.fail('Failed to catch the missing chaincodeid error. Error: ' + err.stack ? err.stask : err);
		}
	}).catch(function (err) {
		if (err.message === 'Missing chaincode ID in the Transaction proposal request') {
			t.pass('Successfully caught missing chaincodeid error');
		} else {
			t.fail('Failed to catch the missing chaincodeid error. Error: ' + err.stack ? err.stask : err);
		}
	});

	var p3 = m.sendTransactionProposal({
		targets: [hfc.getPeer('grpc://somehost.com:9000')],
		chaincodeId: 'someid'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "chaincodePath" parameter');
	}, function (err) {
		if (err.message === 'Missing arguments in Transaction proposal request') {
			t.pass('Successfully caught missing args error');
		} else {
			t.fail('Failed to catch the missing args error. Error: ' + err.stack ? err.stask : err);
		}
	}).catch(function (err) {
		if (err.message === 'Missing arguments in Transaction proposal request') {
			t.pass('Successfully caught missing args error');
		} else {
			t.fail('Failed to catch the missing args error. Error: ' + err.stack ? err.stask : err);
		}
	});

	Promise.all([p1, p2, p3])
		.then(
		function (data) {
			t.end();
		}
		).catch(
		function (err) {
			t.fail(err.stack ? err.stack : err);
			t.end();
		}
		);
});

test('\n\n ** Member queryByChaincode() tests **\n\n', function (t) {
	var m = new Member('does not matter', _chain);

	var p1 = m.queryByChaincode({
		chaincodeId: 'someid'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "targets" parameter');
	}, function (err) {
		if (err.message === 'Missing "targets" for endorser peer objects in the Transaction proposal request') {
			t.pass('Successfully caught missing targets error');
		} else {
			t.fail('Failed to catch the missing targets error. Error: ' + err.stack ? err.stask : err);
		}
	}).catch(function (err) {
		if (err.message === 'Missing "targets" for endorser peer objects in the Transaction proposal request') {
			t.pass('Successfully caught missing targets error');
		} else {
			t.fail('Failed to catch the missing targets error. Error: ' + err.stack ? err.stask : err);
		}
	});

	var p2 = m.queryByChaincode({
		targets: [hfc.getPeer('grpc://somehost.com:9000')]
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "chaincodePath" parameter');
	}, function (err) {
		if (err.message === 'Missing chaincodeId in the Transaction proposal request') {
			t.pass('Successfully caught missing chaincodeid error');
		} else {
			t.fail('Failed to catch the missing chaincodeid error. Error: ' + err.stack ? err.stask : err);
		}
	}).catch(function (err) {
		if (err.message === 'Missing chaincode ID in the Transaction proposal request') {
			t.pass('Successfully caught missing chaincodeid error');
		} else {
			t.fail('Failed to catch the missing chaincodeid error. Error: ' + err.stack ? err.stask : err);
		}
	});

	var p3 = m.queryByChaincode({
		targets: [hfc.getPeer('grpc://somehost.com:9000')],
		chaincodeId: 'someid'
	}).then(function () {
		t.fail('Should not have been able to resolve the promise because of missing "chaincodePath" parameter');
	}, function (err) {
		if (err.message === 'Missing arguments in Transaction proposal request') {
			t.pass('Successfully caught missing args error');
		} else {
			t.fail('Failed to catch the missing args error. Error: ' + err.stack ? err.stask : err);
		}
	}).catch(function (err) {
		if (err.message === 'Missing arguments in Transaction proposal request') {
			t.pass('Successfully caught missing args error');
		} else {
			t.fail('Failed to catch the missing args error. Error: ' + err.stack ? err.stask : err);
		}
	});

	Promise.all([p1, p2, p3])
		.then(
		function (data) {
			t.end();
		}
		).catch(
		function (err) {
			t.fail(err.stack ? err.stack : err);
			t.end();
		}
		);
});

test('\n\n ** Member sendTransaction() tests **\n\n', function (t) {
	var m = new Member('does not matter', _chain);
	_chain._orderer = undefined;
	var p1 = m.sendTransaction()
		.then(function () {
			t.fail('Should not have been able to resolve the promise because of missing parameters');
		}, function (err) {
			if (err.message === 'Missing proposalResponse object parameter') {
				t.pass('Successfully caught missing proposalResponse error');
			} else {
				t.fail('Failed to catch the missing object error. Error: ' + err.stack ? err.stask : err);
			}
		});

	var p2 = m.sendTransaction('data')
		.then(function () {
			t.fail('Should not have been able to resolve the promise because of missing parameters');
		}, function (err) {
			if (err.message === 'Missing chaincodeProposal object parameter') {
				t.pass('Successfully caught missing chaincodeProposal error');
			} else {
				t.fail('Failed to catch the missing objet error. Error: ' + err.stack ? err.stask : err);
			}
		});

	var p3 = m.sendTransaction('data', 'data')
		.then(function () {
			t.fail('Should not have been able to resolve the promise because of missing parameters');
		}, function (err) {
			if (err.message === 'no Orderer defined') {
				t.pass('Successfully caught missing orderer error');
			} else {
				t.fail('Failed to catch the missing order error. Error: ' + err.stack ? err.stask : err);
			}
		});

	Promise.all([p1, p2, p3])
		.then(
		function (data) {
			t.end();
		}
		).catch(
		function (err) {
			t.fail(err.stack ? err.stack : err);
			t.end();
		}
		);
});

var TEST_MSG = 'this is a test message';
var TEST_LONG_MSG = 'The Hyperledger project is an open source collaborative effort created to advance cross-industry blockchain technologies. ' +
	'It is a global collaboration including leaders in finance, banking, Internet of Things, supply chains, manufacturing and Technology. The Linux ' +
	'Foundation hosts Hyperledger as a Collaborative Project under the foundation. Why Create the Project? Not since the Web itself has a technology ' +
	'promised broader and more fundamental revolution than blockchain technology. A blockchain is a peer-to-peer distributed ledger forged by consensus, ' +
	'combined with a system for “smart contracts” and other assistive technologies. Together these can be used to build a new generation of transactional ' +
	'applications that establishes trust, accountability and transparency at their core, while streamlining business processes and legal constraints. ' +
	'Think of it as an operating system for marketplaces, data-sharing networks, micro-currencies, and decentralized digital communities. It has the potential ' +
	'to vastly reduce the cost and complexity of getting things done in the real world. Only an Open Source, collaborative software development approach can ' +
	'ensure the transparency, longevity, interoperability and support required to bring blockchain technologies forward to mainstream commercial adoption. That ' +
	'is what Hyperledger is about – communities of software developers building blockchain frameworks and platforms.';

var TEST_KEY_PRIVATE = '93f15b31e3c3f3bddcd776d9219e93d8559e31453757b79e193a793cbd239573';
var TEST_KEY_PUBLIC = '04f46815aa00fe2ba2814b906aa4ef1755caf152658de8997a6a858088296054baf45b06b2eba514bcbc37ae0c0cc7465115d36429d0e0bff23dc40e3760c10aa9';
var TEST_MSG_SIGNATURE_SHA2_256 = '3046022100a6460b29373fa16ee96172bfe04666140405fdef78182280545d451f08547736022100d9022fe620ceadabbef1714b894b8d6be4b74c0f9c573bd774871764f4f789c9';
var TEST_LONG_MSG_SIGNATURE_SHA2_256 = '3045022073266302d730b07499aabd0f88f12c8749a0f90144034dbc86a8cd742722ad29022100852346f93e50911008ab97afc452f83c5985a19fa3aa6d58f615c03bddaa90a1';

var jsrsa = require('jsrsasign');
var KEYUTIL = jsrsa.KEYUTIL;
var ECDSA = jsrsa.ECDSA;
var asn1 = jsrsa.asn1;

var ecdsaKey = require('../../lib/impl/ecdsa/key.js');

test('\n\n ** CryptoSuite_ECDSA_AES - function tests **\n\n', function (t) {
	resetDefaults();

	var cryptoUtils = utils.getCryptoSuite();

	t.equal(true, (typeof cryptoUtils._ecdsaCurve !== 'undefined' && typeof cryptoUtils._ecdsa !== 'undefined'),
		'CryptoSuite_ECDSA_AES function tests: default instance has "_ecdsaCurve" and "_ecdsa" properties');

	// test default curve 384 with SHA3_384
	t.equal(cryptoUtils.hash(TEST_MSG), '9e9c2e5edf6cbc0b512807a8efa2917daff71b83e04dee28fcc00b1a1dd935fb5afc5eafa06bf55bd64792a597e2a8f3',
		'CryptoSuite_ECDSA_AES function tests: using "SHA3" hashing algorithm with default key size which should be 384');

	t.equal(cryptoUtils.hash(TEST_LONG_MSG), '47a90d6721523682e09b81da0a60e6ee1faf839f0503252316638daf038cf682c0a842edaf310eb0f480a2e181a07af0',
		'CryptoSuite_ECDSA_AES function tests: using "SHA3" hashing algorithm with default key size which should be 384');

	cryptoUtils.generateKey()
		.then(function (key) {
			t.equal('secp384r1', key.getPublicKey()._key.curveName,
				'CryptoSuite_ECDSA_AES constructor tests: cryptoUtils generated public key curveName == secp384r1');

			// test curve 256 with SHA3_256
			utils.setConfigSetting('crypto-keysize', 256);
			cryptoUtils = utils.getCryptoSuite();
			return cryptoUtils.generateKey();
		})
		.then(function (key) {
			t.equal('secp256r1', key.getPublicKey()._key.curveName,
				'CryptoSuite_ECDSA_AES constructor tests: ccryptoUtils generated public key curveName == secp256r1');

			t.equal(cryptoUtils.hash(TEST_MSG), '7daeff454f7e91e3cd2d1c1bd5fcd1b6c9d4d5fffc6c327710d8fae7b06ee4a3',
				'CryptoSuite_ECDSA_AES function tests: using "SHA3" hashing algorithm with key size 256');

			t.equal(cryptoUtils.hash(TEST_LONG_MSG), '577174210438a85ae4311a62e5fccf2441b960013f5691993cdf38ed6ba0c84f',
				'CryptoSuite_ECDSA_AES function tests: using "SHA3" hashing algorithm with key size 256');

			// test SHA2_256
			utils.setConfigSetting('crypto-hash-algo', 'SHA2');
			cryptoUtils = utils.getCryptoSuite();

			t.equal(cryptoUtils.hash(TEST_MSG), '4e4aa09b6d80efbd684e80f54a70c1d8605625c3380f4cb012b32644a002b5be',
				'CryptoSuite_ECDSA_AES function tests: using "SHA2" hashing algorithm with key size 256');

			t.equal(cryptoUtils.hash(TEST_LONG_MSG), '0d98987f5e4e3ea611f0e3d768c594ff9aac25404265d73554d12c86d7f6fbbc',
				'CryptoSuite_ECDSA_AES function tests: using "SHA2" hashing algorithm with key size 256');


			return cryptoUtils.generateKey();
		})
		.then(function (key) {
			if (!!key._key)
				t.pass('CryptoSuite_ECDSA_AES function tests: verify generateKey return object');
			else
				t.fail('CryptoSuite_ECDSA_AES function tests: verify generateKey return object');

			utils.setConfigSetting('crypto-hash-algo', 'sha3'); //lower or upper case is allowed
			cryptoUtils = utils.getCryptoSuite();
			t.equal(cryptoUtils.hash(TEST_MSG), '7daeff454f7e91e3cd2d1c1bd5fcd1b6c9d4d5fffc6c327710d8fae7b06ee4a3',
				'CryptoSuite_ECDSA_AES function tests: using "SHA3" hashing algorithm with key size 256');

			// test generation options
			return cryptoUtils.generateKey({ ephemeral: true });
		})
		.then(function (key) {
			if (!!key._key)
				t.pass('CryptoSuite_ECDSA_AES function tests: verify generateKey ephemeral=true return object');
			else
				t.fail('CryptoSuite_ECDSA_AES function tests: verify generateKey ephemeral=true return object');

			t.throws(
				function () {
					utils.setConfigSetting('crypto-hash-algo', 'sha2');
					utils.setConfigSetting('crypto-keysize', 384);
					cryptoUtils = utils.getCryptoSuite();
				},
				/^Error: Unsupported/,
				'CryptoSuite_ECDSA_AES function tests: SHA2 and 384 should throw ' +
				'Error: Unsupported hash algorithm and security level pair sha2-384'
			);

			t.throws(
				function () {
					utils.setConfigSetting('crypto-keysize', 123);
					cryptoUtils = utils.getCryptoSuite();
				},
				/^Error: Illegal key size/,
				'CryptoSuite_ECDSA_AES function tests: setting key size 123 should throw Illegal level error'
			);

			t.throws(
				function () {
					utils.setConfigSetting('crypto-keysize', 256);
					utils.setConfigSetting('crypto-hash-algo', '12345');
					cryptoUtils = utils.getCryptoSuite();
				},
				/^Error: Unsupported hash algorithm/,
				'CryptoSuite_ECDSA_AES function tests: setting hash algo to 12345 should throw Illegal Hash function family'
			);

			utils.setConfigSetting('crypto-keysize', 256);
			utils.setConfigSetting('crypto-hash-algo', 'SHA3');
			cryptoUtils = utils.getCryptoSuite();
			return cryptoUtils.generateKey();
		})
		.then(function (key) {
			t.throws(
				function () {
					utils.setConfigSetting('crypto-keysize', 384);
					cryptoUtils = utils.getCryptoSuite();
					cryptoUtils.decrypt(key, 'fakeCipherText');
				},
				/^Error: Invalid key./,
				'CryptoSuite_ECDSA_AES function tests: decrypt should throw ' +
				'"Error: Invalid key. It\'s security does not match the current security level 384 256"'
			);

			utils.setConfigSetting('crypto-keysize', 256);
			utils.setConfigSetting('crypto-hash-algo', 'SHA3');
			cryptoUtils = utils.getCryptoSuite();
			return cryptoUtils.generateKey();
		})
		.then(function (key) {
			t.throws(
				function () {
					cryptoUtils.decrypt(key, 'fakeCipherText');
				},
				/^Error: Illegal cipherText length/,
				'CryptoSuite_ECDSA_AES function tests: decrypt should throw ' +
				'"Error: Illegal cipherText length: 14 must be > 97"'
			);

			utils.setConfigSetting('crypto-keysize', 256);
			utils.setConfigSetting('crypto-hash-algo', 'SHA3');
			cryptoUtils = utils.getCryptoSuite();
			return cryptoUtils.generateKey();
		})
		.then(function (key) {
			t.throws(
				function () {
					cryptoUtils.decrypt(key, '66616b654369706865725465787431323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536373839303132333435363738393031323334353637383930');
				},
				/^TypeError: Invalid hex string/,
				'CryptoSuite_ECDSA_AES function tests: sign() should throw ' +
				'"TypeError: Invalid hex string"'
			);

			t.throws(
				function () {
					cryptoUtils.sign();
				},
				/A valid key is required to sign/,
				'CryptoSuite_ECDSA_AES function tests: sign() should throw "A valid key is required to sign"'
			);

			t.throws(
				function () {
					cryptoUtils.sign('dummy key');
				},
				/A valid message is required to sign/,
				'CryptoSuite_ECDSA_AES function tests: sign() should throw "A valid message is required to sign"'
			);

			var testSignature = function (msg) {
				var sig = cryptoUtils.sign(key, msg);
				if (sig) {
					t.pass('Valid signature object generated from sign()');

					// using internal calls to verify the signature
					var pubKey = cryptoUtils._ecdsa.keyFromPublic(key.getPublicKey()._key.pubKeyHex, 'hex');
					// note that the signature is generated on the hash of the message, not the message itself
					t.equal(pubKey.verify(cryptoUtils.hash(msg), new Buffer(sig.toDER())), true,
						'CryptoSuite_ECDSA_AES function tests: sign() method produced proper signature that was successfully verified');
				} else {
					t.fail('Invalid signature generated by sign()');
				}
			};

			testSignature(TEST_MSG);
			testSignature(TEST_LONG_MSG);

			t.throws(
				function () {
					cryptoUtils.verify();
				},
				/A valid key is required to verify/,
				'CryptoSuite_ECDSA_AES function tests: verify() should throw "A valid key is required to verify"'
			);

			t.throws(
				function () {
					cryptoUtils.verify('dummy key');
				},
				/A valid signature is required to verify/,
				'CryptoSuite_ECDSA_AES function tests: verify() should throw "A valid signature is required to verify"'
			);

			t.throws(
				function () {
					cryptoUtils.verify('dummy key', 'dummy signature');
				},
				/A valid message is required to verify/,
				'CryptoSuite_ECDSA_AES function tests: verify() should throw "A valid message is required to verify"'
			);

			utils.setConfigSetting('crypto-keysize', 256);
			utils.setConfigSetting('crypto-hash-algo', 'SHA2');
			cryptoUtils = utils.getCryptoSuite();

			var testVerify = function (sig, msg) {
				// manually construct a key based on the saved privKeyHex and pubKeyHex
				var f = new ECDSA({ curve: 'secp256r1' });
				f.setPrivateKeyHex(TEST_KEY_PRIVATE);
				f.setPublicKeyHex(TEST_KEY_PUBLIC);
				f.isPrivate = true;
				f.isPublic = false;

				t.equal(cryptoUtils.verify(new ecdsaKey(f, 256), sig, msg), true,
					'CryptoSuite_ECDSA_AES function tests: verify() method');
			};

			testVerify(TEST_MSG_SIGNATURE_SHA2_256, TEST_MSG);
			testVerify(TEST_LONG_MSG_SIGNATURE_SHA2_256, TEST_LONG_MSG);

			t.end();
		})
		.catch(function (err) {
			t.fail('Unexpected error: ' + err.stack ? err.stack : err);
			t.end();
		});
});

test('\n\n ** ECDSA Key Impl tests **\n\n', function (t) {
	t.throws(
		function () {
			var k = new ecdsaKey('dummy private key');
		},
		/The ECDSA Key class requires the key size/,
		'ECDSA Impl test: catch missing key size'
	);

	t.throws(
		function () {
			var k = new ecdsaKey('dummy private key', 'dummy public key', 123);
		},
		/The ECDSA Key class only supports key sizes 256 and 384/,
		'ECDSA Impl test: catch invalid key size'
	);

	t.doesNotThrow(
		function () {
			var k = new ecdsaKey('dummy private key', 256);
		},
		null,
		'ECDSA Impl test: construct private key with size 256'
	);

	t.doesNotThrow(
		function () {
			var k = new ecdsaKey('dummy private key', 384);
		},
		null,
		'ECDSA Impl test: construct private key with size 384'
	);

	// test private keys
	var pair1 = KEYUTIL.generateKeypair('EC', 'secp256r1');
	var key1 = new ecdsaKey(pair1.prvKeyObj, 256);
	t.equal(key1.getSKI().length, 64, 'Checking generated SKI hash string for 256 curve keys');

	t.throws(
		function () {
			key1.toBytes();
		},
		/This is a private key/,
		'Checking that a private key instance does not allow toBytes()'
	);

	var pair2 = KEYUTIL.generateKeypair('EC', 'secp384r1');
	var key2 = new ecdsaKey(pair2.prvKeyObj, 384);
	t.equal(key2.getSKI().length, 96, 'Checking generated SKI hash string for 384 curve keys');

	t.equal(key1.isSymmetric() || key2.isSymmetric(), false, 'Checking if key is symmetric');
	t.equal(key1.isPrivate() && key2.isPrivate(), true, 'Checking if key is private');

	t.equal(key1.getPublicKey().isPrivate(), false, 'Checking isPrivate() logic');
	t.equal(key1.getPublicKey().toBytes().length, 182, 'Checking toBytes() output');

	//test CSR generation
	var pair3 = KEYUTIL.generateKeypair('EC', 'secp256r1');
	var key3 = new ecdsaKey(pair3.prvKeyObj, 256);
	var key4 = new ecdsaKey(pair3.pubKeyObj, 256);

	t.throws(
		function () {
			key4.generateCSR('CN=publickey');
		},
		/A CSR cannot be generated from a public key/,
		'Checking that a CSR cannot be generated from a public key'
	);

	//malformed subjectDN
	try {
		var csrPEM = key3.generateCSR('###############');
		t.fail('Should not have generated a CSR with a malformed subject');
	}
	catch (err) {
		t.pass('Checking that CSR is not generated for a malformed subject');
	};

	//valid CSR tests
	var csrObject;
	var subjectDN = 'CN=dummy';
	try {
		var csrPEM = key3.generateCSR(subjectDN);
		csrObject = asn1.csr.CSRUtil.getInfo(csrPEM);
	}
	catch (err) {
		t.fail('Failed to generate a CSR: ' + err);
	};

	t.equal(asn1.x509.X500Name.onelineToLDAP(csrObject.subject.name), subjectDN,
		'Checking CSR subject matches subject from request');

	t.equal(csrObject.pubkey.obj.pubKeyHex, key3.getPublicKey()._key.pubKeyHex,
		'Checking CSR public key matches requested public key');

	t.end();
});

test('\n\n ** Remote node tests **\n\n', function (t) {
	console.log('\n * REMOTE *');
	//Peer: secure grpcs, requires opts.pem
	var url = 'grpcs://' + aHostname + ':aport';
	var opts = { pem: aPem };
	var remote = null;
	t.doesNotThrow(
		function () {
			remote = new Remote(url, opts);
		},
		null,
		'Check not passing any GRPC options.'
	);

	opts = {};
	t.throws(
		function () {
			url = 'grpcs://' + aHostname + ':aport';
			remote = new Remote(url, opts);
		},
		/^Error: PEM encoded certificate is required./,
		'GRPCS Options tests: new Peer http should throw ' +
		'PEM encoded certificate is required.'
	);

	t.throws(
		function () {
			url = 'grpcs://' + aHostname + ':aport';
			remote = new Remote(url);
		},
		/^Error: PEM encoded certificate is required./,
		'GRPCS Options tests: new Peer http should throw ' +
		'PEM encoded certificate is required.'
	);

	opts = { pem: aPem, 'ssl-target-name-override': aHostnameOverride };
	remote = new Remote(url, opts);
	t.equal(aHostname, remote._endpoint.addr, 'GRPC Options tests: new Remote grpcs with opts created');
	t.equal(remote.toString(), ' Remote : {url:grpcs://' + aHostname + ':aport}', 'Checking that peer.toString() reports correctly');

	url = 'grpc://' + aHostname + ':aport';
	opts = null;
	remote = new Remote(url, opts);
	t.equal(aHostname, remote._endpoint.addr, 'GRPC Options tests: new Remote grpc with opts = null _endpoint.addr created');
	t.ok(remote._endpoint.creds, 'GRPC Options tests: new Remote grpc with opts = null _endpoint.creds created');

	opts = { pem: aPem, 'default-authority': 'some_ca' };
	remote = new Remote(url, opts);
	t.equal(aHostname, remote._endpoint.addr, 'GRPC Options tests: new Remote grpc with opts _endpoint.addr created');
	t.ok(remote._endpoint.creds, 'GRPC Options tests: new Remote grpc with opts _endpoint.creds created');
	t.equal(remote.getUrl(), url, 'checking that getURL works');

	console.log('\n * PEER *');
	//Peer: secure grpcs, requires opts.pem
	url = 'grpcs://' + aHostname + ':aport';
	opts = { pem: aPem };
	var peer = null;
	t.doesNotThrow(
		function () {
			peer = new Peer(url, opts);
		},
		null,
		'Check not passing any GRPC options.'
	);

	opts = { pem: aPem, 'ssl-target-name-override': aHostnameOverride };
	peer = new Peer(url, opts);
	t.equal(aHostname, peer._endpoint.addr, 'GRPC Options tests: new Peer grpcs with opts created');
	t.equal(peer.toString(), ' Peer : {url:grpcs://' + aHostname + ':aport}', 'Checking that peer.toString() reports correctly');
	//Peer: insecure grpc, opts.pem optional
	url = 'grpc://' + aHostname + ':aport';
	opts = null;
	peer = new Peer(url, opts);
	t.equal(aHostname, peer._endpoint.addr, 'GRPC Options tests: new Peer grpc with opts = null _endpoint.addr created');
	t.ok(peer._endpoint.creds, 'GRPC Options tests: new Peer grpc with opts = null _endpoint.creds created');

	opts = { pem: aPem, 'ssl-target-name-override': aHostnameOverride };
	peer = new Peer(url, opts);
	t.equal(aHostname, peer._endpoint.addr, 'GRPC Options tests: new Peer grpc with opts _endpoint.addr created');
	t.ok(peer._endpoint.creds, 'GRPC Options tests: new Peer grpc with opts _endpoint.creds created');
	t.equal(peer.getUrl(), url, 'checking that getURL works');

	t.throws(
		function () {
			url = 'http://' + aHostname + ':aport';
			peer = new Peer(url, opts);
		},
		/^InvalidProtocol: Invalid protocol: http./,
		'GRPC Options tests: new Peer http should throw ' +
		'InvalidProtocol: Invalid protocol: http. URLs must begin with grpc:// or grpcs://.'
	);

	opts = {};
	t.throws(
		function () {
			url = 'grpcs://' + aHostname + ':aport';
			peer = new Peer(url, opts);
		},
		/^Error: PEM encoded certificate is required./,
		'GRPCS Options tests: new Peer http should throw ' +
		'PEM encoded certificate is required.'
	);

	t.throws(
		function () {
			url = 'grpcs://' + aHostname + ':aport';
			peer = new Peer(url);
		},
		/^Error: PEM encoded certificate is required./,
		'GRPCS Options tests: new Peer http should throw ' +
		'PEM encoded certificate is required.'
	);

	console.log('\n * ORDERER *');
	//Peer: secure grpcs, requires opts.pem
	var url = 'grpcs://' + aHostname + ':aport';
	var opts = { pem: aPem };
	var orderer = null;
	t.doesNotThrow(
		function () {
			orderer = new Orderer(url, opts);
		},
		null,
		'Check not passing any GRPC options.'
	);

	opts = { pem: aPem, 'ssl-target-name-override': aHostnameOverride };
	orderer = new Orderer(url, opts);
	t.equal(aHostname, orderer._endpoint.addr, 'GRPC Options tests: new Orederer grpcs with opts created');
	t.equal(orderer.toString(), ' Orderer : {url:grpcs://' + aHostname + ':aport}', 'Checking that orderer.toString() reports correctly');
	//Peer: insecure grpc, opts.pem optional
	url = 'grpc://' + aHostname + ':aport';
	opts = null;
	orderer = new Orderer(url, opts);
	t.equal(aHostname, orderer._endpoint.addr, 'GRPC Options tests: new Orederer grpc with opts = null _endpoint.addr created');
	t.ok(orderer._endpoint.creds, 'GRPC Options tests: new orderer grpc with opts = null _endpoint.creds created');

	opts = { pem: aPem, 'ssl-target-name-override': aHostnameOverride };
	orderer = new Orderer(url, opts);
	t.equal(aHostname, orderer._endpoint.addr, 'GRPC Options tests: new Orederer grpc with opts _endpoint.addr created');
	t.ok(orderer._endpoint.creds, 'GRPC Options tests: new orderer grpc with opts _endpoint.creds created');

	opts = { pem: aPem, 'request-timeout': 2000 };
	orderer = new Orderer(url, opts);
	t.equals(orderer._request_timeout, 2000, 'checking that the request timeout was set using the passed in value');

	t.throws(
		function () {
			url = 'http://' + aHostname + ':aport';
			orderer = new Orderer(url, opts);
		},
		/^InvalidProtocol: Invalid protocol: http./,
		'GRPC Options tests: new orderer http should throw ' +
		'InvalidProtocol: Invalid protocol: http. URLs must begin with grpc:// or grpcs://.'
	);

	opts = {};
	t.throws(
		function () {
			url = 'grpcs://' + aHostname + ':aport';
			orderer = new Orderer(url, opts);
		},
		/^Error: PEM encoded certificate is required./,
		'GRPCS Options tests: new Peer http should throw ' +
		'PEM encoded certificate is required.'
	);

	t.throws(
		function () {
			url = 'grpcs://' + aHostname + ':aport';
			orderer = new Orderer(url);
		},
		/^Error: PEM encoded certificate is required./,
		'GRPCS Options tests: new Peer http should throw ' +
		'PEM encoded certificate is required.'
	);

	t.end();
});

// Logger tests /////////
function testLogger(t, ignoreLevels) {
	var output = '';

	let unhook = intercept(function (txt) {
		output += txt;
	});

	let log = utils.getLogger('testlogger');
	log.error('Test logger - error');
	log.warn('Test logger - warn');
	log.info('Test logger - info');
	log.debug('Test logger - debug');

	unhook();

	if (output.indexOf('Test logger - error') > 0 &&
		output.indexOf('Test logger - warn') > 0 &&
		output.indexOf('Test logger - info') > 0) {
		if (output.indexOf('Test logger - debug') > 0 && !ignoreLevels) {
			t.fail('Default logger setting should not have printed debug logs');
		} else {
			t.pass('Successfully tested default logger levels');
		}
	} else {
		t.fail('Failed to test default logger levels: info, warn and error');
	}
}

test('\n\n ** Logging utility tests - built-in logger **\n\n', function (t) {
	// test 1: default logging levels for console logging
	testLogger(t);

	// test 2: custom logging levels for console logging
	var output = '';
	// setup the environment *ignore this*
	process.env.HFC_LOGGING = "{'debug': 'console'}"; // eslint-disable-line quotes
	// internal call. clearing the cached config.
	global.hfc.config = undefined;
	// internal call. clearing the cached logger.
	global.hfc.logger = undefined;
	try {
		let unhook = intercept(function (txt) {
			output += txt;
		});

		let logger = utils.getLogger('testlogger');

		unhook();

		if (output.indexOf('Failed to parse environment variable "HFC_LOGGING"') > 0 && logger) {
			t.pass('Successfully caught error thrown by "utils.getLogger()" on invalid environment variable value, and returned a valid default logger');
		} else {
			t.fail('Failed to catch invalid environment variable value or return a valid default logger');
		}
	} catch (err) {
		t.fail('Failed to properly handle invalid environment variable value. ' + err.stack ? err.stack : err);
	}


	output = '';
	// setup the environment
	process.env.HFC_LOGGING = '{"debug": "console"}';
	// internal call. clearing the cached config.
	global.hfc.config = undefined;
	// internal call. clearing the cached logger.
	global.hfc.logger = undefined;

	let unhook = intercept(function (txt) {
		output += txt;
	});

	let log = utils.getLogger('testlogger');
	log.error('Test logger - error');
	log.warn('Test logger - warn');
	log.info('Test logger - info');
	log.debug('Test logger - debug');

	unhook();

	if (output.indexOf('Test logger - error') > 0 &&
		output.indexOf('Test logger - warn') > 0 &&
		output.indexOf('Test logger - info') > 0 &&
		output.indexOf('Test logger - debug') > 0) {
		t.pass('Successfully tested debug logger levels');
	} else {
		t.fail('Failed to test debug logger levels. All of info, warn and error message should have appeared in console');
	}

	output = '';
	// setup the environment
	process.argv.push('--hfc-logging={"debug": "console"}');
	// internal call. clearing the cached config.
	global.hfc.config = undefined;
	// internal call. clearing the cached logger.
	global.hfc.logger = undefined;

	unhook = intercept(function (txt) {
		output += txt;
	});

	log = utils.getLogger('testlogger');
	log.error('Test logger - error');
	log.warn('Test logger - warn');
	log.info('Test logger - info');
	log.debug('Test logger - debug');

	unhook();

	if (output.indexOf('Test logger - error') > 0 &&
		output.indexOf('Test logger - warn') > 0 &&
		output.indexOf('Test logger - info') > 0 &&
		output.indexOf('Test logger - debug') > 0) {
		t.pass('Successfully tested debug logger levels');
	} else {
		t.fail('Failed to test debug logger levels. All of info, warn and error message should have appeared in console');
	}


	let prepareEmptyFile = function (logPath) {
		try {
			let stats = fs.statSync(logPath);

			if (stats.isFile()) {
				fs.truncateSync(logPath);
			}
		} catch (err) {
			if (err.code == 'ENOENT') {
				try {
					// file doesn't exist, create new
					let stats = fs.statSync(path.dirname(logPath));

					if (stats.isDirectory()) {
						fs.writeFileSync(logPath, '');
					}
				} catch (err) {
					if (err.code == 'ENOENT') {
						// create the dir
						fs.mkdirSync(path.dirname(logPath));
						fs.writeFileSync(logPath, '');
					}
				}
			} else {
				t.fail('Can not create an empty file to prepare for the rest of this test. ' + err.stack ? err.stack : err);
				t.end();
			}
		}
	};

	let debugPath = '/tmp/hfc-log/debug.log';
	let errorPath = '/tmp/hfc-log/error.log';
	prepareEmptyFile(debugPath);
	prepareEmptyFile(errorPath);

	hfc.setConfigSetting('hfc-logging', util.format('{"debug": "%s", "error": "%s"}', debugPath, errorPath));
	// internal call. clearing the cached logger.
	global.hfc.logger = undefined;
	var log1 = utils.getLogger('testlogger');
	log1.error('Test logger - error');
	log1.warn('Test logger - warn');
	log1.info('Test logger - info');
	log1.debug('Test logger - debug');

	setTimeout(function () {
		var data = fs.readFileSync(debugPath);

		if (data.indexOf('Test logger - error') > 0 &&
			data.indexOf('Test logger - warn') > 0 &&
			data.indexOf('Test logger - info') > 0 &&
			data.indexOf('Test logger - debug') > 0) {
			t.pass('Successfully tested logging to debug file');
		} else {
			t.fail('Failed to validate content in debug log file');
		}

		data = fs.readFileSync(errorPath);

		if (data.indexOf('Test logger - error') > 0) {
			if (data.indexOf('Test logger - warn') > 0 ||
				data.indexOf('Test logger - info') > 0 ||
				data.indexOf('Test logger - debug') > 0) {
				t.fail('Failed testing logging to error file, it should not contain any debug, info or warn messages.');
			} else {
				t.pass('Successfully tested logging to error file');
			}
		} else {
			t.fail('Failed to validate content in error log file');
		}

		t.end();
	}, 1000);
});

test('\n\n ** Logging utility tests - test setting an external logger based on bunyan **\n\n', function (t) {
	var logger = bunyan.createLogger({ name: 'bunyanLogger' });
	hfc.setLogger(logger);

	testLogger(t);
	t.end();
});

test('\n\n ** Logging utility tests - test setting an external logger based on log4js **\n\n', function (t) {
	var logger = log4js.getLogger();
	hfc.setLogger(logger);

	testLogger(t, true);
	t.end();
});

test('\n\n ** Logging utility tests - test setting an invalid external logger **\n\n', function (t) {
	// construct an invalid logger
	var logger = {
		inf: function () { console.log('info'); },
	};

	try {
		hfc.setLogger(logger);
		t.fail('Should not have allowed an invalid logger to be set');
		t.end();
	} catch (err) {
		var er1 = err.toString();
		if (er1.indexOf('debug()') > 0 &&
			er1.indexOf('info()') > 0 &&
			er1.indexOf('warn()') > 0 &&
			er1.indexOf('error()') > 0) {
			t.pass('Successfully tested thrown error for an invalid logger to set on the HFC SDK');
			t.end();
		} else {
			t.fail('Failed to catch all errors for an invalid logger missing required methods');
			t.end();
		}
	}
});

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function cleanupFileKeyValueStore(keyValStorePath) {
	var absPath = getAbsolutePath(keyValStorePath);
	var exists = utils.existsSync(absPath);
	if (exists) {
		execSync('rm -rf ' + absPath);
	}
}

// prepend absolute path where this test is running, then join to the relative path
function getAbsolutePath(dir) {
	return path.join(process.cwd(), getRelativePath(dir));
}

// get relative file path for either Unix or Windows
// unix relative path does not start with '/'
// windows relative path starts with '/'
function getRelativePath(dir /*string*/) {
	if (/^win/.test(process.platform)) {
		if (!(dir.toString().substr(0, 1) === '/')) dir = '/' + dir;
		dir = path.resolve(dir);
		dir = dir.replace(/([A-Z]:[\\\/]).*?/gi, '');
		return dir;
	} else {
		if (dir.toString().substr(0, 1) === '/') dir = dir.substr(1);
		return dir;
	}
}

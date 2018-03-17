// ============================================================================================================================
// 													startup_lib.js
// This file has the functions we call during start up
// ============================================================================================================================
var async = require('async');

module.exports = function (logger, helper, fcw, marbles_lib, ws_server) {
	var startup_lib = {};
	var enrollObj = {};
	var misc = require('./misc.js')(logger);					//random non-blockchain related functions
	var more_entropy = misc.randStr(32);

	// --------------------------------------------------------
	// Handle WS Setup Messages
	// --------------------------------------------------------
	startup_lib.setup_ws_steps = function (data) {

		// --- [6] Enroll the admin (repeat if needed)  --- //
		if (data.configure === 'enrollment') {
			startup_lib.removeKVS();
			helper.write(data);													//write new config data to file
			startup_lib.enroll_admin(1, function (e) {
				if (e == null) {
					startup_lib.setup_marbles_lib(function () {
						startup_lib.detect_prev_startup({ startup: false }, function (err) {
							if (err) {
								startup_lib.create_assets(helper.getMarbleUsernames()); 	//builds marbles, then starts webapp
							}
						});
					});
				}
			});
		}

		// --- [7] Find instantiated chaincode --- //
		else if (data.configure === 'find_chaincode') {
			helper.write(data);													//write new config data to file
			startup_lib.enroll_admin(1, function (e) {										//re-enroll b/c we may be using new peer/order urls
				if (e == null) {
					startup_lib.setup_marbles_lib(function () {
						startup_lib.detect_prev_startup({ startup: true }, function (err) {
							if (err) {
								startup_lib.create_assets(helper.getMarbleUsernames()); 	//builds marbles, then starts webapp
							}
						});
					});
				}
			});
		}

		// --- [8] Register marble owners --- /
		else if (data.configure === 'register') {
			startup_lib.create_assets(data.build_marble_owners);
		}
	};


	// Wait for the user to help correct the config file so we can startup!
	startup_lib.startup_unsuccessful = function (host, port) {
		process.env.app_first_setup = 'yes';
		console.log('');
		logger.info('Detected that we have NOT launched successfully yet');
		logger.debug('Open your browser to http://' + host + ':' + port + ' and login as "admin" to initiate startup\n\n');
		// we wait here for the user to go the browser, then setup_marbles_lib() will be called from WS msg
	};

	// Find if marbles has started up successfully before
	startup_lib.detect_prev_startup = function (opts, cb) {
		logger.info('Checking ledger for marble owners listed in the config file');
		marbles_lib.read_everything(null, function (err, resp) {			//read the ledger for marble owners
			if (err != null) {
				logger.warn('Error reading ledger');
				if (cb) cb(true);
			} else {
				if (startup_lib.find_missing_owners(resp)) {							//check if each user in the settings file has been created in the ledger
					logger.info('We need to make marble owners');			//there are marble owners that do not exist!
					ws_server.broadcast_state('register_owners', 'waiting');
					if (cb) cb(true);
				} else {
					ws_server.broadcast_state('register_owners', 'success');			//everything is good
					process.env.app_first_setup = 'no';
					logger.info('Everything is in place');
					if (cb) cb(null);
				}
			}
		});
	};

	// Detect if there are marble usernames in the settings doc that are not in the ledger
	startup_lib.find_missing_owners = function (resp) {
		let ledger = (resp) ? resp.parsed : [];
		let user_base = helper.getMarbleUsernames();

		for (let x in user_base) {
			let found = false;
			logger.debug('Looking for marble owner:', user_base[x]);
			for (let i in ledger.owners) {
				if (user_base[x] === ledger.owners[i].username) {
					found = true;
					break;
				}
			}
			if (found === false) {
				logger.debug('Did not find marble username:', user_base[x]);
				return true;
			}
		}
		return false;
	};

	//setup marbles library and check if cc is instantiated
	startup_lib.setup_marbles_lib = function (host, port, cb) {
		var opts = helper.makeMarblesLibOptions();
		marbles_lib = require('./marbles_cc_lib.js')(enrollObj, opts, fcw, logger);
		ws_server.setup(null, marbles_lib);

		logger.debug('Checking if chaincode is already instantiated or not');
		const channel = helper.getFirstChannelId();
		const first_peer = helper.getFirstPeerName(channel);
		var options = {
			peer_urls: [helper.getPeersUrl(first_peer)],
		};
		marbles_lib.check_if_already_instantiated(options, function (not_instantiated, enrollUser) {
			if (not_instantiated) {									//if this is truthy we have not yet instantiated.... error
				console.log('');
				logger.debug('Chaincode was not detected: "' + helper.getChaincodeId() + '", all stop');
				logger.debug('Open your browser to http://' + host + ':' + port + ' and login to tweak settings for startup');
				process.env.app_first_setup = 'yes';				//overwrite state, bad startup
				ws_server.broadcast_state('find_chaincode', 'failed');
			}
			else {													//else we already instantiated
				console.log('\n----------------------------- Chaincode found on channel "' + helper.getFirstChannelId() + '" -----------------------------\n');

				// --- Check Chaincode Compatibility  --- //
				marbles_lib.check_version(options, function (err, resp) {
					if (helper.errorWithVersions(resp)) {
						ws_server.broadcast_state('find_chaincode', 'failed');
					} else {
						logger.info('Chaincode version is good');
						ws_server.broadcast_state('find_chaincode', 'success');
						if (cb) cb(null);
					}
				});
			}
		});
	};

	// Enroll an admin with the CA for this peer/channel
	startup_lib.enroll_admin = function (attempt, cb) {
		fcw.enroll(helper.makeEnrollmentOptions(0), function (errCode, obj) {
			if (errCode != null) {
				logger.error('could not enroll...');

				// --- Try Again ---  //
				if (attempt >= 2) {
					if (cb) cb(errCode);
				} else {
					startup_lib.removeKVS();
					startup_lib.enroll_admin(++attempt, cb);
				}
			} else {
				enrollObj = obj;
				if (cb) cb(null);
			}
		});
	};

	// Create marbles and marble owners, owners first
	startup_lib.create_assets = function (build_marbles_users) {
		build_marbles_users = misc.saferNames(build_marbles_users);
		logger.info('Creating marble owners and marbles');
		var owners = [];

		if (build_marbles_users && build_marbles_users.length > 0) {
			async.each(build_marbles_users, function (username, owner_cb) {
				logger.debug('- creating marble owner: ', username);

				// --- Create Each User --- //
				startup_lib.create_owners(0, username, function (errCode, resp) {
					owners.push({ id: resp.id, username: username });
					owner_cb();
				});

			}, function (err) {
				logger.info('finished creating owners, now for marbles');
				if (err == null) {

					var marbles = [];
					var marblesEach = 3;												//number of marbles each owner gets
					for (var i in owners) {
						for (var x = 0; x < marblesEach; x++) {
							marbles.push(owners[i]);
						}
					}
					logger.debug('prepared marbles obj', marbles.length, marbles);

					// --- Create Marbles--- //
					setTimeout(function () {
						async.each(marbles, function (owner_obj, marble_cb) { 			//iter through each one
							startup_lib.create_marbles(owner_obj.id, owner_obj.username, marble_cb);
						}, function (err) {												//marble owner creation finished
							logger.debug('- finished creating asset');
							if (err == null) {
								startup_lib.all_done();												//delay for peer catch up
							}
						});
					}, helper.getBlockDelay());
				}
			});
		}
		else {
			logger.debug('- there are no new marble owners to create');
			startup_lib.all_done();
		}
	};

	// Create the marble owner
	startup_lib.create_owners = function (attempt, username, cb) {
		const channel = helper.getFirstChannelId();
		const first_peer = helper.getFirstPeerName(channel);
		var options = {
			peer_urls: [helper.getPeersUrl(first_peer)],
			args: {
				marble_owner: username,
				owners_company: process.env.marble_company
			}
		};
		marbles_lib.register_owner(options, function (e, resp) {
			if (e != null) {
				console.log('');
				logger.error('error creating the marble owner', e, resp);
				cb(e, resp);
			}
			else {
				cb(null, resp);
			}
		});
	};

	// Create 1 marble
	startup_lib.create_marbles = function (owner_id, username, cb) {
		var randOptions = startup_lib.build_marble_options(owner_id, username, process.env.marble_company);
		const channel = helper.getFirstChannelId();
		const first_peer = helper.getFirstPeerName(channel);
		console.log('');
		logger.debug('[startup] going to create marble:', randOptions);
		var options = {
			chaincode_id: helper.getChaincodeId(),
			peer_urls: [helper.getPeersUrl(first_peer)],
			args: randOptions
		};
		marbles_lib.create_a_marble(options, function () {
			return cb();
		});
	};

	// Create random marble arguments (it is not important for it to be random, just more fun)
	startup_lib.build_marble_options = function (id, username, company) {
		var colors = ['white', 'green', 'blue', 'purple', 'red', 'pink', 'orange', 'black', 'yellow'];
		var sizes = ['35', '16'];
		var color_index = misc.simple_hash(more_entropy + company) % colors.length;		//build a pseudo random index to pick a color
		var size_index = misc.getRandomInt(0, sizes.length);							//build a random size for this marble
		return {
			color: colors[color_index],
			size: sizes[size_index],
			owner_id: id,
			auth_company: process.env.marble_company
		};
	};

	// Clean Up OLD KVS
	startup_lib.removeKVS = function () {
		try {
			logger.warn('removing older kvs and trying to enroll again');
			misc.rmdir(helper.getKvsPath({ going2delete: true }));			//delete old kvs folder
			logger.warn('removed older kvs');
		} catch (e) {
			logger.error('could not delete old kvs', e);
		}
	};

	// We are done, inform the clients
	startup_lib.all_done = function () {
		console.log('\n------------------------------------------ All Done ------------------------------------------\n');
		ws_server.broadcast_state('register_owners', 'success');
		process.env.app_first_setup = 'no';

		ws_server.check_for_updates(null);									//call the periodic task to get the state of everything
	};

	return startup_lib;
};

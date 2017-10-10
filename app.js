'use strict';
/* global process */
/* global __dirname */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 *******************************************************************************/
var express = require('express');
var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var cookieParser = require('cookie-parser');
var http = require('http');
var app = express();
var cors = require('cors');
var async = require('async');
var ws = require('ws');											//websocket module 
var winston = require('winston');								//logger module

// --- Get Our Modules --- //
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
		new (winston.transports.Console)({ colorize: true }),
	]
});
var misc = require('./utils/misc.js')(logger);					//random non-blockchain related functions
misc.check_creds_for_valid_json();
var helper = require(__dirname + '/utils/helper.js')(process.env.creds_filename, logger);				//parses our blockchain config file
var fcw = require('./utils/fc_wrangler/index.js')({ block_delay: helper.getBlockDelay() }, logger);		//fabric client wrangler wraps the SDK
var ws_server = require('./utils/websocket_server_side.js')({ block_delay: helper.getBlockDelay() }, fcw, logger);	//websocket logic

// ------------- Init ------------- //
var more_entropy = misc.randStr(32);
var host = 'localhost';
var port = helper.getMarblesPort();
var wss = {};
var enrollObj = null;
var marbles_lib = null;
process.env.marble_company = helper.getCompanyName();
var start_up_states = {												//Marbles Startup Steps
	checklist: { state: 'waiting', step: 'step1' },					// Step 1 - check config files for somewhat correctness
	enrolling: { state: 'waiting', step: 'step2' },					// Step 2 - enroll the admin
	find_chaincode: { state: 'waiting', step: 'step3' },			// Step 3 - find the chaincode on the channel
	register_owners: { state: 'waiting', step: 'step4' },			// Step 4 - create the marble owners
};

// ------------- Bluemix Host Detection ------------- //
if (process.env.VCAP_APPLICATION) {
	host = '0.0.0.0';												//overwrite defaults
	port = process.env.PORT;
}

// --- Module Setup --- //
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(cookieParser());
app.use(serve_static(path.join(__dirname, 'public')));
app.use(session({ secret: 'lostmymarbles', resave: true, saveUninitialized: true }));
app.options('*', cors());
app.use(cors());

//---------------------
// Cache Busting Hash
//---------------------
process.env.cachebust_js = Date.now();
process.env.cachebust_css = Date.now();
logger.debug('cache busting hash js', process.env.cachebust_js, 'css', process.env.cachebust_css);

// ============================================================================================================================
// 													Webserver Routing
// ============================================================================================================================
app.use(function (req, res, next) {
	logger.debug('------------------------------------------ incoming request ------------------------------------------');
	logger.debug('New ' + req.method + ' request for', req.url);
	req.bag = {};																			//create object for my stuff
	req.bag.session = req.session;
	next();
});
app.use('/', require('./routes/site_router'));

// ------ Error Handling --------
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
app.use(function (err, req, res, next) {
	logger.debug('Errors -', req.url);
	var errorCode = err.status || 500;
	res.status(errorCode);
	req.bag.error = { msg: err.stack, status: errorCode };
	if (req.bag.error.status == 404) req.bag.error.msg = 'Sorry, I cannot locate that file';
	res.render('template/error', { bag: req.bag });
});


// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function () { });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('\n');
console.log('----------------------------------- Server Up - ' + host + ':' + port + ' -----------------------------------');
process.on('uncaughtException', function (err) {
	logger.error('Caught exception: ', err.stack);		//demos never give up
	if (err.stack.indexOf('EADDRINUSE') >= 0) {			//except for this error
		logger.warn('---------------------------------------------------------------');
		logger.warn('----------------------------- Ah! -----------------------------');
		logger.warn('---------------------------------------------------------------');
		logger.error('You already have something running on port ' + port + '!');
		logger.error('Kill whatever is running on that port OR change the port setting in your marbles config file: ' + helper.config_path);
		process.exit();
	}
});
// ============================================================================================================================
// 														Warning
// ============================================================================================================================

// ============================================================================================================================
// 														Entering
// ============================================================================================================================

// ============================================================================================================================
// 														Work Area
// ============================================================================================================================

// ------------------------------------------------------------------------------------------------------------------------------
// Life Starts Here!
// ------------------------------------------------------------------------------------------------------------------------------
process.env.app_first_setup = 'yes';				//init
let config_error = helper.checkConfig();
setupWebSocket();

if (config_error) {
	broadcast_state('checklist', 'failed');			//checklist step is done
} else {
	broadcast_state('checklist', 'success');		//checklist step is done
	console.log('\n');
	logger.info('Using settings in ' + process.env.creds_filename + ' to see if we have launch marbles before...');

	// --- Go Go Enrollment --- //
	enroll_admin(1, function (e) {
		if (e != null) {
			logger.warn('Error enrolling admin');
			broadcast_state('enrolling', 'failed');
			startup_unsuccessful();
		} else {
			logger.info('Success enrolling admin');
			broadcast_state('enrolling', 'success');

			// --- Setup Marbles Library --- //
			setup_marbles_lib(function () {

				// --- Check If We have Started Marbles Before --- //
				detect_prev_startup({ startup: true }, function (err) {
					if (err) {
						startup_unsuccessful();
					} else {
						console.log('\n');
						logger.debug('Detected that we have launched successfully before');
						logger.debug('Welcome back - Marbles is ready');
						logger.debug('Open your browser to http://' + host + ':' + port + ' and login as "admin"\n\n');
					}
				});
			});
		}
	});
}

// Wait for the user to help correct the config file so we can startup!
function startup_unsuccessful() {
	process.env.app_first_setup = 'yes';
	console.log('');
	logger.info('Detected that we have NOT launched successfully yet');
	logger.debug('Open your browser to http://' + host + ':' + port + ' and login as "admin" to initiate startup\n\n');
	// we wait here for the user to go the browser, then setup_marbles_lib() will be called from WS msg
}

// Find if marbles has started up successfully before
function detect_prev_startup(opts, cb) {
	logger.info('Checking ledger for marble owners listed in the config file');
	marbles_lib.read_everything(null, function (err, resp) {			//read the ledger for marble owners
		if (err != null) {
			logger.warn('Error reading ledger');
			if (cb) cb(true);
		} else {
			if (find_missing_owners(resp)) {							//check if each user in the settings file has been created in the ledger
				logger.info('We need to make marble owners');			//there are marble owners that do not exist!
				broadcast_state('register_owners', 'waiting');
				if (cb) cb(true);
			} else {
				broadcast_state('register_owners', 'success');			//everything is good
				process.env.app_first_setup = 'no';
				logger.info('Everything is in place');
				if (cb) cb(null);
			}
		}
	});
}

// Detect if there are marble usernames in the settings doc that are not in the ledger
function find_missing_owners(resp) {
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
}

//setup marbles library and check if cc is instantiated
function setup_marbles_lib(cb) {
	var opts = helper.makeMarblesLibOptions();
	marbles_lib = require('./utils/marbles_cc_lib.js')(enrollObj, opts, fcw, logger);
	ws_server.setup(wss.broadcast, marbles_lib);

	logger.debug('Checking if chaincode is already instantiated or not');
	const channel = helper.getChannelId();
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
			broadcast_state('find_chaincode', 'failed');
		}
		else {													//else we already instantiated
			console.log('\n----------------------------- Chaincode found on channel "' + helper.getChannelId() + '" -----------------------------\n');

			// --- Check Chaincode Compatibility  --- //
			marbles_lib.check_version(options, function (err, resp) {
				if (helper.errorWithVersions(resp)) {
					broadcast_state('find_chaincode', 'failed');
				} else {
					logger.info('Chaincode version is good');
					broadcast_state('find_chaincode', 'success');
					if (cb) cb(null);
				}
			});
		}
	});
}

// Enroll an admin with the CA for this peer/channel
function enroll_admin(attempt, cb) {
	fcw.enroll(helper.makeEnrollmentOptions(0), function (errCode, obj) {
		if (errCode != null) {
			logger.error('could not enroll...');

			// --- Try Again ---  //
			if (attempt >= 2) {
				if (cb) cb(errCode);
			} else {
				removeKVS();
				enroll_admin(++attempt, cb);
			}
		} else {
			enrollObj = obj;
			if (cb) cb(null);
		}
	});
}

// Create marbles and marble owners, owners first
function create_assets(build_marbles_users) {
	build_marbles_users = misc.saferNames(build_marbles_users);
	logger.info('Creating marble owners and marbles');
	var owners = [];

	if (build_marbles_users && build_marbles_users.length > 0) {
		async.each(build_marbles_users, function (username, owner_cb) {
			logger.debug('- creating marble owner: ', username);

			// --- Create Each User --- //
			create_owners(0, username, function (errCode, resp) {
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
						create_marbles(owner_obj.id, owner_obj.username, marble_cb);
					}, function (err) {												//marble owner creation finished
						logger.debug('- finished creating asset');
						if (err == null) {
							all_done();												//delay for peer catch up
						}
					});
				}, helper.getBlockDelay());
			}
		});
	}
	else {
		logger.debug('- there are no new marble owners to create');
		all_done();
	}
}

// Create the marble owner
function create_owners(attempt, username, cb) {
	const channel = helper.getChannelId();
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
}

// Create 1 marble
function create_marbles(owner_id, username, cb) {
	var randOptions = build_marble_options(owner_id, username, process.env.marble_company);
	const channel = helper.getChannelId();
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
}

// Create random marble arguments (it is not important for it to be random, just more fun)
function build_marble_options(id, username, company) {
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
}

// Clean Up OLD KVS
function removeKVS() {
	try {
		logger.warn('removing older kvs and trying to enroll again');
		misc.rmdir(helper.getKvsPath({ going2delete: true }));			//delete old kvs folder
		logger.warn('removed older kvs');
	} catch (e) {
		logger.error('could not delete old kvs', e);
	}
}

// We are done, inform the clients
function all_done() {
	console.log('\n------------------------------------------ All Done ------------------------------------------\n');
	broadcast_state('register_owners', 'success');
	process.env.app_first_setup = 'no';

	ws_server.check_for_updates(null);									//call the periodic task to get the state of everything
}

// Message to client to communicate where we are in the start up
function build_state_msg() {
	return {
		msg: 'app_state',
		state: start_up_states,
		first_setup: process.env.app_first_setup
	};
}

// Send to all connected clients
function broadcast_state(change_state, outcome) {
	try {
		start_up_states[change_state].state = outcome;
		wss.broadcast(build_state_msg());								//tell client our app state
	} catch (e) { }														//this is expected to fail for "checking"
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function setupWebSocket() {
	console.log('------------------------------------------ Websocket Up ------------------------------------------');
	wss = new ws.Server({ server: server });								//start the websocket now
	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			console.log(' ');
			console.log('-------------------------------- Incoming WS Msg --------------------------------');
			logger.debug('[ws] received ws msg:', message);
			var data = null;
			try {
				data = JSON.parse(message);
			}
			catch (e) {
				logger.debug('[ws] message error', message, e.stack);
			}
			if (data && data.type == 'setup') {
				logger.debug('[ws] setup message', data);

				//enroll admin
				if (data.configure === 'enrollment') {
					removeKVS();
					helper.write(data);													//write new config data to file
					enroll_admin(1, function (e) {
						if (e == null) {
							setup_marbles_lib(function () {
								detect_prev_startup({ startup: false }, function (err) {
									if (err) {
										create_assets(helper.getMarbleUsernames()); 	//builds marbles, then starts webapp
									}
								});
							});
						}
					});
				}

				//find instantiated chaincode
				else if (data.configure === 'find_chaincode') {
					helper.write(data);													//write new config data to file
					enroll_admin(1, function (e) {										//re-enroll b/c we may be using new peer/order urls
						if (e == null) {
							setup_marbles_lib(function () {
								detect_prev_startup({ startup: true }, function (err) {
									if (err) {
										create_assets(helper.getMarbleUsernames()); 	//builds marbles, then starts webapp
									}
								});
							});
						}
					});
				}

				//register marble owners
				else if (data.configure === 'register') {
					create_assets(data.build_marble_owners);
				}
			}
			else if (data) {
				ws_server.process_msg(ws, data);							//pass the websocket msg for processing
			}
		});

		ws.on('error', function (e) { logger.debug('[ws] error', e); });
		ws.on('close', function () { logger.debug('[ws] closed'); });
		ws.send(JSON.stringify(build_state_msg()));							//tell client our app state
	});

	// --- Send To All Connected Clients --- //
	wss.broadcast = function broadcast(data) {
		var i = 0;
		wss.clients.forEach(function each(client) {
			try {
				logger.debug('[ws] broadcasting to clients. ', (++i), data.msg);
				client.send(JSON.stringify(data));
			}
			catch (e) {
				logger.debug('[ws] error broadcast ws', e);
			}
		});
	};
}

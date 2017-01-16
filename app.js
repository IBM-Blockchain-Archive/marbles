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
var bodyParser = require('body-parser');
var http = require('http');
var app = express();
var url = require('url');
var fs = require('fs');
var cors = require('cors');
var async = require('async');
var ws = require('ws');													//websocket module
var block_delay = 2000;

// --- Set Our Things --- //
var hfc = require('hfc');
var more_entropy = randStr(32);
var ws_server = require('./utils/websocket_server_side.js')(null, null, null);
var helper = require(__dirname + '/utils/helper.js')(process.env.creds_filename, console);
var host = 'localhost';
var port = helper.getMarblesPort();
var wss = {};
process.env.marble_company = helper.getCompanyName();

// ------------- Bluemix Detection ------------- //
if(process.env.VCAP_APPLICATION){
	host = '0.0.0.0';							//overwrite defaults
	port = process.env.PORT;
}

// --- Pathing and Module Setup --- //
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('.html', require('jade').__express);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use( serve_static(path.join(__dirname, 'public')) );
app.use( session({secret:'Somethignsomething1234!test', resave:true, saveUninitialized:true}) );
app.options('*', cors());
app.use(cors());

//---------------------
// Cache Busting Hash
//---------------------
var bust_js = require('./busters_js.json');
var bust_css = require('./busters_css.json');
process.env.cachebust_js = bust_js['public/js/singlejshash'];			//i'm just making 1 hash against all js for easier jade implementation
process.env.cachebust_css = bust_css['public/css/singlecsshash'];		//i'm just making 1 hash against all css for easier jade implementation
console.log('cache busting hash js', process.env.cachebust_js, 'css', process.env.cachebust_css);

// ============================================================================================================================
// 													Webserver Routing
// ============================================================================================================================
app.use(function(req, res, next){
	var keys;
	console.log('------------------------------------------ incoming request ------------------------------------------');
	console.log('New ' + req.method + ' request for', req.url);
	req.bag = {};																			//create object for my stuff
	req.bag.session = req.session;

	var url_parts = url.parse(req.url, true);
	req.parameters = url_parts.query;
	keys = Object.keys(req.parameters);
	if(req.parameters && keys.length > 0) console.log({parameters: req.parameters});		//print request parameters for debug
	keys = Object.keys(req.body);
	if (req.body && keys.length > 0) console.log({body: req.body});							//print request body for debug
	next();
});
app.use('/', require('./routes/site_router'));

// ------ Error Handling --------
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
app.use(function(err, req, res, next) {														// = development error handler, print stack trace
	console.log('Error Handeler -', req.url);
	var errorCode = err.status || 500;
	res.status(errorCode);
	req.bag.error = {msg:err.stack, status:errorCode};
	if(req.bag.error.status == 404) req.bag.error.msg = 'Sorry, I cannot locate that file';
	res.render('template/error', {bag:req.bag});
});


// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');


// ============================================================================================================================
// 														Warning
// ============================================================================================================================

// ============================================================================================================================
// 														Entering
// ============================================================================================================================

// ============================================================================================================================
// 														Work Area
// ============================================================================================================================

// ==================================
// Set up the blockchain sdk
// ==================================
var utils = require('./utils/hfc/lib/utils.js');
var chain = hfc.newChain('mychain');

// Creating an environment variable for ciphersuites
process.env['GRPC_SSL_CIPHER_SUITES'] = 'ECDHE-RSA-AES128-GCM-SHA256:' +
    'ECDHE-RSA-AES128-SHA256:' +
    'ECDHE-RSA-AES256-SHA384:' +
    'ECDHE-RSA-AES256-GCM-SHA384:' +
    'ECDHE-ECDSA-AES128-GCM-SHA256:' +
    'ECDHE-ECDSA-AES128-SHA256:' +
    'ECDHE-ECDSA-AES256-SHA384:' +
    'ECDHE-ECDSA-AES256-GCM-SHA384';
var network_id = helper.getNetworkId();
var uuid = network_id;
var webUser = null;
var marbles_lib = null;

utils.setConfigSetting('crypto-keysize', 256);
utils.setConfigSetting('crypto-hash-algo', 'SHA2');


// -------------------------------------------------------------------
// Life Starts Here!
// -------------------------------------------------------------------
var webUser = null;
var app_state_file = './app_state_ ' + file_safe_name(process.env.marble_company) + '.json';
process.env.app_state = 'starting';
process.env.app_first_setup = 'yes';
setupWebSocket();

try{
	var state = require(app_state_file);
	if(state && state.hash === helper.getHash()){
		console.log('\n\nDetected that we have launched successfully before');
		console.log('Welcome back - Initiating start up\n\n');
		process.env.app_first_setup = 'no';
		enroll_admin(helper.getUsers(0).enrollId, helper.getUsers(0).enrollSecret, helper.getMemberservicesUrl(0), function(e){
			if(e == null){
				setup_marbles_lib();
			}
		});
	}
	else wait_to_init();
	
}
catch(e){
	wait_to_init();
}

function wait_to_init(){
	process.env.app_state = 'start_waiting';
	process.env.app_first_setup = 'yes';
	console.log('\n\nDetected that we have NOT launched successfully yet');
	console.log('Open your browser to http://' + host + ':' + port + ' to initiate startup\n\n');
}
// -------------------------------------------------------------------


//setup marbles library and check if cc is deployed
function setup_marbles_lib(){
	chain.setOrderer(helper.getOrderersUrl(0));
	marbles_lib = require('./utils/marbles_cc_lib/index.js')(chain, console);
	ws_server.setup(webUser, marbles_lib, wss.broadcast, null);

	console.log('Checking if chaincode is already deployed or not');
	var options = 	{
						chaincode_id: helper.getChaincodeId(),
						peer_urls: [hfc.getPeer(helper.getPeersUrl(0))],
					};
	marbles_lib.check_if_already_deployed(webUser, options, function(not_deployed, enrollUser){
		if(not_deployed){										//if this is truthy we have not yet deployed.... error
			console.log('\n\nChaincode was not detected, all stop');
			console.log('Open your browser to http://' + host + ':' + port + ' to redo startup\n\n');
			process.env.app_first_setup = 'yes';				//overwrite state, bad startup
			broadcast_state('no_chaincode');
		}
		else{													//else we already deployed
			console.log('\n\nChaincode already deployed\n\n');
			broadcast_state('found_chaincode');

			var user_base = null;
			if(process.env.app_first_setup === 'yes') user_base = helper.getMarbleUsernames();
			create_assets(user_base); 							//builds marbles, then starts webapp
		}
	});
}

//enroll admin
function enroll_admin(id, secret, cop, cb){
	var keyValueStoreObj =	 {
								path: path.join(__dirname, './keyValStore-' + file_safe_name(process.env.marble_company) + '-' + uuid) 
							};
	chain.setKeyValueStore(hfc.newKeyValueStore(keyValueStoreObj));
	chain.setMemberServicesUrl(cop);

	console.log('! using id', id, 'secret', secret);

	chain.enroll(id, secret).then(
		function(enrolledUser) {
			console.log('Successfully enrolled ' + id);
			webUser = enrolledUser;									//push var to higher scope
			broadcast_state('enrolled');
			setTimeout(function(){
				if(cb) cb();
			}, block_delay);
		}
	).catch(
		function(err) {												//error with enrollment
			console.log('Failed to enroll ' + id, err.stack ? err.stack : err);
			broadcast_state('failed_enroll');
			if(cb) cb(err);
		}
	);
}

//random integer
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

//random string of x length
function randStr(length){
	var text = '';
	var possible = 'abcdefghijkmnpqrstuvwxyz0123456789';
	for(var i=0; i < length; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

//remove non alphanumerical characters
function file_safe_name(a_string){
	return a_string.replace(new RegExp('[^A-Za-z0-9_]', 'g'), '');
}

//real simple hash
function simple_hash(a_string){
	var hash = 0;
	for(var i in a_string) hash ^= a_string.charCodeAt(i);
	return hash;
}

//create random marble arguments (it is not important for it to be random, just more fun)
function build_marble_options(username, company){
	var colors = ['white', 'green', 'blue', 'purple', 'red', 'pink', 'orange', 'black', 'yellow'];
	var sizes = ['35', '16'];
	var color_index = simple_hash(more_entropy + company) % colors.length;		//build a psudeo random index to pick a color
	var size_index = getRandomInt(0, sizes.length);								//build a random size for this marble
	return 	{
				marble_id: randStr(24),
				color: colors[color_index],
				size: sizes[size_index],
				marble_owner: username,
				owners_company: company,
				auth_company: process.env.marble_company
			};
}

//this only runs after we deploy
function create_assets(build_marbles_users){
	console.log('Creating marble owners and marbles');

	if(build_marbles_users && build_marbles_users.length > 0){
		async.eachLimit(build_marbles_users, 1, function(username, user_cb) { 	//iter through each one ONLY ONE! [important]
			console.log('debug 3 - on user', username, Date.now());

			// --- Create Each User --- //
			pessimistic_create_owner(0, username, function(){

				// --- Create 2x Marbles --- //
				setTimeout(function(){											//delay for peer catch up
					create_marbles(username, user_cb);
				}, block_delay);
			});

		}, function(err) {
			console.log('- finished creating assets, waiting for peer catch up');
			if(err == null) {
				setTimeout(function(){											//marble owner creation finished
					all_done();													//delay for peer catch up
				}, block_delay);
			}
		});
	}
	else{
		console.log('- there are no new marble owners to create');
		all_done();
	}
}

//create the owner in a loop until it exists - repeat until we see the correct error! (yes)
function pessimistic_create_owner(attempt, username, cb){
	var options = 	{
						chaincode_id: helper.getChaincodeId(),
						peer_urls: [hfc.getPeer(helper.getPeersUrl(0))],
						args: 	{
									marble_owner: username,
									owners_company: process.env.marble_company
								}
					};

	marbles_lib.register_owner(webUser, options, function(e){
		console.log('\n\n\n!', attempt, e);

		// --- Does the user exist yet? --- //
		if(typeof e === 'string' && e.indexOf('owner already exists')){
			console.log('\n\nfinally the user exists, this is a good thing, moving on\n\n');
			cb(null);
		}
		else{

			// -- Try again -- //
			if(attempt < 4){
				setTimeout(function(){								//delay for peer catch up
					console.log('owner existance is not yet confirmed, trying again', attempt, username, Date.now());
					return pessimistic_create_owner(++attempt, username, cb);
				}, block_delay + 1000*attempt);
			}

			// -- Give Up -- //
			else{
				console.log('giving up on creating the user', attempt, username, Date.now());
				if(cb) return cb(e);
				else return;
			}
		}
		
	});
}

//create some marbles
function create_marbles(username, cb){
	async.eachLimit([1,2], 1, function(block_height, marble_cb) {	//create two marbles for every user
		var randOptions = build_marble_options(username, process.env.marble_company);
		console.log('\n\ngoing to create marble:', randOptions);
		var options = 	{
							chaincode_id: helper.getChaincodeId(),
							peer_urls: [hfc.getPeer(helper.getPeersUrl(0))],
							args: randOptions
						};
		marbles_lib.create_a_marble(webUser, options, function(){
			setTimeout(function(){
				marble_cb();
			}, block_delay);
		});
	}, function() {
		console.log('debug 2 - ok returning', Date.now());
		return cb();												//marble creation finished
	});
}

//we are done, inform the clients
function all_done(){
	broadcast_state('registered_owners');
	process.env.app_first_setup = 'no';
	var state_file = {hash: helper.getHash()};						//write state file so we know we started before
	fs.writeFileSync(app_state_file, JSON.stringify(state_file, null, 4), 'utf8');
	ws_server.check_for_updates(null);								//call the periodic task to get the state of everything
}

//message to client to communicate where we are in the start up
function build_state_msg(){
	return 	{
				msg: 'app_state', 
				state: process.env.app_state, 
				first_setup: process.env.app_first_setup
			};
}

//send to all connected clients
function broadcast_state(new_state){
	process.env.app_state = new_state;
	wss.broadcast(build_state_msg());											//tell client our app state
}


// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function setupWebSocket(){
	console.log('------------------------------------------ Websocket Up ------------------------------------------');
	wss = new ws.Server({server: server});										//start the websocket now
	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			console.log('received ws msg:', message);
			try{
				var data = JSON.parse(message);
				if(data.type == 'setup'){
					console.log('! [ws] setup message', data);

					//enroll admin
					if(data.configure === 'enrollment'){
						helper.write(data);										//write new config data to file
						enroll_admin(helper.getUsers(0).enrollId, helper.getUsers(0).enrollSecret, helper.getMemberservicesUrl(0), function(e){
							if(e == null){
								setup_marbles_lib();
							}
						});
					}

					//find deployed chaincode
					else if(data.configure === 'find_chaincode'){
						helper.write(data);										//write new config data to file
						setup_marbles_lib();
					}

					//deploy chaincode
					else if(data.configure === 'deploy_chaincode'){
						helper.write(data);										//write new config data to file
						chain.setOrderer(helper.getOrderersUrl(0));
						var temp_marbles_lib = require('./utils/marbles_cc_lib/index.js')(chain, helper.getChaincodeId(), null);
						var options = 	{
											chaincode_id: helper.getChaincodeId(),
											peer_urls: [hfc.getPeer(helper.getPeersUrl(0))],
										};
						temp_marbles_lib.deploy_chaincode(webUser, options, function(){
							setup_marbles_lib();
						});
					}

					//register marble owners
					else if(data.configure === 'register'){
						create_assets(data.build_marble_owners);
					}
				}
				else{
					ws_server.process_msg(ws, data);							//pass the websocket msg for processing
				}
			}
			catch(e){
				console.log('ws message error', e.stack);
			}
		});

		ws.on('error', function(e){console.log('ws error', e);});
		ws.on('close', function(){console.log('ws closed');});
		ws.send(JSON.stringify(build_state_msg()));								//tell client our app state
	});

	wss.broadcast = function broadcast(data) {									//send to all connections
		var i = 0;
		wss.clients.forEach(function each(client) {
			try{
				console.log('broadcasting to client', (++i), data.msg);
				client.send(JSON.stringify(data));
			}
			catch(e){
				console.log('error broadcast ws', e);
			}
		});
	};

	// ========================================================
	// Monitor the height of the blockchain
	// ========================================================
	// this code is no longer used, fabric v1 does not yet have APIs to get block data 1/5/2017
	// we will refactor this code when the apis exists

	/*hfc_util.monitor_blockheight(hfc.getPeer(peer_url), function(chain_stats) {		//there is a new block, lets refresh everything that has a state
		if(chain_stats && chain_stats.height){
			console.log('\nHey new block, lets refresh and broadcast to all', chain_stats.height-1);
			hfc_util.getBlockStats(peer, chain_stats.height - 1, cb_blockstats);
			wss.broadcast({msg: 'reset'});
			hfc_util.queryCC(admin, chaincode_id, 'read', ['_marbleindex'], cb_got_index);
			hfc_util.queryCC(admin, chaincode_id, 'read', ['_opentrades'], cb_got_trades);
		}

		//got the block's stats, lets send the statistics
		function cb_blockstats(e, stats){
			if(e != null) console.log('blockstats error:', e);
			else {
				chain_stats.height = chain_stats.height - 1;							//its 1 higher than actual height
				stats.height = chain_stats.height;										//copy
				wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
			}
		}

		//got the marble index, lets get each marble
		function cb_got_index(e, index){
			if(e != null) console.log('marble index error:', e);
			else{
				try{
					var json = JSON.parse(index);
					for(var i in json){
						console.log('!', i, json[i]);
						//iter over each, read their values
						hfc_util.queryCC(admin, chaincode_id, 'read', [json[i]], cb_got_marble);
					}
				}
				catch(e){
					console.log('marbles index msg error:', e);
				}
			}
		}

		//call back for getting a marble, lets send a message
		function cb_got_marble(e, marble){
			if(e != null) console.log('marble error:', e);
			else {
				try{
					wss.broadcast({msg: 'marbles', marble: JSON.parse(marble)});
				}
				catch(e){
					console.log('marble msg error', e);
				}
			}
		}

		//call back for getting open trades, lets send the trades
		function cb_got_trades(e, trades){
			if(e != null) console.log('trade error:', e);
			else {
				try{
					console.log('Found open trades: ' + trades);
					if (trades !== '') {
						trades = JSON.parse(trades);
						if(trades && trades.open_trades){
							wss.broadcast({msg: 'open_trades', open_trades: trades.open_trades});
						}
					}
					else {
						console.log('No open trades');
					}
				}
				catch(e){
					console.log('trade msg error', e);
				}
			}
		}
	});*/
}

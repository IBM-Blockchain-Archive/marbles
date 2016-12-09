'use strict';
/* global process */
/* global __dirname */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
/////////////////////////////////////////
///////////// Setup Node.js /////////////
/////////////////////////////////////////
var express = require('express');
var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();
var url = require('url');
var setup = require('./setup');
var fs = require('fs');
var cors = require('cors');
var async = require('async');
var fs = require('fs');

//// Set Things ////
var hfc = require('./utils/fabric-sdk-node2/index.js');
var more_entropy = randStr(24);
var part1 = require('./utils/ws_part1')(null, null, null);
var helper = require(__dirname + '/utils/helper.js')(console);
var host = setup.SERVER.HOST;
var port = setup.SERVER.PORT;

////////  Pathing and Module Setup  ////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('.html', require('jade').__express);
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use('/cc/summary', serve_static(path.join(__dirname, 'cc_summaries')) );												//for chaincode investigator
//app.use( serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}) );							//1 day cache
app.use( serve_static(path.join(__dirname, 'public')) );
app.use(session({secret:'Somethignsomething1234!test', resave:true, saveUninitialized:true}));
/*function setCustomCC(res, path) {
	if (serve_static.mime.lookup(path) === 'image/jpeg')  res.setHeader('Cache-Control', 'public, max-age=2592000');		//30 days cache
	else if (serve_static.mime.lookup(path) === 'image/png') res.setHeader('Cache-Control', 'public, max-age=2592000');
	else if (serve_static.mime.lookup(path) === 'image/x-icon') res.setHeader('Cache-Control', 'public, max-age=2592000');
}*/
// Enable CORS preflight across the board.
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


//// Router ////
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

////////////////////////////////////////////
////////////// Error Handling //////////////
////////////////////////////////////////////
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
// 														Deployment Tracking
// ============================================================================================================================
console.log('- Tracking Deployment');
require('cf-deployment-tracker-client').track();		//reports back to us, this helps us judge interest! feel free to remove it


// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================

// ============================================================================================================================
// 														Warning
// ============================================================================================================================

// ============================================================================================================================
// 														Entering
// ============================================================================================================================

// ============================================================================================================================
// 														Work Area
// ============================================================================================================================
var ws = require('ws');																			//websocket mod
var wss = {};

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
//this hard coded list is intentionaly left here, feel free to use it when initially starting out
//please create your own network when you are up and running
try{
	var manual = JSON.parse(fs.readFileSync('mycreds.json', 'utf8'));
	var peers = manual.credentials.peers;
	console.log('loading hardcoded peers');
	var users = null;																			//users are only found if security is on

	if(manual.credentials.users) users = manual.credentials.users;
	console.log('loading hardcoded users');
}
catch(e){
	console.log('Error - could not find hardcoded peers/users, this is okay if running in bluemix');
}

// ---- Load From VCAP aka Bluemix Services ---- //
if(process.env.VCAP_SERVICES){																	//load from vcap, search for service, 1 of the 3 should be found...
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	for(var i in servicesObject){
		if(i.indexOf('ibm-blockchain') >= 0){													//looks close enough
			if(servicesObject[i][0].credentials.error){
				console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
				peers = null;
				users = null;
				process.error = {type: 'network', msg: 'Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date.'};
			}
			if(servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers){		//found the blob, copy it to 'peers'
				console.log('overwritting peers, loading from a vcap service: ', i);
				peers = servicesObject[i][0].credentials.peers;
				if(servicesObject[i][0].credentials.users){										//user field may or maynot exist, depends on if there is membership services or not for the network
					console.log('overwritting users, loading from a vcap service: ', i);
					users = servicesObject[i][0].credentials.users;
				}
				else users = null;																//no security
				break;
			}
		}
	}
}

// ==================================
// Set up the blockchain sdk
// ==================================
var utils = require('./utils/fabric-sdk-node2/lib/utils.js');
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
//let ccPath = process.env['GOPATH']+'/src/local/marbles-hfc/marbles-v1/chaincode';
let ccPath = __dirname + '/chaincode';
var network_id = helper.getNetworkId();
var uuid = network_id;
var webUser = null;
var marbles_lib = null;

utils.setConfigSetting('crypto-keysize', 256);
utils.setConfigSetting('crypto-hash-algo', 'SHA2');
chain.setKeyValueStore(
	hfc.newKeyValueStore({
		path: __dirname + '/keyValStore-' + uuid
	})
);
//chain.setMemberServicesUrl(helper.getMemberservicesUrl(0));
//chain.setOrderer(helper.getOrderersUrl(0));

//make chaincode name unique-ish
function set_chaincode_id(cb){
	fs.stat(ccPath + '/marbles.go', function(err, fstats){
		var temp = new Date(fstats.mtime);
		var cc_id = 'marbles.' + temp.getTime();					//get the modified timestamp for the go file
		console.log('chaincode id', cc_id);
		cb(null, cc_id);
	});
}


// -------------------------------------------------------------------
// Blockchain Stuff Starts Here! - below
// -------------------------------------------------------------------
var webUser = null;
process.env.app_state = 'starting';									//'starting','enrolled','no_chaincode',found_chaincode','registered_owners'
setupWebSocket();
enroll_admin(helper.getUsers(0).enrollId, helper.getUsers(0).enrollSecret, helper.getMemberservicesUrl(0), function(e){
	if(e == null){
		set_chaincode_id(function(e, cc_id){
			setup_marbles_lib(cc_id, helper.getOrderersUrl(0));
		});
	}
});
// -------------------------------------------------------------------


//setup marbles library and check if cc is deployed
function setup_marbles_lib(chaincode_id, orderer_url, peer_url){
	chain.setOrderer(orderer_url);
	marbles_lib = require('./utils/marbles_cc_lib/index.js')(chain, chaincode_id, null);
	part1.setup(webUser, marbles_lib, null);
	marbles_lib.check_if_already_deployed(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(not_deployed, enrollUser){
		if(not_deployed){										//if this is truthy we have not yet deployed.... error
			console.log('\n\nChaincode was not detected, all stop\n\n');
			process.env.app_state = 'no_chaincode';
		}
		else{													//else we already deployed
			console.log('\n\nChaincode already deployed\n\n');
			process.env.app_state = 'found_chaincode';
			setup_application(enrollUser); 						//builds marbles, then starts webapp
		}
	});
}

//enroll admin
function enroll_admin(id, secret, cop, cb){
	chain.setMemberServicesUrl(cop);
	chain.enroll(id, secret).then(
		function(enrolledUser) {
			console.log('Successfully enrolled ' + id);
			webUser = enrolledUser;									//push var to higher scope
			process.env.app_state = 'enrolled';
			if(cb) cb();
		}
	).catch(
		function(err) {
			console.log('Failed to enroll ' + id, err.stack ? err.stack : err);
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

//real simple hash
function simple_hash(a_string){
	var hash = 0;
	for(var i in a_string) hash ^= a_string.charCodeAt(i);
	return hash;
}

//create random marble arguments (it is not important for it to be random, just more fun)
function build_marble_options(username, company){
	var colors = ['white', 'black', 'red', 'green', 'blue', 'purple', 'pink', 'orange', 'yellow'];
	var sizes = ['35', '16'];
	var color_index = simple_hash(more_entropy + username) % colors.length;	//build a psudeo random index to pick a color
	var size_index = getRandomInt(0, sizes.length);							//build a random size for this marble
	return [randStr(24), colors[color_index], sizes[size_index], username, company];
}

//this only runs after we deploy
function setup_application(enrollUser){
	console.log('setting up application');

	// --- Create Each user --- //
	if(process.env.build_marbles_users){
		var build_users = [];
		try{
			build_users = JSON.parse(process.env.build_marbles_users);
			console.log('building ' + build_users.length + ' users');
		}
		catch(e){console.log('not json', e);}
		async.eachLimit(build_users, 1, function(username, user_cb) { 			//iter through each one
			var owner_obj = {username: username, company: process.env.marble_company};
			marbles_lib.register_owner(webUser, [hfc.getPeer(helper.getPeersUrl(0))], owner_obj, function(){
				
				// --- Create Marble(s) --- //
				async.eachLimit([1,2], 1, function(block_height, marble_cb) {	//create two marbles for every user
					var randOptions = build_marble_options(username, process.env.marble_company);
					console.log('\n\ngoing to create marble:', randOptions);
					marbles_lib.create_a_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], randOptions, function(){
						setTimeout(function(){
							marble_cb();
						}, 1500);
					});
				}, function() {
					user_cb();													//marble creation finished
				});
			});
		}, function(err) {
			console.log('finished setup_application, waiting for catch up');
			if(err == null) {
				setTimeout(function(){											//marble owner creation finished
					process.env.app_state = 'registered_owners';				//rdy to use marbles
				}, 2000);
			}
		});
	}
	else{
		console.log('there are no new users to create');
		process.env.app_state = 'registered_owners';							//rdy to use marbles
	}
}


// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function setupWebSocket(){
	console.log('------------------------------------------ Websocket Up ------------------------------------------');
	wss = new ws.Server({server: server});												//start the websocket now
	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			console.log('received ws msg:', message);
			try{
				var data = JSON.parse(message);
				if(data.type == 'setup'){
					console.log('[ws] setup message');
					/*if(data.configure == 'enrollment'){
						enroll_admin(data.enrollId, data.enrollSecret, data.copUrl, function(e){
							if(e == null){
								set_chaincode_id(function(e, cc_id){
									setup_marbles_lib(cc_id, [hfc.getPeer(helper.getPeersUrl(0))]);
								});
							}
						});
					}
					else if(data.configure == 'find_chaincode'){
						setup_marbles_lib(data.chaincode_id, data.peerUrl);
					}
					else if(data.configure == 'deploy_chaincode'){
						chain.setOrderer(data.ordererUrl);				//this is wrong, should file i/o first!
						marbles_lib = require('./utils/marbles_cc_lib/index.js')(chain, data.chaincode_id, null);
						part1.setup(webUser, marbles_lib, null);
						marbles_lib.deploy_chaincode(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(){

						});
					}
					else if(data.configure == 'register'){

					}*/
				}
				else{
					part1.process_msg(ws, data);										//pass the websocket msg to part 1 processing
				}
			}
			catch(e){
				console.log('ws message error', e.stack);
			}
		});
		ws.on('error', function(e){console.log('ws error', e);});
		ws.on('close', function(){console.log('ws closed');});
		ws.send(JSON.stringify({msg: 'app_state', state: process.env.app_state}));		//tell client our app state
	});

	wss.broadcast = function broadcast(data) {											//send to all connections
		wss.clients.forEach(function each(client) {
			try{
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
	/*hfc_util.monitor_blockheight(hfc.getPeer(peer_url), function(chain_stats) {										//there is a new block, lets refresh everything that has a state
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

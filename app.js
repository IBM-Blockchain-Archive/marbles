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

var hfc = require('./utils/fabric-sdk-node/index.js');
//var hfc = require('@blockchain/hfc');
var fs = require('fs');
const https = require('https');
var hfc_util = require('./utils/hfc_util');

//// Set Server Parameters ////
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
app.use( serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}) );							//1 day cache
//app.use( serve_static(path.join(__dirname, 'public')) );
app.use(session({secret:'Somethignsomething1234!test', resave:true, saveUninitialized:true}));
function setCustomCC(res, path) {
	if (serve_static.mime.lookup(path) === 'image/jpeg')  res.setHeader('Cache-Control', 'public, max-age=2592000');		//30 days cache
	else if (serve_static.mime.lookup(path) === 'image/png') res.setHeader('Cache-Control', 'public, max-age=2592000');
	else if (serve_static.mime.lookup(path) === 'image/x-icon') res.setHeader('Cache-Control', 'public, max-age=2592000');
}
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


///////////  Configure Webserver  ///////////
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

//// Router ////
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
var part1 = require('./utils/ws_part1');														//websocket message processing for part 1
var part2 = require('./utils/ws_part2');														//websocket message processing for part 2
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
	var caContainer = manual.credentials.ca;
	var ca = caContainer[Object.keys(caContainer)[0]]

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
var chain = hfc.newChain("mychain");

// Creating an environment variable for ciphersuites
process.env['GRPC_SSL_CIPHER_SUITES'] = 'ECDHE-RSA-AES128-GCM-SHA256:' +
    'ECDHE-RSA-AES128-SHA256:' +
    'ECDHE-RSA-AES256-SHA384:' +
    'ECDHE-RSA-AES256-GCM-SHA384:' +
    'ECDHE-ECDSA-AES128-GCM-SHA256:' +
    'ECDHE-ECDSA-AES128-SHA256:' +
    'ECDHE-ECDSA-AES256-SHA384:' +
    'ECDHE-ECDSA-AES256-GCM-SHA384';
let ccPath = process.env["GOPATH"]+"/src/local/marbles-hfc/marbles-v1/chaincode";
console.log('ccPath: ' + ccPath);

var chaincode_id = 'mycc-marbles-73';
var peer = hfc.getPeer('grpc://localhost:7051');

var network_id = Object.keys(manual.credentials.ca);
var ca_url = "grpcs://"+ca.discovery_host;
console.log("Member services address: "+ca_url);
var uuid = network_id[0].substring(0,8);
//chain.setKeyValStore( hfc.newFileKeyValStore(__dirname + '/keyValStore-' + uuid) );
chain.setKeyValueStore(
	hfc.newKeyValueStore({
		path: __dirname + '/keyValStore-' + uuid
	})
);

var certFile = 'keyValStore/tlsca.cert';

enrollAndRegisterUsers()
.then(
	function(user) {
		console.log("\nEnrolled and registered successfully");
		chain.setRegistrar(user);
		part1.setup(user, chaincode_id, peer);
		part2.setup(user, chaincode_id, peer);
		console.log("\nDeploying chaincode ...")
		return deployChaincode();
	},
	function(err) {
		console.log("\nFailure: %s\n", err);
	}
).then(
	function(user) {
		console.log("\nChaincode deployed successfully");
		console.log("\nSetting up web server ...")
		return setupWebServer();
	},
	function(err) {
		console.log("\nFailure deploying chaincode, %s\n", err);
	}
).catch(
	function(err) {
		console.log("\nERROR: %s", err);
	}
);

function enrollAndRegisterUsers() {
    //var cert = fs.readFileSync(certFile);
	chain.setMemberServicesUrl('http://192.168.99.100:8888');
	chain.setOrderer('grpc://192.168.99.100:5151');

	return new Promise(function(resolve, reject) {
		// Enroll a 'admin' who is already registered because it is
		// listed in fabric/membersrvc/membersrvc.yaml with it's one time password.
		var user = users[0];
		console.log('Attempt to enroll: username: ' + user.username + ', secret: ' + user.secret);
	    resolve(chain.enroll(user.username, user.secret));
		/*
		.then(
			function(admin) {
				console.log("\nEnrolled " + user.username + " successfully");

				// Set this user as the chain's registrar which is authorized to register other users.
				chain.setRegistrar(admin);
				part1.setup(admin, chaincode_id, peer);
				part2.setup(admin, chaincode_id, peer);

				var enrollName = "JohnDoe"; //creating a new user
				var registrationRequest = {
					enrollmentID: enrollName,
					affiliation: "group1"
				};
				resolve(chain.registerAndEnroll(registrationRequest));
			},
			function(err) {
				reject(new Error("\nERROR: failed to enroll admin : %s", err));
			}
		).catch(
			function(err) {
				reject(new Error("\nERROR: failed register and/or enroll : %s", err));
			}
		);
		*/
	});
}


function deployChaincode() {
	var admin = chain.getRegistrar();

	return new Promise(function(resolve, reject) {
		// send proposal to endorser
		var request = {
			targets: [hfc.getPeer('grpc://192.168.99.100:7051')],
			//chaincodePath: "github.com/clanzen/marbles-chaincode/hyperledger/part1",
			chaincodePath: '/local/marbles-hfc/marbles/chaincode',
			chaincodeId: chaincode_id,
			fcn: 'init',
			args: ['99']
		};

		admin.sendDeploymentProposal(request)
		.then(
			function(results) {
				var proposalResponses = results[0];
				console.log('proposalResponses:'+JSON.stringify(proposalResponses));
				var proposal = results[1];
				if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					return admin.sendTransaction(proposalResponses, proposal);
				} else {
					reject(new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'));
				}
			},
			function(err) {
				reject(new Error('Failed to send deployment proposal due to error: ' + err.stack ? err.stack : err));
			}
		).then(
			function(response) {
				if (response.Status === 'SUCCESS') {
					console.log('Successfully ordered deployment endorsement.');
					console.log(' need to wait now for the committer to catch up');
					resolve(sleep(20000));
				} else {
					reject(new Error('Failed to order the deployment endorsement. Error code: ' + response.status));
				}
			},
			function(err) {
				reject(new Error('Failed to send deployment e due to error: ' + err.stack ? err.stack : err));
			}
		).catch(
			function(err) {
				reject(new Error('Failed to end to end test with error:' + err.stack ? err.stack : err));
			}
		);
	});
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function setupWebServer(){
	var admin = chain.getRegistrar();
	console.log('------------------------------------------ Websocket Up ------------------------------------------');

	wss = new ws.Server({server: server});												//start the websocket now
	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			console.log('received ws msg:', message);
			try{
				var data = JSON.parse(message);
				part1.process_msg(ws, data);											//pass the websocket msg to part 1 processing
				part2.process_msg(ws, data);											//pass the websocket msg to part 2 processing
			}
			catch(e){
				console.log('ws message error', e);
				console.log(e.stack);
			}
		});

		ws.on('error', function(e){console.log('ws error', e);});
		ws.on('close', function(){console.log('ws closed');});
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
	hfc_util.monitor_blockheight(hfc.getPeer('grpc://localhost:7051'), function(chain_stats) {										//there is a new block, lets refresh everything that has a state
		if(chain_stats && chain_stats.height){
			console.log('\nHey new block, lets refresh and broadcast to all', chain_stats.height-1);
			hfc_util.getBlockStats(peer, chain_stats.height - 1, cb_blockstats);
			wss.broadcast({msg: 'reset'});
			hfc_util.queryCC(admin, chaincode_id, "read", ['_marbleindex'], cb_got_index);
			hfc_util.queryCC(admin, chaincode_id, "read", ['_opentrades'], cb_got_trades);
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
						hfc_util.queryCC(admin, chaincode_id, "read", [json[i]], cb_got_marble);
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
					if (trades !== "") {
						trades = JSON.parse(trades);
						if(trades && trades.open_trades){
							wss.broadcast({msg: 'open_trades', open_trades: trades.open_trades});
						}
					}
					else {
						console.log("No open trades");
					}
				}
				catch(e){
					console.log('trade msg error', e);
				}
			}
		}
	});
}

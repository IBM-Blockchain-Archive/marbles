"use strict";
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
var async = require('async');
var setup = require('./setup');
var cors = require("cors");
var fs = require("fs");

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

///////////  Configure Webserver  ///////////
app.use(function(req, res, next){
	var keys;
	console.log('------------------------------------------ incoming request ------------------------------------------');
	console.log('New ' + req.method + ' request for', req.url);
	req.bag = {};											//create my object for my stuff
	req.session.count = eval(req.session.count) + 1;
	req.bag.session = req.session;
	
	var url_parts = url.parse(req.url, true);
	req.parameters = url_parts.query;
	keys = Object.keys(req.parameters);
	if(req.parameters && keys.length > 0) console.log({parameters: req.parameters});		//print request parameters
	keys = Object.keys(req.body);
	if (req.body && keys.length > 0) console.log({body: req.body});						//print request body
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
app.use(function(err, req, res, next) {		// = development error handler, print stack trace
	console.log("Error Handeler -", req.url);
	var errorCode = err.status || 500;
	res.status(errorCode);
	req.bag.error = {msg:err.stack, status:errorCode};
	if(req.bag.error.status == 404) req.bag.error.msg = "Sorry, I cannot locate that file";
	res.render('template/error', {bag:req.bag});
});

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');


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
// 														Test Area
// ============================================================================================================================
var part1 = require('./utils/ws_part1');
var part2 = require('./utils/ws_part2');
var ws = require('ws');
var wss = {};
var Obc1 = require('./utils/obc-js/index');
var obc = new Obc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
var manual = {
  "credentials": {
    "peers": [
      {
        "discovery_host": "169.44.38.114",
        "discovery_port": "33641",
        "api_host": "169.44.38.114",
        "api_port": "33642",
        "type": "peer",
        "network_id": "7f204b2d-9663-49d2-9c9c-889bab178dc0",
        "id": "7f204b2d-9663-49d2-9c9c-889bab178dc0_vp1",
        "api_url": "http://169.44.38.114:33642"
      },
      {
        "discovery_host": "169.44.38.114",
        "discovery_port": "33643",
        "api_host": "169.44.38.114",
        "api_port": "33644",
        "type": "peer",
        "network_id": "7f204b2d-9663-49d2-9c9c-889bab178dc0",
        "id": "7f204b2d-9663-49d2-9c9c-889bab178dc0_vp2",
        "api_url": "http://169.44.38.114:33644"
      }
    ],
    "users": [
      {
        "username": "peer1",
        "secret": "de716f4358"
      },
      {
        "username": "peer2",
        "secret": "d4c0fbe381"
      },
      {
        "username": "user_ed1cfd91c6",
        "secret": "8f94e02858"
      },
      {
        "username": "user_f200bfa36d",
        "secret": "714eb7abd7"
      },
      {
        "username": "user_d1a3223d85",
        "secret": "a2470498c1"
      },
      {
        "username": "user_2188d524fc",
        "secret": "717ffe1045"
      },
      {
        "username": "user_e5abfaa27a",
        "secret": "ecdf7a3662"
      },
      {
        "username": "user_ad071cb86d",
        "secret": "ff919ef7d1"
      },
      {
        "username": "user_de866d72f9",
        "secret": "8542dc08be"
      },
      {
        "username": "user_c7df4fb621",
        "secret": "4e470da410"
      },
      {
        "username": "user_a10546fdd5",
        "secret": "9519b3b7a6"
      },
      {
        "username": "user_ca7370515e",
        "secret": "dba9f5c561"
      }
    ]
  }
};
var peers = manual.credentials.peers;
console.log('loading hardcoded peers');
var users = null;																		//users are only found if security is on
if(manual.credentials.users) users = manual.credentials.users;
console.log('loading hardcoded users');

if(process.env.VCAP_SERVICES){															//load from vcap, search for service, 1 of the 3 should be found...
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	for(var i in servicesObject){
		if(i.indexOf('ibm-blockchain') >= 0){											//looks close enough
			if(servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers){
				console.log('overwritting peers, loading from a vcap service: ', i);
				peers = servicesObject[i][0].credentials.peers;
				if(servicesObject[i][0].credentials.users){
					console.log('overwritting users, loading from a vcap service: ', i);
					users = servicesObject[i][0].credentials.users;
				} 
				else users = null;														//no security
				break;
			}
		}
	}
}


// ==================================
// configure obc-js sdk
// ==================================
var options = 	{
					network:{
						peers: peers,
						users: users,
					},
					chaincode:{
						zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
						unzip_dir: 'marbles-chaincode-master/part2',											//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/part2',					//git http url
						
						//hashed cc name from prev deployment
						//deployed_name: '3dd5dcc0b6ba27d32101e71e6479c1c5535540ce0e8a1efbfbf9a9abf3b1d517d42509a108411a557cb0d01e2bf3d0e9257843341fff38d3df99e80b95b0c695'
					}
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.deployed_name = "";
}
obc.load(options, cb_ready);																//parse/load chaincode

var chaincode = null;
function cb_ready(err, cc){																	//response has chaincode functions
	if(err != null){
		console.log('! looks like an error loading the chaincode, app will fail\n', err);
	}
	else{
		chaincode = cc;
		part1.setup(obc, cc);
		part2.setup(obc, cc);
		if(cc.details.deployed_name === ""){												//decide if i need to deploy
			cc.deploy('init', ['99'], './cc_summaries', cb_deployed);
		}
		else{
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			cb_deployed();
		}
	}
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d){
	if(e != null){
		//look at tutorial_part1.md in the trouble shooting section for help
		console.log('! looks like a deploy error, holding off on the starting the socket\n', e);
	}
	else{
		console.log('------------------------------------------ Websocket Up ------------------------------------------');
		obc.save('./cc_summaries');															//save it here for chaincode investigator
		wss = new ws.Server({server: server});												//start the websocket now
		wss.on('connection', function connection(ws) {
			ws.on('message', function incoming(message) {
				console.log('received ws msg:', message);
				var data = JSON.parse(message);
				part1.process_msg(ws, data);
				part2.process_msg(ws, data);
			});
			
			ws.on('close', function(){});
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
		// Part 2 Code - Monitor the height of the blockchain
		// =======================================================
		obc.monitor_blockheight(function(chain_stats){										//there is a new block, lets refresh everything that has a state
			if(chain_stats && chain_stats.height){
				console.log('hey new block, lets refresh and broadcast to all');
				obc.block_stats(chain_stats.height - 1, cb_blockstats);
				wss.broadcast({msg: 'reset'});
				chaincode.read('marbleIndex', cb_got_index);
				chaincode.read('_opentrades', cb_got_trades);
			}
			
			//got the block's stats, lets send the statistics
			function cb_blockstats(e, stats){
				wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
			}
			
			//got the marble index, lets get each marble
			function cb_got_index(e, index){
				if(e != null) console.log('error:', e);
				else{
					try{
						var json = JSON.parse(index);
						for(var i in json){
							console.log('!', i, json[i]);
							chaincode.read(json[i], cb_got_marble);							//iter over each, read their values
						}
					}
					catch(e){
						console.log('error:', e);
					}
				}
			}
			
			//call back for getting a marble, lets send a message
			function cb_got_marble(e, marble){
				if(e != null) console.log('error:', e);
				else {
					wss.broadcast({msg: 'marbles', marble: marble});
				}
			}
			
			//call back for getting open trades, lets send the trades
			function cb_got_trades(e, trades){
				if(e != null) console.log('error:', e);
				else {
					if(trades && trades.open_trades){
						wss.broadcast({msg: 'open_trades', open_trades: trades.open_trades});
					}
				}
			}
		});
	}
}
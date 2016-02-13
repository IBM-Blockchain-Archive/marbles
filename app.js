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
        "discovery_host": "169.44.63.207",
        "discovery_port": "33730",
        "api_host": "169.44.63.207",
        "api_port": "33731",
        "type": "peer",
        "network_id": "7b8b9761-8cba-4552-9d07-617786e67505",
        "id": "7b8b9761-8cba-4552-9d07-617786e67505_vp1",
        "api_url": "http://169.44.63.207:33731"
      },
      {
        "discovery_host": "169.44.63.220",
        "discovery_port": "33720",
        "api_host": "169.44.63.220",
        "api_port": "33721",
        "type": "peer",
        "network_id": "7b8b9761-8cba-4552-9d07-617786e67505",
        "id": "7b8b9761-8cba-4552-9d07-617786e67505_vp2",
        "api_url": "http://169.44.63.220:33721"
      }
    ],
    "users": [
      {
        "username": "peer1",
        "secret": "bc2e99792b"
      },
      {
        "username": "peer2",
        "secret": "516128a3e6"
      },
      {
        "username": "user_379656d01e",
        "secret": "4ca9bd65f7"
      },
      {
        "username": "user_87a8f41432",
        "secret": "5922da4465"
      },
      {
        "username": "user_b34f5138a4",
        "secret": "71bb2b4ec5"
      },
      {
        "username": "user_eecbec8076",
        "secret": "9a08533a9f"
      },
      {
        "username": "user_0f4e25a25b",
        "secret": "a73aa6fff5"
      },
      {
        "username": "user_d91d1c6a18",
        "secret": "9d3699068c"
      },
      {
        "username": "user_7578f7a448",
        "secret": "380f520403"
      },
      {
        "username": "user_433be789e1",
        "secret": "58a76b9f1e"
      },
      {
        "username": "user_8a65268b43",
        "secret": "9226a51a3d"
      },
      {
        "username": "user_96cb321b7a",
        "secret": "e3a0ea19e2"
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
						unzip_dir: 'marbles-chaincode-master/phase2',											//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/phase2',					//git http url
						
						//hashed cc name from prev deployment
						deployed_name: 'f6c084c42b3bde90c03f214ac6e0426e3e594807901fb1464287f2c3a18ade717bc495298958287594f81bb0d0cfdd3b4346d438d3b587d4fc73cf78ae8f7dfe'
					}
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.deployed_name = "";
}
obc.load(options, cb_ready);																//parse/load chaincode

function cb_ready(err, cc){																	//response has chaincode functions
	if(err != null){
		console.log('! looks like an error loading the chaincode, app will fail\n', err);
	}
	else{
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
			
			ws.on('close', function(){
				part2.close();																//close peridic poll that part 2 does
			});
		});
	}
}

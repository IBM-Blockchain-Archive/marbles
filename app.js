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
//app.use( serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}) );							//1 day cache
app.use( serve_static(path.join(__dirname, 'public')) );							//1 day cache
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
	console.log('silly', '------------------------------------------ incoming request ------------------------------------------');
	console.log('info', 'New ' + req.method + ' request for', req.url);
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

////////////// Launch //////////////
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
server.timeout = 240000;																							// Ta-da.
console.log('info', '------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
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
var app1 = require('./utils/ws_app1');
var app2 = require('./utils/ws_app2');
var ws = require('ws');
var wss = {};
var Obc1 = require('./utils/obc-js/index');
var obc = new Obc1();

// ==================================
// load peers manually or from VCAP
// ==================================
var peers =   [
      {
        "discovery_host": "169.53.72.245",
        "discovery_port": "33568",
        "api_host": "169.53.72.245",
        "api_port": "33569",
        "id": "9a45fe8c-7701-459a-abdb-7c86076ff635_vp5",
        "api_url": "http://169.53.72.245:33569"
      }
    ];

if (process.env.VCAP_SERVICES){
	console.log("We are running in Cloud Foundry!");
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	
	//old
	if(servicesObject && servicesObject['blockchain-staging'] && servicesObject['blockchain-staging'][0] && servicesObject['blockchain-staging'][0].credentials){
		console.log('loading peers from env: blockchain-staging');
		peers = servicesObject['blockchain-staging'][0].credentials.peers;
	}
	//new
	else if(servicesObject && servicesObject['ibm-blockchain-3-staging'] && servicesObject['ibm-blockchain-3-staging'][0] && servicesObject['ibm-blockchain-3-staging'][0].credentials){
		console.log('loading peers from env: ibm-blockchain-3-staging');
		peers = servicesObject['ibm-blockchain-3-staging'][0].credentials.peers;
	}
}
obc.network(peers);																		//setup network connection for rest endpoint

// ==================================
// configure obc-js sdk
// ==================================
var options = 	{
					zip_url: 'https://github.com/dshuffma-ibm/simplestuff/archive/master.zip',
					git_dir: 'simplestuff-master',																		//subdirectroy name of chaincode after unzipped
					git_url: 'https://github.com/dshuffma-ibm/simplestuff',												//git clone http url
					
					//hashed cc name from prev deploy [IF YOU COMMENT LINE BELOW OUT IT WILL DEPLOY]
					deployed_name: '5e34bf5b51c51fbc8e1af98da8ad840c69ac9c9a8885e3e4d0e63b3b8074ee66669ac903588315a6c8d88683f563418e330747feafe7ef20a1cd54ff7685da19'
				};
obc.load(options, cb_ready);															//parse/load chaincode

function cb_ready(err, cc){																//response has chaincode functions
	app1.setup(obc, cc);
	app2.setup(obc, cc);
	if(cc.details.deployed_name === ""){												//decide if i need to deploy
		cc.deploy('init', ['99'], './', cb_deployed);
	}
	else{
		obc.save('./');
		console.log('chaincode summary file indicates chaincode has been previously deployed');
		cb_deployed();
	}
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(){
	console.log('starting websocket');
	wss = new ws.Server({server: server});												//start the websocket now
	wss.on('connection', function connection(ws) {
		//ws_cons.push(ws);
		ws.on('message', function incoming(message) {
			console.log('received ws msg:', message);
			var data = JSON.parse(message);
			app1.process_msg(ws, data);
			app2.process_msg(ws, data);
			//broadcast({test:"test"});
		});
	});
}
/*
var ws_cons = [];
function broadcast(data){
	for(var i in ws_cons){
		try{
			console.log('sending', i);//, ws);
			ws_cons[i].send(JSON.stringify(data));
		}
		catch(e){
			console.log('error ws', e);
		}
	}
}*/

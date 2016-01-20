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
var google = require('googleapis');
var setup = require('./setup');
var cors = require("cors");
var fs = require("fs");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//// Set Server Parameters ////
var host = (process.env.VCAP_APP_HOST || setup.SERVER.HOST);
var port = (process.env.VCAP_APP_PORT || setup.SERVER.PORT);

////////  Pathing and Module Setup  ////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('.html', require('jade').__express);
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use( serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}) );							//1 day cache
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
var server = app.listen(port, host);								//gogo application
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
var Obc1 = require('obc-js');
var obc = new Obc1();
var peers =    [
      {
        "discovery_host": "158.85.255.228",
        "discovery_port": "32802",
        "api_host": "158.85.255.228",
        "api_port": "32803",
        "id": "fe2efaac-441e-48a1-832c-6df58b845dd7_vp1",
        "api_url": "http://158.85.255.228:32803"
      },
      {
        "discovery_host": "158.85.255.230",
        "discovery_port": "32794",
        "api_host": "158.85.255.230",
        "api_port": "32795",
        "id": "fe2efaac-441e-48a1-832c-6df58b845dd7_vp2",
        "api_url": "http://158.85.255.230:32795"
      },
      {
        "discovery_host": "158.85.255.228",
        "discovery_port": "32804",
        "api_host": "158.85.255.228",
        "api_port": "32805",
        "id": "fe2efaac-441e-48a1-832c-6df58b845dd7_vp3",
        "api_url": "http://158.85.255.228:32805"
      },
      {
        "discovery_host": "158.85.255.239",
        "discovery_port": "32800",
        "api_host": "158.85.255.239",
        "api_port": "32801",
        "id": "fe2efaac-441e-48a1-832c-6df58b845dd7_vp4",
        "api_url": "http://158.85.255.239:32801"
      },
      {
        "discovery_host": "169.53.72.250",
        "discovery_port": "33205",
        "api_host": "169.53.72.250",
        "api_port": "33206",
        "id": "fe2efaac-441e-48a1-832c-6df58b845dd7_vp5",
        "api_url": "http://169.53.72.250:33206"
      }
    ];

//4b8174e261b3710f03fd63604af076e3a4efb20c49d642270db9784abd86562b8a3fbcf754c64f89086abd86d1fc670b4831e2462e23ba8c16c824f550f05a69
//c38ad7ee13e89382fcf39476204b0c583fc78ed28f36382f9eb5c363d737129c7ce919f969ebba04109a455a180301cfd7d20c77344c3e4cdfccdbb1c80b9502

if (process.env.VCAP_SERVICES){
	console.log("We are running in Cloud Foundry!");
	
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	var firstService = servicesObject['blockchain-staging'][0];
	peers = firstService.credentials.peers;
}
obc.network(peers);																										//setup network connection for rest endpoint
obc.load('https://hub.jazz.net/git/averyd/cc_ex02/archive?revstr=master', 'chaincode_obc-js_demo3simple', cb_ready);			//parse/load chaincode

function cb_ready(err, contract){
	contract.cc.details.path = 'https://hub.jazz.net/git/averyd/cc_ex02/chaincode_obc-js_demo3simple';
	//contract.cc.details.name = '4b8174e261b3710f03fd63604af076e3a4efb20c49d642270db9784abd86562b8a3fbcf754c64f89086abd86d1fc670b4831e2462e23ba8c16c824f550f05a69';
	obc.save();
	//console.log('contract details:', contract.cc.details);
	//contract.init();
	//contract.invoke(["a", "b", "5"]);
	//contract.init();
	//contract.cc.read('a', cb_next);
	//contract.cc.deploy('init',  ["a", "101", "b", "202"], cb_next);
	//contract.cc.read('a', cb_next);
	function cb_next(e, value){
		//contract.cc.read('a', cb_next2);
	contract.cc.write('a', (value + 1), cb_next2);
		//contract.invoke(["a", "b", "5"], cb_next2);
	}
	function cb_next2(){
		contract.cc.read('a');
		contract.cc.read('b');
	}
}
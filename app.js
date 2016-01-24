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
var server = app.listen(port, host);								//gogo application
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
server.timeout = 240000;																							// Ta-da.
console.log('info', '------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');


var WebSocketServer = require('ws').Server, wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	});

	contract.cc.read('ballIndex', cb_got_index);
	//ws.send(JSON.stringify({msg: 'hey there client'}));
	
	function cb_got_index(e, index){
		var json = JSON.parse(index);
		for(var i in json){
			console.log('!', i, json[i]);
			contract.cc.read(json[i], cb_got_ball);
		}
		//ws.send(JSON.stringify({msg: 'hey there client', e: e, a: a}));
	}
	function cb_got_ball(e, ball){
		ws.send(JSON.stringify({msg: 'balls', e: e, ball: ball}));
	}
});



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
var Obc1 = require('./utils/obc-js/index');
var obc = new Obc1();
var contract = {};
var peers =[
      {
        "discovery_host": "158.85.255.228",
        "discovery_port": "32968",
        "api_host": "158.85.255.228",
        "api_port": "32969",
        "id": "83c11879-567d-4516-9824-aed14b6f8cf9_vp1",
        "api_url": "http://158.85.255.228:32969"
      },
      {
        "discovery_host": "169.53.72.245",
        "discovery_port": "33414",
        "api_host": "169.53.72.245",
        "api_port": "33415",
        "id": "83c11879-567d-4516-9824-aed14b6f8cf9_vp5",
        "api_url": "http://169.53.72.245:33415"
      },
      {
        "discovery_host": "158.85.255.239",
        "discovery_port": "32944",
        "api_host": "158.85.255.239",
        "api_port": "32945",
        "id": "83c11879-567d-4516-9824-aed14b6f8cf9_vp2",
        "api_url": "http://158.85.255.239:32945"
      },
      {
        "discovery_host": "158.85.255.239",
        "discovery_port": "32942",
        "api_host": "158.85.255.239",
        "api_port": "32943",
        "id": "83c11879-567d-4516-9824-aed14b6f8cf9_vp4",
        "api_url": "http://158.85.255.239:32943"
      },
      {
        "discovery_host": "158.85.255.230",
        "discovery_port": "32934",
        "api_host": "158.85.255.230",
        "api_port": "32935",
        "id": "83c11879-567d-4516-9824-aed14b6f8cf9_vp3",
        "api_url": "http://158.85.255.230:32935"
      }
    ];

if (process.env.VCAP_SERVICES){
	console.log("We are running in Cloud Foundry!");
	
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	if(servicesObject && servicesObject['blockchain-staging'] && servicesObject['blockchain-staging'][0] && servicesObject['blockchain-staging'][0].credentials){
		console.log('loading peers from env');
		peers = servicesObject['blockchain-staging'][0].credentials.peers;
	}
}
obc.network(peers);																									//setup network connection for rest endpoint

/*
obc.clear(cb_cleaned);
function cb_cleaned(){
	var options = 	{
						zip_url: 'https://hub.jazz.net/git/averyd/cc_ex02/archive?revstr=master',
						dir: 'chaincode_example02',
						git_url: 'https://hub.jazz.net/git/averyd/cc_ex02/chaincode_example02',
					};
	//obc.load(options, cb_ready);				//parse/load chaincode
}
*/

/*
var options = 	{
					zip_url: 'https://hub.jazz.net/git/averyd/cc_ex02/archive?revstr=master',
					dir: 'chaincode_example02',
					git_url: 'https://hub.jazz.net/git/averyd/cc_ex02/chaincode_example02',
				};
*/
var options = 	{
					zip_url: 'https://codeload.github.com/dshuffma-ibm/simplestuff/zip/master',
					dir: 'simplestuff-master',
					git_url: 'https://github.com/dshuffma-ibm/simplestuff',
					name: 'ba0c1e910af1b479c606e5295050499f3d558ebb78a49a489af437f17ea59025c56e990a1652893437f578a9aca449974e70d54e0fd2d1b942f46b4a81a55425'
				};
obc.load(options, cb_ready);				//parse/load chaincode

function cb_ready(err, cc){
	//obc.save('./');
	contract = cc;
	//obc.clear();
	//contract.cc.read('a', cb_next);
	//contract.cc.deploy('init',  ["a", "101", "b", "202"], cb_next);
	//contract.cc.read('a', cb_next);
	/*
	function cb_next(e, value){
		contract.cc.read('a', cb_next2);
	contract.cc.write('a', (value + 1), cb_next2);
		contract.invoke(["a", "b", "5"], cb_next2);
	}
	function cb_next2(){
		contract.cc.read('a');
		contract.cc.read('b');
	}
	*/
}
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
var peers =    [
      {
        "discovery_host": "169.44.38.124",
        "discovery_port": "32780",
        "api_host": "169.44.38.124",
        "api_port": "32781",
        "id": "b6ec263b-20c4-4a3e-ad89-f3ecff139b37_vp1",
        "api_url": "http://169.44.38.124:32781"
      },
      {
        "discovery_host": "169.44.38.114",
        "discovery_port": "32770",
        "api_host": "169.44.38.114",
        "api_port": "32771",
        "id": "b6ec263b-20c4-4a3e-ad89-f3ecff139b37_vp3",
        "api_url": "http://169.44.38.114:32771"
      },
      {
        "discovery_host": "169.44.38.102",
        "discovery_port": "32776",
        "api_host": "169.44.38.102",
        "api_port": "32777",
        "id": "b6ec263b-20c4-4a3e-ad89-f3ecff139b37_vp2",
        "api_url": "http://169.44.38.102:32777"
      },
      {
        "discovery_host": "169.44.38.120",
        "discovery_port": "32776",
        "api_host": "169.44.38.120",
        "api_port": "32777",
        "id": "b6ec263b-20c4-4a3e-ad89-f3ecff139b37_vp4",
        "api_url": "http://169.44.38.120:32777"
      },
      {
        "discovery_host": "169.44.38.120",
        "discovery_port": "32778",
        "api_host": "169.44.38.120",
        "api_port": "32779",
        "id": "b6ec263b-20c4-4a3e-ad89-f3ecff139b37_vp5",
        "api_url": "http://169.44.38.120:32779"
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
					deployed_name: 'c1e753194f800976e5c1640b283748572ea97ba6d438f786355f77daa6cfc823cb7ab2c290fd2810d86681044bc936408fa9179070913195c66cd23c82bb79a4'
				};
obc.load(options, cb_ready);															//parse/load chaincode

function cb_ready(err, cc){																//response has chaincode functions
	app1.setup(obc, cc);
	app2.setup(obc, cc);
	if(cc.details.deployed_name === ""){												//decide if i need to deploy
		cc.deploy('init', ['99'], './', cb_deployed);
	}
	else{
		console.log('chaincode summary file indicates chaincode has been previously deployed');
		cb_deployed();
	}
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(){
	console.log('starting websocket');
	obc.save('./cc_summaries');															//save it here for chaincode investigator
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
		
		ws.on('close', function(){
			app2.close();
		});
	});
}

/* ignore this code
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


/*
CCI improvements
- [x] simpilify chaincode.json, remove discovery and api_url
- [x] save chaincode.json as cc_<hash>.json
- [x] have GET API that retruns all cc_<hash>.json file names
- [x] have GET API that returns the cc_<hash>.json file
- [x] allow cci to take in <hash> as url parameter
- [ ] deploy on CCI actually runs through flow
	- load spin icon
	- poll on new chaincode.json file name API
	- finally fade spin and rebuild UI from file
	- (depending on how this works maybe remove HTML5 local storage)
*/
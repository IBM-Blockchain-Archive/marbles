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
app.use( serve_static(path.join(__dirname, 'public')) );
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

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'production';
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
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
var peers =     [
      {
        "discovery_host": "169.44.38.113",
        "discovery_port": "33668",
        "api_host": "169.44.38.113",
        "api_port": "33669",
        "type": "peer",
        "network_id": "46d54f75-9813-4deb-ab35-de7151f741a2",
        "id": "46d54f75-9813-4deb-ab35-de7151f741a2_vp1",
        "api_url": "http://169.44.38.113:33669"
      },
      {
        "discovery_host": "169.44.38.114",
        "discovery_port": "33477",
        "api_host": "169.44.38.114",
        "api_port": "33478",
        "type": "peer",
        "network_id": "46d54f75-9813-4deb-ab35-de7151f741a2",
        "id": "46d54f75-9813-4deb-ab35-de7151f741a2_vp2",
        "api_url": "http://169.44.38.114:33478"
      },
      {
        "discovery_host": "169.44.38.124",
        "discovery_port": "33550",
        "api_host": "169.44.38.124",
        "api_port": "33551",
        "type": "peer",
        "network_id": "46d54f75-9813-4deb-ab35-de7151f741a2",
        "id": "46d54f75-9813-4deb-ab35-de7151f741a2_vp4",
        "api_url": "http://169.44.38.124:33551"
      },
      {
        "discovery_host": "169.44.38.120",
        "discovery_port": "33512",
        "api_host": "169.44.38.120",
        "api_port": "33513",
        "type": "peer",
        "network_id": "46d54f75-9813-4deb-ab35-de7151f741a2",
        "id": "46d54f75-9813-4deb-ab35-de7151f741a2_vp3",
        "api_url": "http://169.44.38.120:33513"
      }
    ];
console.log('loading hardcoded peers');

var users = [
      {
        "username": "peer1",
        "secret": "5bc1293a41"
      },
      {
        "username": "peer2",
        "secret": "c7d1e446b9"
      },
      {
        "username": "peer3",
        "secret": "42e724215d"
      },
      {
        "username": "peer4",
        "secret": "10a155d41b"
      },
      {
        "username": "peer5",
        "secret": "cd58003225"
      },
      {
        "username": "user1",
        "secret": "f9780651c4"
      },
      {
        "username": "user2",
        "secret": "1015d5f2df"
      },
      {
        "username": "user3",
        "secret": "b0abf4a54d"
      },
      {
        "username": "user4",
        "secret": "3e14768ea7"
      },
      {
        "username": "user5",
        "secret": "b6cb13486c"
      }
    ];
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
				break;
			}
		}
	}
}
// CATCH - We should only use 'user1-n', so deleting others
var valid_users = [];
for(var i = 0; i < users.length; i++) {
	if(users[i].username.indexOf('user') == 0){
		valid_users.push(users[i]);
	}
}

users = valid_users;
obc.network(peers);																		//setup network connection for rest endpoint

// ==================================
// configure obc-js sdk
// ==================================
var options = 	{
					zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
					git_dir: 'marbles-chaincode-master/phase2',													//subdirectroy name of chaincode after unzipped
					git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/phase2',						//git clone http url
					
					//hashed cc name from prev deployment
					//deployed_name: '4a237d1e7be8bb2fe61a9f00b7200c1f9a16f77ec2dc4045a540fd84da2327a80975d66394add22961544ea07dae943a1941f175d547b554a0b5d5d2fa8d7c93'
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.deployed_name = "";
}
obc.load(options, cb_ready);															//parse/load chaincode

function cb_ready(err, cc){																//response has chaincode functions
	async.each([0, 1, 2, 3], function(index, cb) {
		obc.switchPeer(index, users[index].username);
		obc.register(users[index].username, users[index].secret, cb);
	}, function(err) {
		app1.setup(obc, cc);
		app2.setup(obc, cc);
		if(cc.details.deployed_name === ""){												//decide if i need to deploy
			cc.deploy('init', ['99'], './cc_summaries', cb_deployed);
		}
		else{
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			cb_deployed();
		}
	});
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d){
	console.log('!', e);
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
		});
		
		ws.on('close', function(){
			app2.close();																//close peridic poll that phase 2 does
		});
	});
}

/* ignore this code - 2/1/2016
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
- [ ] 
	- load spin icon
	- poll on new chaincode.json file name API
	- finally fade spin and rebuild UI from file
	- (depending on how this works maybe remove HTML5 local storage)
*/
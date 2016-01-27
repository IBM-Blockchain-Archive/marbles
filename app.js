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
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
server.timeout = 240000;																							// Ta-da.
console.log('info', '------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');



// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
var ws = require('ws');
var wss = new ws.Server({server: server});
	
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received ws msg:', message);
		var data = JSON.parse(message);
		
		// ==================================
		// incoming messages, look for type
		// ==================================
		if(data.type == 'create'){
			console.log('its a create!');
			contract.init_marble([data.name, data.color, data.size, data.user], cb_invoked);				//create a new marble
		}
		else if(data.type == 'get'){
			get_marbles();
		}
		else if(data.type == 'transfer'){
			console.log('transfering');
			contract.set_user([data.name, data.user]);
		}
		else if(data.type == 'remove'){
			contract.cc.remove(data.name);
		}
	});
	
	get_marbles();																							//on start fetch the marble index var
	function get_marbles(){
		console.log('fetching all marble data');
		contract.cc.read('marbleIndex', cb_got_index);
	
	}
	
	function cb_got_index(e, index){
		if(e != null) console.log('error:', e);
		else{
			try{
				var json = JSON.parse(index);
				for(var i in json){
					console.log('!', i, json[i]);
					contract.cc.read(json[i], cb_got_marble);												//iter over each, read their values
				}
			}
			catch(e){
				console.log('error:', e);
			}
		}
	}
	
	function cb_got_marble(e, marble){
		if(e != null) console.log('error:', e);
		else {
			ws.send(JSON.stringify({msg: 'marbles', e: e, marble: marble}));
		}
	}
	
	function cb_invoked(e, a){
		console.log('response: ', e, a);
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

// ==================================
// load peers manually or from VCAP
// ==================================
var peers =     [
      {
        "discovery_host": "169.53.72.245",
        "discovery_port": "33490",
        "api_host": "169.53.72.245",
        "api_port": "33491",
        "id": "b6631eb8-9108-4d53-8202-8492d1d33a45_vp1",
        "api_url": "http://169.53.72.245:33491"
      },
      {
        "discovery_host": "158.85.255.239",
        "discovery_port": "33096",
        "api_host": "158.85.255.239",
        "api_port": "33097",
        "id": "b6631eb8-9108-4d53-8202-8492d1d33a45_vp5",
        "api_url": "http://158.85.255.239:33097"
      },
      {
        "discovery_host": "158.85.255.228",
        "discovery_port": "33070",
        "api_host": "158.85.255.228",
        "api_port": "33071",
        "id": "b6631eb8-9108-4d53-8202-8492d1d33a45_vp3",
        "api_url": "http://158.85.255.228:33071"
      },
      {
        "discovery_host": "169.53.72.245",
        "discovery_port": "33492",
        "api_host": "169.53.72.245",
        "api_port": "33493",
        "id": "b6631eb8-9108-4d53-8202-8492d1d33a45_vp2",
        "api_url": "http://169.53.72.245:33493"
      },
      {
        "discovery_host": "158.85.255.230",
        "discovery_port": "33084",
        "api_host": "158.85.255.230",
        "api_port": "33085",
        "id": "b6631eb8-9108-4d53-8202-8492d1d33a45_vp4",
        "api_url": "http://158.85.255.230:33085"
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
					zip_url: 'https://codeload.github.com/dshuffma-ibm/simplestuff/zip/master',							//make sure this does not have any redirects - dsh to do fix
					git_dir: 'simplestuff-master',																		//subdirectroy name of chaincode after unzipped
					git_url: 'https://github.com/dshuffma-ibm/simplestuff',												//git clone http url
					
					//hashed cc name from prev deploy [IF YOU COMMENT LINE BELOW OUT IT WILL DEPLOY]
					deployed_name: '25d1bc4539131897292b4a6b805acb10b547f819735044eff93ffb59c241d9377473cfabff366366b27d1351d0c527563c4d29464fab81a4aefe24b7cce284bc'
				};
obc.load(options, cb_ready);															//parse/load chaincode

function cb_ready(err, cc){																//response has chaincode functions
	contract = cc;																		//copy to higher scope
	if(contract.cc.details.deployed_name === ""){										//decide if i need to deploy
		contract.cc.deploy('init', ['99'], './', cb_deployed);
	}
	else{
		obc.save('./');
		console.log('chaincode details indicates chaincode has been previously deployed');
	}
}

function cb_deployed(){
	console.log('sdk has deployed code and waited');
}
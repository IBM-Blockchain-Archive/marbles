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
		// APP 1 - incoming messages, look for type
		// ==================================
		if(data.type == 'create'){
			console.log('its a create!');
			chaincode.init_marble([data.name, data.color, data.size, data.user], cb_invoked);				//create a new marble
		}
		else if(data.type == 'get'){
			console.log('get marbles msg');
			get_marbles();
		}
		else if(data.type == 'transfer'){
			console.log('transfering msg');
			chaincode.set_user([data.name, data.user]);
		}
		else if(data.type == 'remove'){
			console.log('removing msg');
			chaincode.remove(data.name);
		}
		else if(data.type == 'chainstats'){
			console.log('chainstats msg');
			obc.chain_stats(cb_chainstats);
		}
	});
	
	get_marbles();																							//on start fetch the marble index var
	obc.chain_stats(cb_chainstats);
	function get_marbles(){
		console.log('fetching all marble data');
		chaincode.read('marbleIndex', cb_got_index);
	
	}
	
	function cb_got_index(e, index){
		if(e != null) console.log('error:', e);
		else{
			try{
				var json = JSON.parse(index);
				for(var i in json){
					console.log('!', i, json[i]);
					chaincode.read(json[i], cb_got_marble);												//iter over each, read their values
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
	
	var chain_stats = {};
	function cb_chainstats(e, stats){
		//console.log('stats', stats.height);
		chain_stats = stats;
		obc.block_stats(stats.height - 1, cb_blockstats);
	}
	
	function cb_blockstats(e, stats){
		//console.log('replying', stats);
		ws.send(JSON.stringify({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats}));
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
var chaincode = {};

// ==================================
// load peers manually or from VCAP
// ==================================
var peers =    [
      {
        "discovery_host": "158.85.255.239",
        "discovery_port": "33130",
        "api_host": "158.85.255.239",
        "api_port": "33131",
        "id": "689332ba-ef64-414c-9e10-61b3dfd538e2_vp1",
        "api_url": "http://158.85.255.239:33131"
      },
      {
        "discovery_host": "158.85.255.228",
        "discovery_port": "33126",
        "api_host": "158.85.255.228",
        "api_port": "33127",
        "id": "689332ba-ef64-414c-9e10-61b3dfd538e2_vp4",
        "api_url": "http://158.85.255.228:33127"
      },
      {
        "discovery_host": "169.53.72.250",
        "discovery_port": "33541",
        "api_host": "169.53.72.250",
        "api_port": "33542",
        "id": "689332ba-ef64-414c-9e10-61b3dfd538e2_vp2",
        "api_url": "http://169.53.72.250:33542"
      },
      {
        "discovery_host": "158.85.255.230",
        "discovery_port": "33132",
        "api_host": "158.85.255.230",
        "api_port": "33133",
        "id": "689332ba-ef64-414c-9e10-61b3dfd538e2_vp5",
        "api_url": "http://158.85.255.230:33133"
      },
      {
        "discovery_host": "158.85.255.230",
        "discovery_port": "33134",
        "api_host": "158.85.255.230",
        "api_port": "33135",
        "id": "689332ba-ef64-414c-9e10-61b3dfd538e2_vp3",
        "api_url": "http://158.85.255.230:33135"
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
	chaincode = cc;																		//copy to higher scope
	if(chaincode.details.deployed_name === ""){										//decide if i need to deploy
		chaincode.deploy('init', ['99'], './', cb_deployed);
	}
	else{
		obc.save('./');
		console.log('chaincode details indicates chaincode has been previously deployed');
	}
}

function cb_deployed(){
	console.log('sdk has deployed code and waited');
}

function cb_stats(e, data){
	console.log('got', data.currentBlockHash);
}
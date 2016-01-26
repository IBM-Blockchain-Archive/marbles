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


var ws = require('ws');
var wss = new ws.Server({server: server});
	
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received ws msg:', message);
		var data = JSON.parse(message);
		
		//// messages ////
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
	
	get_marbles();
	function get_marbles(){
		console.log('fetching all marble data');
		contract.cc.read('marbleIndex', cb_got_index);
	}
	
	
	function cb_got_index(e, index){
		if(e != null) console.log('error:', e);
		else{
			var json = JSON.parse(index);
			for(var i in json){
				console.log('!', i, json[i]);
				contract.cc.read(json[i], cb_got_marble);
			}
		}
	}
	function cb_got_marble(e, marble){
		if(e != null) console.log('error:', e);
		else {
			for(var i in marble) {						//set it to lowercase!
				var temp = marble[i];
				delete marble[i];
				if(temp != null){
					marble[i.toLowerCase()] = temp;
				}
			}
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
var peers =    [
      {
        "discovery_host": "169.53.72.250",
        "discovery_port": "33521",
        "api_host": "169.53.72.250",
        "api_port": "33522",
        "id": "fc5afff6-7498-4422-b692-440372017285_vp5",
        "api_url": "http://169.53.72.250:33522"
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
					name: '460d0c215e0a9cb807244b5bd1648c535b262b0796c86e9dfc025913dba038048c08dbf1841782643baae2f4c49b40f65298dabb228abc27b8b47e8cc6aea27b'
				};
obc.load(options, cb_ready);				//parse/load chaincode

function cb_ready(err, cc){
	obc.save('./');
	contract = cc;
}
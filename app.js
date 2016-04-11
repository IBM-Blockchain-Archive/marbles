'use strict';
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
var setup = require('./setup');
var cors = require('cors');

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
	console.log('Error Handeler -', req.url);
	var errorCode = err.status || 500;
	res.status(errorCode);
	req.bag.error = {msg:err.stack, status:errorCode};
	if(req.bag.error.status == 404) req.bag.error.msg = 'Sorry, I cannot locate that file';
	res.render('template/error', {bag:req.bag});
});

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function() {});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');

// ============================================================================================================================
// 														Deployment Tracking
// ============================================================================================================================
console.log('- Tracking Deployment');
require('cf-deployment-tracker-client').track();		//reports back to us, this helps us judge interest! feel free to remove it

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
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
//this hard coded list is intentionaly left here, feel free to use it when initially starting out
//please create your own network when you are up and running
var manual ={
  'credentials': {
    'peers': [
      {
        'discovery_host': '45ed1a15-0967-4c5c-89d8-f6da501a0673_vp1-discovery.blockchain.ibm.com',
        'discovery_port': 30303,
        'api_host': '45ed1a15-0967-4c5c-89d8-f6da501a0673_vp1-api.blockchain.ibm.com',
        'api_port_tls': 443,
        'api_port': 80,
        'type': 'peer',
        'network_id': '45ed1a15-0967-4c5c-89d8-f6da501a0673',
        'container_id': '31afd1c48d46a7063b88085e095a4403eccdb37e68880a232d81ca010ee68a3b',
        'id': '45ed1a15-0967-4c5c-89d8-f6da501a0673_vp1',
        'api_url': 'http://45ed1a15-0967-4c5c-89d8-f6da501a0673_vp1-api.blockchain.ibm.com:80'
      },
      {
        'discovery_host': '45ed1a15-0967-4c5c-89d8-f6da501a0673_vp2-discovery.blockchain.ibm.com',
        'discovery_port': 30303,
        'api_host': '45ed1a15-0967-4c5c-89d8-f6da501a0673_vp2-api.blockchain.ibm.com',
        'api_port_tls': 443,
        'api_port': 80,
        'type': 'peer',
        'network_id': '45ed1a15-0967-4c5c-89d8-f6da501a0673',
        'container_id': '2258d3579c71e21c156e6e9061a66351e510c9854c847e270c45bdeda367a70c',
        'id': '45ed1a15-0967-4c5c-89d8-f6da501a0673_vp2',
        'api_url': 'http://45ed1a15-0967-4c5c-89d8-f6da501a0673_vp2-api.blockchain.ibm.com:80'
      }
    ],
    'ca': {
      '45ed1a15-0967-4c5c-89d8-f6da501a0673_ca': {
        'url': '45ed1a15-0967-4c5c-89d8-f6da501a0673_ca-api.blockchain.ibm.com:30303',
        'discovery_host': '45ed1a15-0967-4c5c-89d8-f6da501a0673_ca-discovery.blockchain.ibm.com',
        'discovery_port': 30303,
        'api_host': '45ed1a15-0967-4c5c-89d8-f6da501a0673_ca-api.blockchain.ibm.com',
        'api_port_tls': 30303,
        'api_port': 80,
        'type': 'ca',
        'network_id': '45ed1a15-0967-4c5c-89d8-f6da501a0673',
        'container_id': 'eae951646167cb30e50c04868c571e64799924e18ea45857c994823cc9388835'
      }
    },
    'users': [
      {
        'username': 'user_type0_752b5bb1ab',
        'secret': '3c91d98ee0',
        'enrollId': 'user_type0_752b5bb1ab',
        'enrollSecret': '3c91d98ee0'
      },
      {
        'username': 'user_type0_9b722e3921',
        'secret': '44ce26b43d',
        'enrollId': 'user_type0_9b722e3921',
        'enrollSecret': '44ce26b43d'
      },
      {
        'username': 'user_type1_06d0a3a4ec',
        'secret': 'c61aa23468',
        'enrollId': 'user_type1_06d0a3a4ec',
        'enrollSecret': 'c61aa23468'
      },
      {
        'username': 'user_type1_66f2c206b9',
        'secret': '07004fe81d',
        'enrollId': 'user_type1_66f2c206b9',
        'enrollSecret': '07004fe81d'
      },
      {
        'username': 'user_type2_bb13b926b9',
        'secret': '0b558a1207',
        'enrollId': 'user_type2_bb13b926b9',
        'enrollSecret': '0b558a1207'
      },
      {
        'username': 'user_type2_18fb387f2d',
        'secret': '012a7ff88d',
        'enrollId': 'user_type2_18fb387f2d',
        'enrollSecret': '012a7ff88d'
      },
      {
        'username': 'user_type3_1a6baf2260',
        'secret': 'fe3bd0c19b',
        'enrollId': 'user_type3_1a6baf2260',
        'enrollSecret': 'fe3bd0c19b'
      },
      {
        'username': 'user_type3_8a27ff91ea',
        'secret': 'f0747080ca',
        'enrollId': 'user_type3_8a27ff91ea',
        'enrollSecret': 'f0747080ca'
      },
      {
        'username': 'user_type4_a95499acb9',
        'secret': '93335ed8b2',
        'enrollId': 'user_type4_a95499acb9',
        'enrollSecret': '93335ed8b2'
      },
      {
        'username': 'user_type4_dac9704a4f',
        'secret': '79f52da4b9',
        'enrollId': 'user_type4_dac9704a4f',
        'enrollSecret': '79f52da4b9'
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
			if(servicesObject[i][0].credentials.error){
				console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
				peers = null;
				users = null;
				process.error = {type: 'network', msg: 'Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date.'};
			}
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
// configure ibm-blockchain-js sdk
// ==================================
var options = 	{
					network:{
						peers: peers,
						users: users,
						options: {quiet: true, tls:false, maxRetry: 1}
					},
					chaincode:{
						zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
						unzip_dir: 'marbles-chaincode-master/part2_v1.0.0',											//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/part2_v1.0.0',				//GO git http url
					
						//hashed cc name from prev deployment
						//deployed_name: 'c5181b2ecd0c291d3bdc692921ba65e58d502aa35db2a06539e8a41398548f30c76990544f2edcc10ba4d25621dd1ef7e4c9f04ccab1b907ddc6914c3bc39a64'
					}
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.chaincode.deployed_name = '';
}
ibc.load(options, cb_ready);																//parse/load chaincode

var chaincode = null;
function cb_ready(err, cc){																	//response has chaincode functions
	if(err != null){
		console.log('! looks like an error loading the chaincode or network, app will fail\n', err);
		if(!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
	}
	else{
		chaincode = cc;
		part1.setup(ibc, cc);
		part2.setup(ibc, cc);
		if(!cc.details.deployed_name || cc.details.deployed_name === ''){					//decide if i need to deploy
			cc.deploy('init', ['99'], {save_path: './cc_summaries'}, cb_deployed);
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
		if(!process.error) process.error = {type: 'deploy', msg: e.details};
	}
	else{
		console.log('------------------------------------------ Websocket Up ------------------------------------------');
		ibc.save('./cc_summaries');															//save it here for chaincode investigator
		
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
					data.v = '2';
					client.send(JSON.stringify(data));
				}
				catch(e){
					console.log('error broadcast ws', e);
				}
			});
		};
		
		// ========================================================
		// Monitor the height of the blockchain
		// ========================================================
		ibc.monitor_blockheight(function(chain_stats){										//there is a new block, lets refresh everything that has a state
			if(chain_stats && chain_stats.height){
				console.log('hey new block, lets refresh and broadcast to all');
				ibc.block_stats(chain_stats.height - 1, cb_blockstats);
				wss.broadcast({msg: 'reset'});
				chaincode.query.read(['_marbleindex'], cb_got_index);
				chaincode.query.read(['_opentrades'], cb_got_trades);
			}
			
			//got the block's stats, lets send the statistics
			function cb_blockstats(e, stats){
				if(chain_stats.height) stats.height = chain_stats.height - 1;
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
							chaincode.query.read([json[i]], cb_got_marble);							//iter over each, read their values
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
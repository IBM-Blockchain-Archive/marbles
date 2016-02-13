// ==================================
// APP 1 - incoming messages, look for type
// ==================================
var obc = {};
var chaincode = {};
var last_blockheight = 0;
var pollInt = null;
var async = require('async');

module.exports.setup = function(sdk, cc){
	obc = sdk;
	chaincode = cc;
};

module.exports.process_msg = function(ws, data){
	if(data.v === 2){
		if(data.type == 'create'){
			console.log('its a create!');
			if(data.name && data.color && data.size && data.user){
				chaincode.init_marble([data.name, data.color, data.size, data.user], cb_invoked);				//create a new marble
				ledger_edit();
			}
		}
		else if(data.type == 'get'){
			console.log('get marbles msg');
			get_marbles();
		}
		else if(data.type == 'transfer'){
			console.log('transfering msg');
			if(data.name && data.user){
				chaincode.set_user([data.name, data.user]);
				ledger_edit();
			}
		}
		else if(data.type == 'remove'){
			console.log('removing msg');
			if(data.name){
				chaincode.remove(data.name);
				ledger_edit();
			}
		}
		else if(data.type == 'chainstats'){
			console.log('chainstats msg');
			obc.chain_stats(cb_chainstats);
		}
		else if(data.type == 'open_trade'){
			console.log('open_trade msg');
			if(!data.willing || data.willing.length < 0){
				console.log('error, "willing" is empty');
			}
			else if(!data.want){
				console.log('error, "want" is empty');
			}
			else{
				var args = [data.user, data.want.color, data.want.size, data.willing[0].color, data.willing[0].size];
				chaincode.open_trade(args);
			}
			ledger_edit();
		}
		else if(data.type == 'get_open_trades'){
			console.log('get open trades msg');
			chaincode.read('_opentrades', cb_got_trades);
		}
		else if(data.type == 'perform_trade'){
			console.log('perform trade msg');
			chaincode.perform_trade([data.id, data.closer.user, data.closer.name, data.opener.user, data.opener.color, data.opener.size]);
			ledger_edit();
		}
		else if(data.type == 'remove_trade'){
			console.log('remove trade msg');
			chaincode.remove_trade([data.id]);
			ledger_edit();
		}
		

	}
	
	/* disabled until we move to socket.io, don't want one poll per connection!
	if(pollInt === null){																				//monitor blockchain for events
		pollInt = setInterval(function(){
			console.log('polling on block height');
			obc.chain_stats(cb_chainstats);
		}, 15000);
	}
	*/
	
	function ledger_edit(skip_chainstats){																//there was a ledger edit action, lets refresh all the things
		setTimeout(function(){
			sendMsg({msg: 'reset'});																	//msg to clear the page
			if(!skip_chainstats) obc.chain_stats(cb_chainstats);
			chaincode.read('_opentrades', cb_got_trades);
			get_marbles();
		}, 1200);																						//wait long enough for it to take effect
		
		//setTimeout(function(){																		//if we need to stagger, uncomment
		//	chaincode.read('_opentrades', cb_got_trades);
		//}, 2000);
		
		//setTimeout(function(){
		//	get_marbles();
		//}, 3000);
	}
	
	function get_marbles(){
		console.log('fetching all marble data');
		chaincode.read('marbleIndex', cb_got_index);
	}
	
	function cb_got_index(e, index){
		if(e != null) console.log('error:', e);
		else{
			try{
				var json = JSON.parse(index);
				/*var keys = Object.keys(json);
				var concurrency = 1;

				//serialize if needed...
				async.eachLimit(keys, concurrency, function(key, cb) {
					console.log('!', json[key]);
					chaincode.read(json[key], function(e, marble) {
						if(e != null) console.log('error:', e);
						else {
							sendMsg({msg: 'marbles', e: e, marble: marble});
							cb(null);
						}
					});
				}, function() {
					sendMsg({msg: 'action', e: e, status: 'finished'});
				});*/
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
	
	//call back for getting a marble, lets send a message
	function cb_got_marble(e, marble){
		if(e != null) console.log('error:', e);
		else {
			sendMsg({msg: 'marbles', marble: marble});
		}
	}
	
	function cb_invoked(e, a){
		console.log('response: ', e, a);
	}
	
	//call back for getting the blockchain stats, lets get the block height now
	var chain_stats = {};
	function cb_chainstats(e, stats){
		chain_stats = stats;
		if(stats && stats.height){
			if(last_blockheight != stats.height) {
				console.log('! new block', stats.height);
				last_blockheight = stats.height;
				obc.block_stats(stats.height - 1, cb_blockstats);
			}
			else{
				console.log('! same block...?');
			}
		}
	}

	//call bacak for getting a block's stats, lets send the chain/block stats
	function cb_blockstats(e, stats){
		sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
	}
	
	//call back for getting open trades, lets send the trades
	function cb_got_trades(e, trades){
		if(e != null) console.log('error:', e);
		else {
			if(trades && trades.open_trades){
				sendMsg({msg: 'open_trades', open_trades: trades.open_trades});
			}
		}
	}

	//send a message, socket might be closed...
	function sendMsg(json){
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log('error ws', e);
			}
		}
	}
};

module.exports.close = function(){
	clearInterval(pollInt);
	pollInt = null;
	console.log('closed ws');
};
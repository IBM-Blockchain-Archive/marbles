// ==================================
// APP 1 - incoming messages, look for type
// ==================================
var obc = {};
var chaincode = {};
var async = require('async');

module.exports.setup = function(sdk, cc){
	obc = sdk;
	chaincode = cc;
};

module.exports.process_msg = function(ws, data){
	if(data.v == 1){
		if(data.type == 'create'){
			console.log('its a create!');
			if(data.name && data.color && data.size && data.user){
				chaincode.init_marble([data.name, data.color, data.size, data.user], cb_invoked);				//create a new marble
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
			}
		}
		else if(data.type == 'remove'){
			console.log('removing msg');
			if(data.name){
				chaincode.remove(data.name);
			}
		}
		else if(data.type == 'chainstats'){
			console.log('chainstats msg');
			obc.chain_stats(cb_chainstats);
		}
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
				var keys = Object.keys(json);
				var concurrency = 1;

				//TEST3: TESTING WITH CONCURRENCY, FAILS SOMETIMES MULTIPLE CALLS OVERLAP
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
				});
				
				/*for(var i in json){
					console.log('!', i, json[i]);
					chaincode.read(json[i], cb_got_marble);												//iter over each, read their values
				}*/
			}
			catch(e){
				console.log('error:', e);
			}
		}
	}
	
	function cb_got_marble(e, marble){
		if(e != null) console.log('error:', e);
		else {
			sendMsg({msg: 'marbles', e: e, marble: marble});
		}
	}
	
	function cb_invoked(e, a){
		console.log('response: ', e, a);
	}
	
	var chain_stats = {};
	function cb_chainstats(e, stats){
		//console.log('stats', stats.height);
		chain_stats = stats;
		if(stats && stats.height) obc.block_stats(stats.height - 1, cb_blockstats);
	}
	
	function cb_blockstats(e, stats){
		//console.log('replying', stats);
		sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
	}
	
	
	
	function sendMsg(json){
		try{
			ws.send(JSON.stringify(json));
		}
		catch(e){
			console.log('error ws', e);
		}
	}
};
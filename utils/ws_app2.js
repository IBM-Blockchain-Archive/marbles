// ==================================
// APP 1 - incoming messages, look for type
// ==================================
var obc = {};
var chaincode = {};

module.exports.setup = function(sdk, cc){
	obc = sdk;
	chaincode = cc;
};

module.exports.process_msg = function(ws, data){
	if(data.v === 2){
		if(data.type == 'create'){
			console.log('its a create!');
			chaincode.init_marble([data.name, data.color, data.size, data.user], cb_invoked);				//create a new marble
			ledger_edit();
		}
		else if(data.type == 'get'){
			console.log('get marbles msg');
			get_marbles();
		}
		else if(data.type == 'transfer'){
			console.log('transfering msg');
			chaincode.set_user([data.name, data.user]);
			ledger_edit();
		}
		else if(data.type == 'remove'){
			console.log('removing msg');
			chaincode.remove(data.name);
			ledger_edit();
		}
		else if(data.type == 'chainstats'){
			console.log('chainstats msg');
			obc.chain_stats(cb_chainstats);
		}
	}
	
	function ledger_edit(){																				//there was a ledger edit action, lets refresh all the things
		setTimeout(function(){
			obc.chain_stats(cb_chainstats);
			get_marbles();
		}, 250);																						//wait long enough for it to take effect
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
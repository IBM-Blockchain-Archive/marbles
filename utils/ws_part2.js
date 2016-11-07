// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var hfc_util = require('./hfc_util');
var user = {};
var chaincodeID;
var peer;
var async = require('async');

module.exports.setup = function(_user, _chaincodeID, _peer){
	user = _user;
	chaincodeID = _chaincodeID;
	peer = _peer;
};

module.exports.process_msg = function(ws, data){
	if(data.v === 2){																						//only look at messages for part 2
		if(data.type == 'create'){
			console.log('its a create!');
			if(data.name && data.color && data.size && data.user){
				chaincode.invoke.init_marble([data.name, data.color, data.size, data.user], cb_invoked);	//create a new marble
				hfc_util.invokeCC(user, chaincodeID, "init_marble", [data.name, data.color, data.size, data.user], cb_invoked);
			}
		}
		else if(data.type == 'get'){
			console.log('get marbles msg');
			hfc_util.queryCC(user, chaincodeID, "read", ['_marbleindex'], cb_got_index);
		}
		else if(data.type == 'transfer'){
			console.log('transfering msg');
			if(data.name && data.user){
				hfc_util.invokeCC(user, chaincodeID, "set_user", [data.name, data.user]);
			}
		}
		else if(data.type == 'remove'){
			console.log('removing msg');
			if(data.name){
				hfc_util.invokeCC(user, chaincodeID, "delete", [data.name]);
			}
		}
		else if(data.type == 'chainstats'){
			console.log('chainstats msg');
			hfc_util.getChainStats(peer, cb_chainstats);
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
				var args = [data.user, data.want.color, data.want.size];
				for(var i in data.willing){
					args.push(data.willing[i].color);
					args.push(data.willing[i].size);
				}
				hfc_util.invokeCC(user, chaincodeID, "open_trade", args);
			}
		}
		else if(data.type == 'get_open_trades'){
			console.log('get open trades msg');
			hfc_util.queryCC(user, chaincodeID, "read", ['_opentrades'], cb_got_trades);
		}
		else if(data.type == 'perform_trade'){
			console.log('perform trade msg');
			var args = [data.id, data.closer.user, data.closer.name, data.opener.user, data.opener.color, data.opener.size];
			hfc_util.invokeCC(user, chaincodeID, "perform_trade", args);
		}
		else if(data.type == 'remove_trade'){
			console.log('remove trade msg');
			hfc_util.invokeCC(user, chaincodeID, "remove_trade", [data.id]);
		}
	}


	//got the marble index, lets get each marble
	function cb_got_index(e, index){
		if(e != null) console.log('[ws error] did not get marble index:', e);
		else{
			try{
				var json = JSON.parse(index);
				for(var i in json){
					console.log('!', i, json[i]);
					hfc_util.queryCC(user, chaincodeID, "read", [json[i]], cb_got_marble);
				}
			}
			catch(e){
				console.log('[ws error] could not parse response', e);
			}
		}
	}

	//call back for getting a marble, lets send a message
	function cb_got_marble(e, marble){
		if(e != null) console.log('[ws error] did not get marble:', e);
		else {
			try{
				sendMsg({msg: 'marbles', marble: JSON.parse(marble)});
			}
			catch(e){}
		}
	}

	function cb_invoked(e, a){
		console.log('response: ', e, a);
	}

	//call back for getting the blockchain stats, lets get the block stats now
	function cb_chainstats(e, chain_stats){
		if(chain_stats && chain_stats.height){
			chain_stats.height = chain_stats.height - 1;								//its 1 higher than actual height
			var list = [];
			for(var i = chain_stats.height; i >= 1; i--){								//create a list of heights we need
				list.push(i);
				if(list.length >= 8) break;
			}
			list.reverse();																//flip it so order is correct in UI
			async.eachLimit(list, 1, function(block_height, cb) {						//iter through each one, and send it
				hfc_util.getBlockStats(peer, block_height, function(e, stats){
					if(e == null){
						stats.height = block_height;
						sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
					}
					cb(null);
				});
			}, function() {
			});
		}
	}

	//call back for getting open trades, lets send the trades
	function cb_got_trades(e, trades){
		if(e != null) console.log('[ws error] did not get open trades:', e);
		else {
			try{
				trades = JSON.parse(trades);
				if(trades && trades.open_trades){
					sendMsg({msg: 'open_trades', open_trades: trades.open_trades});
				}
			}
			catch(e){}
		}
	}

	//send a message, socket might be closed...
	function sendMsg(json){
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log('[ws error] could not send msg', e);
			}
		}
	}
};

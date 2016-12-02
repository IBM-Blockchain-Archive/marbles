// ==================================
// Part 1 - incoming messages, look for type
// ==================================
var user = {};
var chaincodeID;
var peer;
var async = require('async');


//-------------------------------------------------------------------
// Marbles Chaincode Library
//-------------------------------------------------------------------
module.exports = function (webUser, marbles_lib, logger) {
	var part1 = {};

	part1.setup = function(_user, _chaincodeID, _peer){
		user = _user;
		chaincodeID = _chaincodeID;
		peer = _peer;
	};

	part1.process_msg = function(ws, data){
		if(data.v === 1){																						//only look at messages for part 1
			
			// create a new marble
			if(data.type == 'create'){
				console.log('[ws] create marbles msg');
				if(data.name && data.color && data.size && data.owner){
					marbles_lib.create_a_marble(webUser, [data.name, data.color, data.size, data.owner], function(){
						/*setTimeout(function(){
							marble_cb();
						}, 1500);*/
					});
				}
				else console.log('bad inputs for create', data);
			}

			//get all marbles
			else if(data.type == 'get'){
				console.log('[ws] get marbles msg');
				//hfc_util.queryCC(user, chaincodeID, 'read', ['_marbleindex'], cb_got_index);
				marbles_lib.get_marble_list(webUser, function(err, resp){
					console.log('\n\n\nthis is wat i got 1: marbles:', resp.payload[0].length);
					console.log(err, JSON.stringify(resp));

					async.eachLimit(resp.payload[0], 1, function(marble_id, cb) {
						console.log('\nlooking at...', marble_id);
						marbles_lib.get_marble(webUser, marble_id, function(err2, resp2){
							if(resp2.payload && resp2.payload[0] && resp2.payload[0].owner) {
								sendMsg({msg: 'marbles', e: err2, marble: resp2.payload[0]});
							}
							else{
								console.log('!warning - did not find marble data in resp');
							}
							cb();
						});
					}, function() {
						console.log('finished reading all marbles');
						sendMsg({msg: 'action', e: null, status: 'finished'});
					});
				});
			}

			//transfer a marble
			else if(data.type == 'transfer'){
				console.log('transfering msg');
				if(data.name && data.owner){
					marbles_lib.set_marble_owner(webUser, [data.name, data.owner], function(err, resp){
						/*setTimeout(function(){
							
						}, 2000);*/
					});
				}
				else console.log('bad inputs for set owner', data);
			}

			//delete marble
			else if(data.type == 'remove'){
				console.log('removing msg');
				if(data.name){
					//hfc_util.invokeCC(user, chaincodeID, 'delete', [data.name]);
					marbles_lib.delete_marble(webUser, [data.name], function(err, resp){
						/*setTimeout(function(){
							
						}, 2000);*/
					});
				}
			}

			/*
			else if(data.type == 'chainstats'){
				console.log('get chainstats');
				hfc_util.getChainStats(peer, cb_chainstats);
			}*/
		}

		//got the marble index, lets get each marble
		/*function cb_got_index(e, index){
			if(e != null) console.log('[ws error] did not get marble index:', e);
			else{
				try{
					console.log('Got index: ' + index[0].toString('utf8'));
					if (index[0].toString('utf8') == 'null') {
						console.log('Null index found, so no marbles.');
						sendMsg({msg: 'action', e: e, status: 'finished'});
						return;
					}
					var json = JSON.parse(index);
					var keys = Object.keys(json);
					var concurrency = 1;

					//serialized version
					async.eachLimit(keys, concurrency, function(key, cb) {
						console.log('!', json[key]);
						hfc_util.queryCC(user, chaincodeID, 'read', [json[key]], function(e, marble) {
							if(e != null) console.log('[ws error] did not get marble:', e);
							else {
								if(marble) sendMsg({msg: 'marbles', e: e, marble: JSON.parse(marble)});
								cb(null);
							}
						});
					}, function() {
						sendMsg({msg: 'action', e: e, status: 'finished'});
					});
				}
				catch(e){
					console.log('[ws error] could not parse response', e);
				}
			}
		}*/

		/*function cb_invoked(e, a){
			console.log('response: ', e, a);
		}*/

		//call back for getting the blockchain stats, lets get the block stats now
		/*function cb_chainstats(e, chain_stats){
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
						} else {
							console.log('ws_part1.js - error getting block stats: ' + e);
						}
						cb(null);
					});
				}, function() {
				});
			}
		}*/

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

	return part1;
};

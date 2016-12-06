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
				console.log('[ws] create marbles req');
				marbles_lib.create_a_marble(webUser, [data.name, data.color, data.size, data.username, data.company], function(){
					/*setTimeout(function(){
						marble_cb();
					}, 1500);*/
				});
			}

			//get all marbles
			else if(data.type == 'get_marbles'){
				console.log('[ws] get marbles req');
				//hfc_util.queryCC(user, chaincodeID, 'read', ['_marbleindex'], cb_got_index);
				marbles_lib.get_marble_list(webUser, function(err, resp){
					console.log('\n\n\nthis is wat i got - marbles:', resp.payload[0].length);
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
			else if(data.type == 'transfer_marble'){
				console.log('transfering req');
				marbles_lib.set_marble_owner(webUser, [data.name, data.username, process.env.marble_company], function(err, resp){
					/*setTimeout(function(){
							
					}, 2000);*/
				});
			}

			//delete marble
			else if(data.type == 'remove'){
				console.log('removing req');
				//hfc_util.invokeCC(user, chaincodeID, 'delete', [data.name]);
				marbles_lib.delete_marble(webUser, [data.name], function(err, resp){
					/*setTimeout(function(){
						
					}, 2000);*/
				});
			}

			//get all owners and their company
			else if(data.type == 'get_owners'){
				console.log('[ws] get all owners req');
				marbles_lib.get_owner_list(webUser, function(err, resp){
					console.log('\n\n\nthis is what i got - owners:', resp.payload[0].length);
					console.log(err, JSON.stringify(resp));

					var ret = [];
					for(var i in resp.payload[0]){						//lets reformat it a bit, only need 1 peer's response
						var pos = resp.payload[0][i].indexOf('.');
						var temp = 	{
										username: resp.payload[0][i].substring(0, pos),
										company: resp.payload[0][i].substring(pos + 1)
									};
						ret.push(temp);
					}
					sendMsg({msg: 'owners', e: err, owners: ret});
				});
			}

			/*
			else if(data.type == 'chainstats'){
				console.log('get chainstats');
				hfc_util.getChainStats(peer, cb_chainstats);
			}*/
		}

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

// ==================================
// Part 1 - incoming messages, look for type
// ==================================
var async = require('async');
var path = require('path');

//-------------------------------------------------------------------
// Marbles Chaincode Library
//-------------------------------------------------------------------
module.exports = function (webUser, marbles_lib, logger) {
	var hfc = require(path.join(__dirname, '../utils/fabric-sdk-node2/index.js'));
	var helper = require(path.join(__dirname, './helper.js'))(process.env.creds_filename, console);
	var ws_server = {};

	ws_server.setup = function(l_webUser, l_marbles_lib, logger){
		webUser = l_webUser;
		marbles_lib = l_marbles_lib;
		logger = l_marbles_lib;
	};

	ws_server.process_msg = function(ws, data){
		var options = {};
		if(marbles_lib === null) {
			console.log('error! marbles lib is null...');
			return;
		}
			
		// create a new marble
		if(data.type == 'create'){
			console.log('[ws] create marbles req');
			options = [data.name, data.color, data.size, data.username, data.company];
			marbles_lib.create_a_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], options, function(){
				/*setTimeout(function(){
					marble_cb();
				}, 1500);*/
			});
		}

		//get all marbles
		else if(data.type == 'get_marbles'){
			console.log('[ws] get marbles req');
			var by_user = {};
			marbles_lib.get_marble_list(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(err, resp){
				console.log('\n\n\nthis is wat i got - marbles:', resp.payload[0].length);
				console.log(err, JSON.stringify(resp));

				async.eachLimit(resp.payload[0], 1, function(marble_id, cb) {
					console.log('\nlooking at...', marble_id);
					marbles_lib.get_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], marble_id, function(err2, resp2){
						if(resp2.payload && resp2.payload[0] && resp2.payload[0].owner) {
							var marble = resp2.payload[0];
							if(!by_user[marble.owner.username]) {
								by_user[marble.owner.username] = [];
							}
							by_user[marble.owner.username].push(marble);					//organize marbles by their owner
						}
						else{
							console.log('!warning - did not find marble data in resp');
						}
						cb();
					});
				}, function() {
					for(var i in by_user){
						var obj = 	{
										msg: 'users_marbles',
										e: null,
										username: i,
										company: by_user[i][0].owner.company,
										marbles: by_user[i]
									};
						console.log('sending all marbles for', i, obj.marbles.length);
						sendMsg(obj);														//send each marble owner's marbles
					}
					console.log('finished sending all users marbles');
					sendMsg({msg: 'all_marbles_sent', e: null});
				});
			});
		}

		//transfer a marble
		else if(data.type == 'transfer_marble'){
			console.log('[ws] transfering req');
			options = [data.name, data.username, data.company, process.env.marble_company];
			marbles_lib.set_marble_owner(webUser, [hfc.getPeer(helper.getPeersUrl(0))], options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}

		//delete marble
		else if(data.type == 'delete_marble'){
			console.log('[ws] delete marble req');
			marbles_lib.delete_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], [data.name], function(err, resp){
				/*setTimeout(function(){
					
				}, 2000);*/
			});
		}

		//get all owners and their company
		else if(data.type == 'get_owners'){
			console.log('[ws] get all owners req');
			marbles_lib.get_owner_list(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(err, resp){
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
							console.log(' - error getting block stats: ' + e);
						}
						cb(null);
					});
				}, function() {
				});
			}
		}*/

		//send transaction error msg 
		function send_err(msg, input){
			sendMsg({msg: 'tx_error', e: msg, input: input});
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

	return ws_server;
};

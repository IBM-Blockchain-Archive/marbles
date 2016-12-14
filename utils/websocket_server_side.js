// ==================================
// Websocket Server Side Code 
// ==================================
//var async = require('async');
var path = require('path');

module.exports = function (checkPerodically, marbles_lib, logger) {
	var hfc = require(path.join(__dirname, '../utils/fabric-sdk-node2/index.js'));
	var helper = require(path.join(__dirname, './helper.js'))(process.env.creds_filename, console);
	var ws_server = {};
	var webUser = null;
	var broadcast = null;
	//var known_marble_owners = [];
	//var known_marbles = [];
	var known_everything = {};

	//setup this module
	ws_server.setup = function(l_webUser, l_marbles_lib, l_broadcast, logger){
		webUser = l_webUser;
		marbles_lib = l_marbles_lib;
		broadcast = l_broadcast;
		logger = l_marbles_lib;
	};

	//process web socket messages
	ws_server.process_msg = function(ws, data){
		var options = {};
		if(marbles_lib === null) {
			console.log('error! marbles lib is null...');				//can't run in this state
			return;
		}
			
		// create a new marble
		if(data.type == 'create'){
			console.log('[ws] create marbles req');
			options = [data.name, data.color, data.size, data.username, data.company];
			marbles_lib.create_a_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], ws, options, function(){

			});
		}

		//get all marbles
		else if(data.type == 'get_marbles'){
			console.log('[ws] get marbles req');
			// 12/14/2016 - removed
			//check_for_new_marbles(ws);
		}

		//transfer a marble
		else if(data.type == 'transfer_marble'){
			console.log('[ws] transfering req');
			options = [data.name, data.username, data.company, process.env.marble_company];
			marbles_lib.set_marble_owner(webUser, [hfc.getPeer(helper.getPeersUrl(0))], ws, options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}

		//delete marble
		else if(data.type == 'delete_marble'){
			console.log('[ws] delete marble req');
			marbles_lib.delete_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], ws, [data.name], function(err, resp){

			});
		}

		//get all owners, marbles, & companies
		else if(data.type == 'read_everything'){
			console.log('[ws] read everything req');
			ws_server.check_for_updates(ws);
		}

		//get all owners and their company
		else if(data.type == 'get_owners'){
			console.log('[ws] get all owners req');

			//ws_server.check_for_new_users(ws);

			/* 12/14/2016 - removed
			marbles_lib.get_owner_list(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(err, resp){
				if(err != null){
					console.log('\n\ncould not get owners:', err);
				}
				else{
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
				}
			});
			*/
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

	//sch next periodic check
	function sch_next_check(){
		clearTimeout(checkPerodically);
		checkPerodically = setTimeout(function(){
			try{
				ws_server.check_for_updates(null);
			}
			catch(e){
				console.log('\n\n! Error in sch next check\n\n', e);
				sch_next_check();
				ws_server.check_for_updates(null);
			}
		}, 12000);														//check perodically
	}

	/* 12/14/2016 - removed
	//see if there are new users
	ws_server.check_for_new_users = function(ws_client){
		marbles_lib.get_owner_list(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(err, resp){
			if(err != null){
				console.log('\n\n[checking] could not get owners:', err);
				sch_next_check();										//check again
			}
			else{
				console.log('\n\n[checking] number of owners:', resp.payload[0].length);

				var latestList = organize_usernames(resp.payload[0]);
				var knownAsString = JSON.stringify(known_marble_owners);//stringify for easy comparison (order should stay the same)
				var latestListAsString = JSON.stringify(latestList);

				if(knownAsString === latestListAsString){
					console.log('[checking] same owners as last time\n\n');
					if(ws_client !== null) ws_client.send(JSON.stringify({msg: 'owners', e: err, owners: latestList}));
					check_for_new_marbles(null);
				}
				else{													//detected new members, send it out
					console.log('[checking] new owners, sending to users\n\n');
					known_marble_owners = latestList;
					broadcast({msg: 'owners', e: err, owners: latestList});
					sch_next_check();									//check again
				}
			}
		});
	};
	*/

	ws_server.check_for_updates = function(ws_client){
		marbles_lib.read_everything(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(err, resp){
			if(err != null){
				console.log('\n\n[checking] could not get everything:', err);
				sch_next_check();										//check again
			}
			else{
				var data = resp.payload[0];
				console.log('\n\n[checking] number of owners:', data.owners_index.length);
				console.log('[checking] number of marbles:', data.marbles.length, '\n\n');

				data.owners_index = organize_usernames(data.owners_index);
				data.marbles = organize_marbles(data.marbles);
				var knownAsString = JSON.stringify(known_everything);	//stringify for easy comparison (order should stay the same)
				var latestListAsString = JSON.stringify(data);

				if(knownAsString === latestListAsString){
					console.log('[checking] same everything as last time');
					if(ws_client !== null) {							//if this is answering a clients req, send it to them
						console.log('[checking] sending to 1 client');
						ws_client.send(JSON.stringify({msg: 'everything', e: err, everything: data}));
					}
				}
				else{													//detected new things, send it out
					console.log('[checking] there are new things, sending to all clients');
					known_everything = data;
					broadcast({msg: 'everything', e: err, everything: data});
				}
				sch_next_check();										//check again
			}
		});
	};

	//organize the marble owner list
	function organize_usernames(data){
		var ownerList = [];
		var myUsers = [];
		for(var i in data){							//lets reformat it a bit, only need 1 peer's response
			var pos = data[i].indexOf('.');
			var temp = 	{
							username: data[i].substring(0, pos),
							company: data[i].substring(pos + 1)
						};
			if(temp.company === process.env.marble_company){
				myUsers.push(temp);					//these are my companies users
			}
			else{
				ownerList.push(temp);				//everyone else
			}
		}

		ownerList = sort_usernames(ownerList);
		ownerList = myUsers.concat(ownerList);		//my users are first, bring in the others
		return ownerList;
	}

	//
	function organize_marbles(allMarbles){
		var ret = {};
		for(var i in allMarbles){
			if(!ret[allMarbles[i].owner.username]){
				ret[allMarbles[i].owner.username] =	{
														username: allMarbles[i].owner.username,
														company: allMarbles[i].owner.company,
														marbles: []
													};
			}
			ret[allMarbles[i].owner.username].marbles.push(allMarbles[i]);
		}
		return ret;
	}

	///alpha sort everyone else
	function sort_usernames(temp){
		temp.sort(function (a, b) {
			var entryA = a.company + a.username;
			var entryB = b.company + b.username;
			if(entryA < entryB) return -1;
			if(entryA > entryB) return 1;
			return 0;
		});
		return temp;
	}

	/* 12/14/2016 - removed
	//see if there are new marbles
	function check_for_new_marbles(ws_client){
		marbles_lib.get_marble_list(webUser, [hfc.getPeer(helper.getPeersUrl(0))], function(err, resp){
			if(err != null){
				console.log('\n\n[checking] could not get marbles:', err);
				sch_next_check();										//check again
			}
			else{
				var marbleIndex = resp.payload[0];
				console.log('\n\n[checking] number of marbles:', marbleIndex.length, '\n\n');
				var by_user = {};

				// ----------- Get Marbles ----------- //
				async.eachLimit(resp.payload[0], 1, function(marble_id, cb) {
					marbles_lib.get_marble(webUser, [hfc.getPeer(helper.getPeersUrl(0))], marble_id, function(err2, resp2){
						if(err != null){
							console.log('\n\n[checking] could not a marble:', err2);
						}
						else{
							if(resp2.payload && resp2.payload[0] && resp2.payload[0].owner) {
								var marble = resp2.payload[0];
								if(!by_user[marble.owner.username]) {
									by_user[marble.owner.username] = [];
								}
								by_user[marble.owner.username].push(marble);	//organize marbles by their owner
							}
							else{
								console.log('[checking] !warning - did not find marble data in resp');
							}
						}
						cb();
					});
				}, function() {
					console.log('\n\n[checking] finished getting all marbles');
					var knownAsString = JSON.stringify(known_marbles);		//stringify for easy comparison (order should stay the same)
					var latestListAsString = JSON.stringify(by_user);
					var i;

					// ----------- Marbles Are the Same ----------- //
					if(knownAsString === latestListAsString){
						console.log('[checking] same marbles as last time');
						if(ws_client !== null) {
							console.log('[checking] sending to a client\n\n');
							for(i in by_user){
								ws_client.send(JSON.stringify(build_marble_obj(i, by_user[i])));	//send each marble owner's marbles
							}
							ws_client.send(JSON.stringify({msg: 'all_marbles_sent', e: null}));
						}
					}

					// ----------- Marbles Are Different ----------- //
					else{													//detected new marbles, send owner msg, client will ask for marbles next
						console.log('[checking] new marbles, sending users marbles msg');
						console.log('[checking] broadcasting to all clients\n\n');
						known_marbles = by_user;
						for(i in by_user){
							broadcast(build_marble_obj(i, by_user[i]));								//send each marble owner's marbles
						}
						broadcast({msg: 'all_marbles_sent', e: null});
					}
					sch_next_check();										//check again
				});
			}
		});
	}
	*/

	//build a marble obj
	/*function build_marble_obj(username, marbles){
		return	{
				msg: 'users_marbles',
				e: null,
				username: username,
				company: marbles[0].owner.company,
				marbles: marbles
			};
	}*/

	return ws_server;
};

// ==================================
// Websocket Server Side Code 
// ==================================
//var async = require('async');
var path = require('path');

module.exports = function (checkPerodically, marbles_lib, logger) {
	var hfc = require('hfc');
	var helper = require(path.join(__dirname, './helper.js'))(process.env.creds_filename, console);
	var ws_server = {};
	var webUser = null;
	var broadcast = null;
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
		var options = 	{
							chaincode_id: helper.getChaincodeId(),
							peer_urls: [hfc.getPeer(helper.getPeersUrl(0))],
							ws: ws,
						};
		if(marbles_lib === null) {
			console.log('error! marbles lib is null...');				//can't run in this state
			return;
		}
			
		// create a new marble
		if(data.type == 'create'){
			console.log('[ws] create marbles req');
			options.args = 	{
								marble_id: data.name,
								color: data.color,
								size: data.size,
								marble_owner: data.username,
								owners_company: data.company,
								auth_company: process.env.marble_company
							};

			marbles_lib.create_a_marble(webUser, options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}

		//transfer a marble
		else if(data.type == 'transfer_marble'){
			console.log('[ws] transfering req');
			options.args = 	{
								marble_id: data.name,
								marble_owner: data.username,
								owners_company: data.company,
								auth_company: process.env.marble_company
							};

			marbles_lib.set_marble_owner(webUser, options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}

		//delete marble
		else if(data.type == 'delete_marble'){
			console.log('[ws] delete marble req');
			options.args = 	{
								marble_id: data.name,
								auth_company: process.env.marble_company
							};

			marbles_lib.delete_marble(webUser, options, function(err, resp){
				if(err != null) send_err(err, data);
			});
		}

		//get all owners, marbles, & companies
		else if(data.type == 'read_everything'){
			console.log('[ws] read everything req');
			ws_server.check_for_updates(ws);
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

	ws_server.check_for_updates = function(ws_client){
		var options = 	{
							chaincode_id: helper.getChaincodeId(),
							peer_urls: [hfc.getPeer(helper.getPeersUrl(0))],
						};

		marbles_lib.read_everything(webUser, options, function(err, resp){
			if(err != null){
				console.log('\n\n[checking] could not get everything:', err);
				sch_next_check();										//check again
			}
			else{
				var data = resp.payload[0];
				if(data && data.owners_index && data.marbles){
					console.log('\n\n[checking] number of owners:', data.owners_index.length);
					console.log('[checking] number of marbles:', data.marbles.length, '\n\n');
				}

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

	return ws_server;
};

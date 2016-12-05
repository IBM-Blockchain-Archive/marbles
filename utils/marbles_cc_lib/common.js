//var async = require('async');
//var path = require('path');
//var url = require('url');

module.exports = function (logger) {
	var common = {};

	//format query response
	common.format_query_resp = function (peer_responses, grab_inner_field){
		var ret = 	{
						peers_agree: true,
						payload: []
					};
		var last = null;
		var error = null;

		// -- iter on each peer's response -- //
		for(var i in peer_responses) {					//pray to the gods that i===peer_id and they never move
			var as_string = peer_responses[i].toString('utf8');
			var as_obj = {marbles: null};
			console.log('Peer' + i, 'payload says:', as_string);

			try{
				// -- don't parse buffers -- //
				if(as_string !== ''){
					as_obj = JSON.parse(as_string);
				}

				if(grab_inner_field) ret.payload.push(as_obj[grab_inner_field]);	//only return inner field
				else ret.payload.push(as_obj);
				
				// -- compare peer responses -- //
				if(last != null){							//check if all peers agree
					if(last !== as_string) {
						console.log('warning - some peers do not agree on query', last, as_string);
						ret.peers_agree = false;
					}
					last = as_string;
				}
			}

			// -- JSON Error -- //
			catch(e){
				error = {error: 'payload not valid json', payload: peer_responses};
			}
		}

		return {ret: ret, error: error};
	};

	return common;
};


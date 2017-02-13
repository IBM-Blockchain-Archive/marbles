//-------------------------------------------------------------------
// Marbles Chaincode - Common/Helper
//-------------------------------------------------------------------

module.exports = function (logger) {
	var common = {};

	//-----------------------------------------------------------------
	// Format Query Responses
	//------------------------------------------------------------------
	common.format_query_resp = function (peer_responses, grab_inner_field){
		var ret = 	{
						peers_agree: true,
						payload: []
					};
		var last = null;
		var error = null;

		// -- iter on each peer's response -- //
		for(var i in peer_responses) {
			var as_string = peer_responses[i].toString('utf8');
			var as_obj = {marbles: null};
			console.log('\n[marble_lib] Peer' + i, 'payload says:', as_string);

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
						console.log('\n[marble_lib] warning - some peers do not agree on query', last, as_string);
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


	//-----------------------------------------------------------------
	// Format Chaincode String Error Message
	//------------------------------------------------------------------
	common.format_error_msg = function (error_message){
		var temp = 'could not format error';
		try{
			temp = error_message.toString();
			var pos = temp.lastIndexOf(':');
			//console.log('*', pos);
			if(pos >= 0){
				temp = temp.substring(pos + 2);
			}
		}
		catch(e){
			console.log('\n[marble_lib] could not format error');
		}
		return temp;
	};


	//-----------------------------------------------------------------
	// Check Proposal Response
	//-----------------------------------------------------------------
	common.check_proposal_res = function(results, endorsed_hook){
		var proposalResponses = results[0];
		var proposal = results[1];
		var header = results[2];

		//check response
		if (!proposalResponses || !proposalResponses[0] || !proposalResponses[0].response || proposalResponses[0].response.status !== 200) {
			console.log('[fcw] Failed to obtain endorsement for transaction.', proposalResponses);
			throw proposalResponses;
		}
		else {
			console.log('\n');
			console.log('[fcw] Successfully obtained transaction endorsement.\n');

			//call optional endorsement hook
			if (endorsed_hook) endorsed_hook(null, proposalResponses[0].response);

			//move on to ordering
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal,
				header: header
			};
			return request;
		}
	};

	return common;
};

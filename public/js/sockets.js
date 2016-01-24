/* global $ */

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
});


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){

	connect();
	var ws = {};
	function connect(){
		var wsUri = "ws://localhost:3001";
		//var wsUri = "wss://broker.obchain.com/network/" + name;
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log("WS CONNECTED");
		//appendLog('all', 'WEBSOCKET CONNECTED');
	}

	function onClose(evt){
		console.log("WS DISCONNECTED", evt);
		//appendLog('all', 'WEBSOCKET DISCONNECTED');
		//connect();
		ws.close();
	}

	function onMessage(msg){
		try{
			var data = JSON.parse(msg.data);
			console.log('got', data);
			//ws.close();
		}
		catch(e){
			console.log('ERROR', e);
			//console.log('this was not json', msg.data);
			//ws.close();
		}
	}

	function onError(evt){
		console.log('ERROR ', evt.data);
	}

	function sendMessage(message){
		console.log("SENT: " + message);
		ws.send(message);
	}
}
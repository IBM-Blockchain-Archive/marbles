/* global randStr */
/* global bag */
/* global $ */
var ws = {};

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	
	var d = new Date();
	var e = formatDate(d);
	$("#blockdate").html(e);
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#submit").click(function(){
		console.log('creating marble');
		var obj = 	{
						type: "create",
						name: $("input[name='name']").val(),
						color: $("select[name='color']").val(),
						size: $("select[name='size']").val(),
						user: $("select[name='user']").val()
					};
		ws.send(JSON.stringify(obj));
		showAdminPanel();
		return false;
	});
	
	$(document).on("click", ".ball", function(){
		if($(this).hasClass("selectedball")){
			$(this).removeClass("selectedball");
		}
		else{
			$(".selectedball").removeClass("selectedball");
			$(this).addClass("selectedball");
		}
	});
	
	$("#adminLink").click(function(){
		showAdminPanel();
	});
	function showAdminPanel(reset){
		$("#contentPanel").removeClass("createview").addClass("adminview");
		$("#adminView").fadeIn();
		$("#createView").hide();
		if(reset === true){
			$("#bobswrap").html('');
			$("#leroyswrap").html('');
		}
		console.log('getting new balls');
		ws.send(JSON.stringify({type: "get"}));
	}
	$("#createLink").click(function(){
		$("#contentPanel").removeClass("adminview").addClass("createview");
		$("#createView").fadeIn();
		$("#adminView").hide();
		$("input[name='name']").val('r' + randStr(6));
	});
	
	$("#transferright").click(function(){
		var id = $(".selectedball").attr("id");
		if(id){
			console.log('transfering', id);
			var obj = 	{
							type: "transfer",
							name: id,
							user: 'leroy'
						};
			ws.send(JSON.stringify(obj));
			//$(".selectedball").removeClass("selectedball");
			showAdminPanel(true);
		}
	});
	
	$("#transferleft").click(function(){
		var id = $(".selectedball").attr("id");
		if(id){
			console.log('transfering', id);
			var obj = 	{
							type: "transfer",
							name: id,
							user: 'bob'
						};
			ws.send(JSON.stringify(obj));
			//$(".selectedball").removeClass("selectedball");
			showAdminPanel(true);
		}
	});
	
	$("#removemarble").click(function(){
		var id = $(".selectedball").attr("id");
		if(id){
			console.log('removing', id);
			var obj = 	{
							type: "remove",
							name: id
						};
			ws.send(JSON.stringify(obj));
			//$(".selectedball").removeClass("selectedball");
			showAdminPanel(true);
		}
	});
	
	
	// =================================================================================
	// Helpers
	// =================================================================================
	function formatDate(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
	}

});


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){

	connect();
	function connect(){
		//var wsUri = "ws://localhost:3000";
		//var wsUri = "ws://marbles.stage1.mybluemix.net";
		var wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		
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
			console.log('rec', data.marble);
			build_ball(data.marble);
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


// =================================================================================
//	UI Building
// =================================================================================
function build_ball(data){
	var html = '';
	var style = '';
	
	if(!$("#" + data.name).length){								//only populate if it doesn't exists
		//if($("#" + data.name).attr("user").toLowerCase() == data.user.toLowerCase()){		//ball has moved! redraw
		//	$("#" + data.name).remove();
		//}
	//}
	
	if(data.color) style = "color:" + data.color.toLowerCase();
	
	html += '<span id="' + data.name +'" class=" fa fa-circle fa-5x ball" title="' + data.name +'" style="' + style +'" user="' + data.user + '"></span>';
	if((data.user && data.user.toLowerCase() == 'bob') || (data.owner && data.owner.toLowerCase() == 'bob')){
		$("#bobswrap").append(html);
	}
	else{
		$("#leroyswrap").append(html);
	}
	}
	return html;
}
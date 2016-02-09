/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	
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
						user: $("select[name='user']").val(),
						v: 1
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
	
	$("#homeLink").click(function(){
		showAdminPanel();
	});

	$("#createLink").click(function(){
		$("#createPanel").fadeIn(300);
		$("#homePanel").hide();
		$("input[name='name']").val('r' + randStr(6));
	});
	
	$("#transferright").click(function(){
		transfer('leroy');
	});
	
	$("#transferleft").click(function(){
		transfer('bob');
	});
	
	$("#removemarble").click(function(){
		var id = $(".selectedball").attr("id");
		if(id){
			console.log('removing', id);
			var obj = 	{
							type: "remove",
							name: id,
							v: 1
						};
			ws.send(JSON.stringify(obj));
			//$(".selectedball").removeClass("selectedball");
			showAdminPanel(true);
		}
	});
	
	
	// =================================================================================
	// Helper Fun
	// ================================================================================
	//show admin panel page
	function showAdminPanel(reset){
		$("#homePanel").fadeIn(300);
		$("#createPanel").hide();
		if(reset === true){
			$("#bobswrap").html('');
			$("#leroyswrap").html('');
		}
		console.log('getting new balls');
		setTimeout(function(){
			ws.send(JSON.stringify({type: "get", v: 1}));						//need to wait a bit - dsh to do, tap into new block event
			ws.send(JSON.stringify({type: "chainstats", v: 1}));
		}, 200);
	}
	
	//transfer selected ball to user
	function transfer(user){
		var marbleName = $(".selectedball").attr("id");
		if(marbleName){
			console.log('transfering', marbleName);
			var obj = 	{
							type: "transfer",
							name: marbleName,
							user: user,
							v: 1
						};
			ws.send(JSON.stringify(obj));
			showAdminPanel(true);
		}
	}
});


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	connect();
	function connect(){
		var wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log("WS CONNECTED");
		ws.send(JSON.stringify({type: "get", v:1}));
		ws.send(JSON.stringify({type: "chainstats", v:1}));
	}

	function onClose(evt){
		console.log("WS DISCONNECTED", evt);
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var data = JSON.parse(msg.data);
			console.log('rec', data);
			if(data.marble){
				build_ball(data.marble);
			}
			else if(data.msg === 'chainstats'){
				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%p');
				$("#blockdate").html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = { 
								id: nDig((data.chainstats.height - 1), 3), 
								blockstats: data.blockstats
							};
				new_block(temp);									//send to blockchain.js
			}
		}
		catch(e){
			console.log('ERROR', e);
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
	var size = 'fa-5x';
	
	if(!$("#" + data.name).length){								//only populate if it doesn't exists
		if(data.size == 16) size = 'fa-3x';
		if(data.color) style = "color:" + data.color.toLowerCase();
		
		html += '<span id="' + data.name +'" class=" fa fa-circle ' + size + ' ball" title="' + data.name +'" style="' + style +'" user="' + data.user + '"></span>';
		if((data.user && data.user.toLowerCase() == 'bob') || (data.owner && data.owner.toLowerCase() == 'bob')){
			$("#bobswrap").append(html);
		}
		else{
			$("#leroyswrap").append(html);
		}
	}
	return html;
}
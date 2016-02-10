/* global new_block */
/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var user = {username: 'bob'};

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
						color: $(".colorSelected").attr('color'),
						size: $("select[name='size']").val(),
						user: $("select[name='user']").val(),
						v: 2
					};
		ws.send(JSON.stringify(obj));
		showAdminPanel();
		return false;
	});
	

	
	$("#homeLink").click(function(){
		showAdminPanel();
	});

	$("#createLink").click(function(){
		$("#createPanel").fadeIn(300);
		$("#homePanel").hide();
		$("#tradeView").hide();
		$("input[name='name']").val('r' + randStr(6));
	});
	
	$("#tradeLink").click(function(){
		$("#tradeView").fadeIn(300);
		$("#homePanel").hide();
		$("#createPanel").hide();
		build_my_color_options(user.username);
		ws.send(JSON.stringify({type: "get_open_trades", v: 2}));
	});
	

	
	//marble color picker
	$(document).on("click", ".colorInput", function(){
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on("click", ".colorOption", function(){
		var colors = ["whitebg", "blackbg", "redbg", "greenbg", "bluebg", "purplebg", "pinkbg", "orangebg", "yellowbg"];
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color +'"></span>';
		
		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for(var i in colors) $(".createball").removeClass(colors[i]);			//remove prev color
		$(".createball").css("border", "0").addClass(color + 'bg');				//set new color
	});
	
	//login events
	$("#whoAmI").click(function(){													//drop down for login
		if($("#userSelect").is(":visible")){
			$("#userSelect").fadeOut();
		}
		else{
			$("#userSelect").fadeIn();
		}
	});
	
	$(".userLine").click(function(){												//log in as someone else
		var name = $(this).attr("name");
		user.username = name.toLowerCase().charAt(0).toUpperCase() + name.slice(1);	//title case username
		$("#userField").html("Hi " + user.username);
		$("#userSelect").fadeOut(300);
		build_my_color_options(user.username);
		build_trades(bag.trades);
	});
	
	//trade events
	$("#setupTradeButton").click(function(){
		$(".inactiveButton").removeClass("inactiveButton");
		$("#viewTradeButton").addClass("inactiveButton");
		$("#openTrades").fadeOut();
		$("#createTrade").fadeIn();
	});
	
	$("#viewTradeButton").click(function(){
		$(".inactiveButton").removeClass("inactiveButton");
		$("#setupTradeButton").addClass("inactiveButton");
		$("#openTrades").fadeIn();
		$("#createTrade").fadeOut();
	});
	
	$("#addMarbleButton").click(function(){
		var temp = $(".willingWrap:first").html();
		$(".willingWrap:first").parent().append('<div class="willingWrap">' + temp + '</div>');
	});
	
	$("#tradeSubmit").click(function(){
		var msg = 	{
						type: 'open_trade',
						v: 2,
						user: user.username,
						want: {
							color: $("select[name='want_color']").val(),
							size: $("select[name='want_size']").val()
						},
						willing: []
					};
					
		$(".willingWrap").each(function(){
			var q = $(this).find("select[name='will_quantity']").val();
			var color = $(this).find("select[name='will_color']").val();
			var size = $(this).find("select[name='will_size']").val();
			console.log('!', q, color, size);
			var temp = 	{
							color: color,
							size: size
						};
			msg.willing.push(temp);
		});
		
		console.log('sending', msg);
		ws.send(JSON.stringify(msg));
		$("#notificationPanel").animate({width:'toggle'});
	});
	
	$(document).on("click", ".confirmTrade", function(){
		console.log('trading...');
		var i = $(this).attr('trade_pos');
		var x = $(this).attr('willing_pos');
		var msg = 	{
						type: 'perform_trade',
						v: 2,
						id: bag.trades[i].timestamp.toString(),
						opener:{											//marble he is giving up
							user: bag.trades[i].user,
							color: bag.trades[i].willing[x].color,
							size: bag.trades[i].willing[x].size.toString(),
						},
						closer:{											//marble hs ig giving up
							user: user.username,							//guy who is logged in
							name: $(this).attr('name'),
							color: '',										//dsh to do, add these and remove above
							size: ''
						}
					};
		ws.send(JSON.stringify(msg));
	});
	
	$("select[name='will_color']").change(function(){
		build_my_size_options(user.username, $("select[name='will_color']").val());
	});
	
	// =================================================================================
	// Helper Fun
	// ================================================================================
	//show admin panel page
	function showAdminPanel(){
		$("#homePanel").fadeIn(300);
		$("#createPanel").hide();
		$("#tradeView").hide();
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
							v: 2
						};
			ws.send(JSON.stringify(obj));
			showAdminPanel();
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
		ws.send(JSON.stringify({type: "get", v:2}));
		ws.send(JSON.stringify({type: "chainstats", v:2}));
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
				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$("#blockdate").html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = { 
								id: nDig((data.chainstats.height - 1), 3), 
								blockstats: data.blockstats
							};
				new_block(temp);									//send to blockchain.js
			}
			else if(data.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
				$("#leroyswrap").html('');
				$("#bobswrap").html('');
			}
			else if(data.msg === 'open_trades'){
				build_trades(data.open_trades);
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
	
	if(!bag.marbles) bag.marbles = {};
	bag.marbles[data.name] = data;								//store the marble for posterity
	
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
	console.log('marbles', bag.marbles);
	
	return html;
}


function build_trades(trades){
	var html = '';

	
	if(!bag.trades) bag.trades = trades;						//store the trades for posterity
	
	for(var i in trades){
		for(var x in trades[i].willing){
			//console.log(trades[i]);
			var style = ' ';
			var buttonStatus = '';
			
			if(user.username.toLowerCase() != trades[i].user.toLowerCase()){				//don't show trades with myself
				var name = find_valid_marble(user.username, trades[i].want.color, trades[i].want.size);
				if(name == null) {								//don't allow trade if I don't have the correct marble
					style = 'invalid';
					buttonStatus = 'disabled="disabled"';
				}
				html += '<tr class="' + style +'">';
				html +=		'<td>' + formatDate(Number(trades[i].timestamp) / 1000 / 1000, '%M/%d %I:%m%P') + '</td>';
				//html +=		'<td>' + trades[i].user + '</td>';
				html +=		'<td>' + trades[i].want.color + '</td>';
				html +=		'<td>' + trades[i].want.size + '</td>';
				html +=		'<td>1</td>';
				html +=		'<td>' + trades[i].willing[x].color + ' - ' + trades[i].willing[x].size + '</td>';
				html +=		'<td>';
				html +=			'<button type="button" class="confirmTrade altButton" ' + buttonStatus +' name="' + name + '" trade_pos="' + i + '" willing_pos="' + x + '">';
				html +=				'<span class="fa fa-exchange"> &nbsp;&nbsp;TRADE</span>';
				html +=			'</button>';
				html += 	'</td>';
				html += '</tr>';
			}
		}
	}
	$("#openTradesBody").html(html);
	console.log('trades', bag.trades);
	
	return html;
}

function build_my_color_options(username){
	var html = '';
	var colors = {};
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
			colors[bag.marbles[i].color] = true;
		}
	}
	
	var first = true;
	for(var i in colors){
		if(first) build_my_size_options(username, i);
		first = false;
		html += '<option value="' + i + '">' + i + '</option>';					//build it
	}
	$("select[name='will_color']").html(html);

}

function build_my_size_options(username, color){
	var html = '';
	var sizes = {};
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase()){
				sizes[bag.marbles[i].size] = true;
			}
		}
	}
	
	for(var i in sizes){
		html += '<option value="' + i + '">' + i + '</option>';					//build it
	}
	$("select[name='will_size']").html(html);
}




function find_valid_marble(user, color, size){				//return true if user owns marble of this color and size
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == user.toLowerCase()){
			console.log('!', bag.marbles[i].color, color.toLowerCase(), bag.marbles[i].size, size);
			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase() && bag.marbles[i].size == size){
				return bag.marbles[i].name;
			}
		}
	}
	return null;
}
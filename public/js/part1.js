/* global new_block, randStr, bag, $, clear_blocks, document, WebSocket, escapeHtml, window */
/* global toTitleCase*/
var ws = {};
var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	$('input[name="name"]').val('r' + randStr(6));
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#submit').click(function(){
		console.log('creating marble');
		var obj = 	{
						type: 'create',
						name: $('input[name="name"]').val().replace(' ', ''),
						color: $('.colorSelected').attr('color'),
						size: $('select[name="size"]').val(),
						username: $('select[name="user"]').val(),
						company: bag.marble_company,
						v: 1
					};
		if(obj.username && obj.name && obj.color){
			console.log('creating marble, sending', obj);
			ws.send(JSON.stringify(obj));
			showHomePanel();
			$('.colorValue').html('Color');											//reset
			for(var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//reset
			$('.createball').css('border', '2px dashed #fff');						//reset
		}
		return false;
	});
	
	$('#homeLink').click(function(){
		showHomePanel();
	});

	$('#createLink').click(function(){
		$('input[name="name"]').val('r' + randStr(6));
	});

	$(document).on('click', '.marblesCloseSection', function(){
		$(this).parent().fadeOut();
	});

	$(document).on('click', '.showUserPanel', function(){
		var full_owner = $(this).parent().parent().attr('full_owner');
		console.log('clicked to show', full_owner);
		$('.marblesWrap[full_owner="' + full_owner + '"]').fadeIn();
	});
	
	//marble color picker
	$(document).on('click', '.colorInput', function(){
		$('.colorOptionsWrap').hide();											//hide any others
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on('click', '.colorOption', function(){
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color + '"></span>';
		
		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for(var i in bgcolors) $('.createball').removeClass(bgcolors[i]);			//remove prev color
		$('.createball').css('border', '0').addClass(color + 'bg');				//set new color
	});
	
	
	//drag and drop marble
	$('#user2wrap, #user1wrap, #trashbin').sortable({connectWith: '.sortable'}).disableSelection();
	/*$('#user2wrap').droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER2){
				$(ui.draggable).addClass('invalid');
				transfer_marble($(ui.draggable).attr('id'), bag.setup.USER2);
			}
		}
	});
	$('#user1wrap').droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER1){
				$(ui.draggable).addClass('invalid');
				transfer_marble($(ui.draggable).attr('id'), bag.setup.USER1);
			}
		}
	});*/
	$('#trashbin').droppable({drop:
		function( event, ui ) {
			var id = $(ui.draggable).attr('id');
			if(id){
				console.log('removing marble', id);
				var obj = 	{
								type: 'remove',
								name: id,
								v: 1
							};
				ws.send(JSON.stringify(obj));
				$(ui.draggable).fadeOut();
				setTimeout(function(){
					$(ui.draggable).remove();
				}, 300);
				showHomePanel();
			}
		}
	});
});
// =================================================================================
// Helper Fun
// ================================================================================
//show admin panel page
function showHomePanel(){
	$('#homePanel').fadeIn(300);
	$('#createPanel').hide();
	
	window.history.pushState({},'', '/home');								//put it in url so we can f5
	
	console.log('getting new marbles!!!');
	setTimeout(function(){
		$('.innerMarbleWrap').html('');										//reset the panels
		ws.send(JSON.stringify({type: 'get_marbles', v: 1}));				//need to wait a bit
		//ws.send(JSON.stringify({type: 'chainstats', v: 1}));
		//ws.send(JSON.stringify({type: 'get_owners', v: 1}));
	}, 1200);
}

//transfer_marble selected ball to user
function transfer_marble(marbleName, to_username, to_company){
	if(marbleName){
		console.log('transfering marble', marbleName, 'to', to_username, to_company);
		var obj = 	{
						type: 'transfer_marble',
						name: marbleName,
						username: to_username,
						company: to_company,
						v: 1
					};
		ws.send(JSON.stringify(obj));
		showHomePanel();
	}
}


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	var connected = false;
	connect();
	
	function connect(){
		var wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
		console.log('Connectiong to websocket', wsUri);
		
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log('WS CONNECTED');
		connected = true;
		clear_blocks();
		$('#errorNotificationPanel').fadeOut();
		//ws.send(JSON.stringify({type: 'get_marbles', v:1}));
		//ws.send(JSON.stringify({type: 'chainstats', v:1}));
		ws.send(JSON.stringify({type: 'get_owners', v: 1}));
	}

	function onClose(evt){
		console.log('WS DISCONNECTED', evt);
		connected = false;
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var msgObj = JSON.parse(msg.data);
			if(msgObj.marble){
				console.log('rec', msgObj.msg, msgObj);
				build_ball(msgObj.marble);
			}
			else if(msgObj.msg === 'chainstats'){
				console.log('rec', msgObj.msg, ': ledger blockheight', msgObj.chainstats.height, 'block', msgObj.blockstats.height);
				//var e = formatDate(msgObj.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				//$('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp =  {
								id: msgObj.blockstats.height, 
								blockstats: msgObj.blockstats
							};
				new_block(temp);								//send to blockchain.js
			}
			else if(msgObj.msg === 'owners'){
				console.log('rec', msgObj.msg, msgObj);
				build_user_panels(msgObj.owners);
				build_user_table_row(msgObj.owners);
				show_company_users();
				ws.send(JSON.stringify({type: 'get_marbles', v:1}));
			}
			else console.log('rec', msgObj.msg, msgObj);
		}
		catch(e){
			console.log('ERROR', e);
		}
	}

	function onError(evt){
		console.log('ERROR ', evt);
		if(!connected && bag.e == null){											//don't overwrite an error message
			$('#errorName').html('Warning');
			$('#errorNoticeText').html('Waiting on the node server to open up so we can talk to the blockchain. ');
			$('#errorNoticeText').append('This app is likely still starting up. ');
			$('#errorNoticeText').append('Check the server logs if this message does not go away in 1 minute. ');
			$('#errorNotificationPanel').fadeIn();
		}
	}
}


// =================================================================================
//	UI Building
// =================================================================================
//build a marble
function build_ball(marble){
	var html = '';
	var colorClass = '';
	var size = 'fa-5x';
	
	marble.name = escapeHtml(marble.name);
	marble.color = escapeHtml(marble.color);
	marble.owner.username = escapeHtml(marble.owner.username);
	marble.owner.company = escapeHtml(marble.owner.company);
	
	console.log('got a marble: ', marble.color);
	if(!$('#' + marble.name).length){								//only populate if it doesn't exists
		if(marble.size == 16) size = 'fa-3x';
		if(marble.color) colorClass = marble.color.toLowerCase();
		
		html += '<span id="' + marble.name + '" class="fa fa-circle ' + size + ' ball ' + colorClass + ' title="' + marble.name + '"';
		html += ' username="' + marble.owner.username + '" company="' + marble.owner.company + '"></span>';
		
		$('.marblesWrap').each(function(){
			var panel = {
							username: $(this).attr('username'),
							company : $(this).attr('company')
						};

			if(marble.owner.username.toLowerCase() === panel.username.toLowerCase()){		//match the username
				if(marble.owner.company.toLowerCase() === panel.company.toLowerCase()){		//match the company
					$(this).find('.innerMarbleWrap').append(html);
					$(this).find('.tempMsg').remove();
				}
			}
		});
	}
	return html;
}

//build all user panels
function build_user_panels(data){
	var html = '';
	var full_owner = '';
		
	for(var i in data){
		var colorClass = '';
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);

		full_owner = build_full_owner(data[i].username, data[i].company);
		console.log('building user', full_owner);
		if(data[i].company.toLowerCase() === bag.marble_company.toLowerCase()) colorClass = 'adminControl';

		html += '<div id="user' + i + 'wrap" username="' + data[i].username + '" company="' + data[i].company + '" full_owner="' + full_owner +'" class="marblesWrap ' + colorClass +'">';
		html +=		'<span class="fa fa-close marblesCloseSection"></span>';
		html +=		'<div class="legend">';
		html +=			 toTitleCase(data[i].username);
		html +=			'<span class="hint" style="float:right;">' + data[i].company + '</span>';
		html +=		'</div>';
		html +=		'<div class="innerMarbleWrap">&nbsp;</div>';
		html +=		'<div class="tempMsg hint" style="text-align: center;">No marbles</div>';
		html +=	'</div>';
	}
	$('#allUserPanelsWrap').html(html);

	//drag and drop marble
	$('.innerMarbleWrap').sortable({connectWith: '.innerMarbleWrap', items: 'span'}).disableSelection();
	$('.innerMarbleWrap').droppable({drop:
		function( event, ui ) {
			var dragged_user = $(ui.draggable).attr('username').toLowerCase();
			var dropped_user = $(event.target).parent().attr('username').toLowerCase();
			var dropped_company = $(event.target).parent().attr('company').toLowerCase();
			console.log('dropped a marble', dragged_user, dropped_user, dropped_company);
			if(dragged_user != dropped_user){										//only transfer marbles that changed owners
				$(ui.draggable).addClass('invalid');
				transfer_marble($(ui.draggable).attr('id'), dropped_user, dropped_company);
				return true;
			}
		}
	});
}

//build all user table rows
function build_user_table_row(data){
	var html = '';
		
	for(var i in data){
		var full_owner = build_full_owner(data[i].username, data[i].company);
		console.log('building user', full_owner);

		var colorClass = '';
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);
		if(data[i].company.toLowerCase() === bag.marble_company.toLowerCase()) colorClass = 'adminControl';

		html += '<tr full_owner="' + full_owner + '" class="userRow">';
		html +=		'<td class="userPin"><span class="fa fa-thumb-tack showUserPanel"></span></td>';
		html +=		'<td class="userMarbles">0</td>';
		html +=		'<td class="userName">' + toTitleCase(data[i].username) + '</td>';
		html +=		'<td class="userCompany">' + data[i].company + '</td>';
		html +=		'<td class="userRights"><span class="fa fa-check"></span></td>';
		html +=	'</div>';
	}
	$('#userTable tbody').html(html);
}

//show users for this company
function show_company_users(){
	$('.marblesWrap').each(function(){
		var company = $(this).attr('company');
		if(bag.marble_company.toLowerCase() === company.toLowerCase()){
			$(this).fadeIn(500);									//show the users for my company
		}
	});
}

//build the correct "full owner" string - concate username and company
function build_full_owner(username, company){
	return username.toLowerCase() + '.' + company.toLowerCase();
}
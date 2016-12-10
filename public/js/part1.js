/* global new_block, randStr, bag, $, clear_blocks, document, WebSocket, escapeHtml */
/* global toTitleCase, formatDate, show_start_up_step*/
var ws = {};
var bgcolors = ['whitebg', 'blackbg', 'redbg', 'greenbg', 'bluebg', 'purplebg', 'pinkbg', 'orangebg', 'yellowbg'];
var autoCloseNoticePanel = null;
var known_companies = {};
var start_up = true;

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	$('input[name="name"]').val('r' + randStr(6));
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#createMarbleButton').click(function(){
		console.log('creating marble');
		var obj = 	{
						type: 'create',
						name: $('input[name="name"]').val().replace(' ', ''),
						color: $('.colorSelected').attr('color'),
						size: $('select[name="size"]').val(),
						username: $('select[name="user"]').val(),
						company: $('input[name="company"]').val(),
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

	//open user panel
	$(document).on('click', '.userRow', function(){
		var full_owner = $(this).attr('full_owner');
		if($('.marblesWrap[full_owner="' + full_owner + '"]').is(':visible')){
			console.log('clicked to hide', full_owner);
			$(this).removeClass('selectedRow');
			$('.marblesWrap[full_owner="' + full_owner + '"]').fadeOut();
		}
		else{
			console.log('clicked to show', full_owner);
			$(this).addClass('selectedRow');
			$('.marblesWrap[full_owner="' + full_owner + '"]').css('display', 'inline-block');
		}
	});

	//close user panel
	$(document).on('click', '.marblesFix', function(){
		if($(this).parent().parent().hasClass('marblesFixed')){
			$(this).parent().parent().removeClass('marblesFixed');
		}
		else{
			$(this).parent().parent().addClass('marblesFixed');
		}
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

		for(var i in bgcolors) $('.createball').removeClass(bgcolors[i]);		//remove prev color
		$('.createball').css('border', '0').addClass(color + 'bg');				//set new color
	});
	
	
	//drag and drop marble
	$('#user2wrap, #user1wrap, #trashbin').sortable({connectWith: '.sortable'}).disableSelection();
	$('#trashbin').droppable({drop:
		function( event, ui ) {
			var id = $(ui.draggable).attr('id');
			if(id){
				console.log('removing marble', id);
				var obj = 	{
								type: 'delete_marble',
								name: id,
								v: 1
							};
				ws.send(JSON.stringify(obj));
				$(ui.draggable).fadeOut();
				setTimeout(function(){
					$(ui.draggable).remove();
				}, 1500);
				showHomePanel();
			}
		}
	});

	//username/company search
	$('#searchUsers').keyup(function(){
		var count = 0;
		var input = $(this).val().toLowerCase();
		for(var i in known_companies){
			known_companies[i].visible = 0;
		}
		if(input === '') {
			$('.marblesWrap').show();
			count = $('#totalUsers').html();
			$('.companyPanel').fadeIn();
		}
		else{
			var parts = input.split(',');
			console.log('searching on', parts);

			$('.marblesWrap').each(function(){
				var full_owner = $(this).attr('full_owner');
				var company = $(this).attr('company');
				if(full_owner){
					full_owner = full_owner.toLowerCase();
					var show = false;

					for(var x in parts){
						if(parts[x].trim() === '') continue;
						if(full_owner.indexOf(parts[x].trim()) >= 0 || $(this).hasClass('marblesFixed')) {
							count++;
							show = true;
							known_companies[company].visible++;
							break;
						}
					}

					if(show) $(this).show();
					else $(this).hide();
				}
			});
			for(i in known_companies){
				if(known_companies[i].visible === 0) {
					console.log('hiding company', i);
					$('.companyPanel[company="' + i + '"]').fadeOut();
				}
				else{
					$('.companyPanel[company="' + i + '"]').fadeIn();
				}
			}
		}
		//user count
		$('#foundUsers').html(count);
	});

	//login events
	$('#whoAmI').click(function(){													//drop down for login
		if($('#userSelect').is(':visible')){
			$('#userSelect').fadeOut();
			$('#carrot').removeClass('fa-angle-up').addClass('fa-angle-down');
		}
		else{
			$('#userSelect').fadeIn();
			$('#carrot').removeClass('fa-angle-down').addClass('fa-angle-up');
		}
	});

	//open create marble panel
	$(document).on('click', '.addMarble', function(){
		$('#tint').fadeIn();
		$('#createPanel').fadeIn();
		var company = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('company');
		var username = $(this).parents('.innerMarbleWrap').parents('.marblesWrap').attr('username');
		$('select[name="user"]').html('<option value="' + username +'">' + toTitleCase(username) + '</option>');
		$('input[name="company"]').val(company);
	});

	$('#tint').click(function(){
		$(this).fadeOut();
		$('#createPanel').fadeOut();
	});


	//notification drawer
	$('#notificationHandle').click(function(){
		if($('#noticeScrollWrap').is(':visible')){
			closeNoticePanel();
		}
		else{
			openNoticePanel();
		}
	});

	$(document).on('click', '.closeNotification', function(){
		$(this).parents('.notificationWrap').fadeOut();
	});
});
// =================================================================================
// Helper Fun
// ================================================================================
//show admin panel page
function showHomePanel(){
	//$('#homePanel').fadeIn(300);
	$('#createPanel').fadeOut();
	$('#tint').fadeOut();
	
	//window.history.pushState({},'', '/home');									//put it in url so we can f5
	
	console.log('getting new marbles!!!');
	setTimeout(function(){
		$('.innerMarbleWrap').html('<i class="fa fa-plus addMarble"></i>');//reset the panels
		$('.userRow').find('td.userMarbles').html('0');
		$('.noMarblesMsg').show();
		ws.send(JSON.stringify({type: 'get_marbles', v: 1}));					//need to wait a bit
		//ws.send(JSON.stringify({type: 'chainstats', v: 1}));
		//ws.send(JSON.stringify({type: 'get_owners', v: 1}));
	}, 1500);
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
		addshow_notification(build_notification(false, 'Connected to Marbles application'), false);

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
		//$('#errorNotificationPanel').fadeOut();
		
		//ws.send(JSON.stringify({type: 'chainstats', v:1}));
		//ws.send(JSON.stringify({type: 'get_owners', v: 1}));
	}

	function onClose(evt){
		console.log('WS DISCONNECTED', evt);
		connected = false;
		addshow_notification(build_notification(true, 'Lost connection to Marbles application'), true);
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var msgObj = JSON.parse(msg.data);
			if(msgObj.marble){
				console.log('rec', msgObj.msg, msgObj);
				build_marble(msgObj.marble);
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
				//build_user_table_row(msgObj.owners);
				//show_users_panels();
				ws.send(JSON.stringify({type: 'get_marbles', v:1}));
			}
			else if(msgObj.msg === 'tx_error'){
				console.log('rec', msgObj.msg, msgObj);
				addshow_notification(build_notification(true, escapeHtml(msgObj.e)), true);
			}
			else if(msgObj.msg === 'all_marbles_sent'){
				console.log('rec', msgObj.msg, msgObj);
				start_up = false;
			}
			else if(msgObj.msg === 'app_state'){
				console.log('rec', msgObj.msg, msgObj);
				setTimeout(function(){
					show_start_up_step(msgObj.state);
				}, 1000);
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
			/*
			$('#errorName').html('Warning');
			$('#errorNoticeText').html('Waiting on the node server to open up so we can talk to the blockchain. ');
			$('#errorNoticeText').append('This app is likely still starting up. ');
			$('#errorNoticeText').append('Check the server logs if this message does not go away in 1 minute. ');
			$('#errorNotificationPanel').fadeIn();
			*/
		}
	}
}

// =================================================================================
//	UI Building
// =================================================================================
//build a marble
function build_marble(marble){
	var html = '';
	var colorClass = '';
	var size = 'fa-5x';
	
	marble.name = escapeHtml(marble.name);
	marble.color = escapeHtml(marble.color);
	marble.owner.username = escapeHtml(marble.owner.username);
	marble.owner.company = escapeHtml(marble.owner.company);
	//var full_owner = build_full_owner(marble.owner.username, marble.owner.company);

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
					$(this).find('.innerMarbleWrap').prepend(html);
					$(this).find('.noMarblesMsg').hide();
				}
			}
		});

		//var count = $('.userRow[full_owner="' + full_owner +'"]').find('.userMarbles').html();
		//$('.userRow[full_owner="' + full_owner +'"]').find('.userMarbles').html((Number(count) + 1));
	}
	return html;
}

//record the compan, show notice if its new
function record_company(company){
	if(known_companies[company]) return;
	

	// -- Show the new company Notification -- //
	if(start_up === false){
		console.log('this is a new company!', company);
		addshow_notification(build_notification(false, 'Detected a new company "' + company + '"!'), true);
	}

	build_company_panel(company);
	addshow_notification(build_notification(false, 'Detected company "' + company + '".'), false);

	console.log('recorded company', company);
	known_companies[company] = {
									name: company, 
									count: 0, 
									visible: 0
								};
}

//build all user panels
function build_user_panels(data){
	//var html = '';
	var full_owner = '';
		
	for(var i in data){
		var html = '';
		var colorClass = '';
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);
		record_company(data[i].company);
		known_companies[data[i].company].count++;
		known_companies[data[i].company].visible++;

		full_owner = build_full_owner(data[i].username, data[i].company);
		console.log('building user', full_owner);
		//if(data[i].company.toLowerCase() !== bag.marble_company.toLowerCase()) colorClass = 'notAdminControl';

		html += '<div id="user' + i + 'wrap" username="' + data[i].username + '" company="' + data[i].company + '" full_owner="' + full_owner +'" class="marblesWrap ' + colorClass +'">';
		html +=		'<div class="legend">';
		html +=			toTitleCase(data[i].username);
		html +=			'<span class="fa fa-thumb-tack marblesCloseSectionPos marblesFix" title="Never Hide Owner"></span>';
		html +=		'</div>';
		html +=		'<div class="innerMarbleWrap"><i class="fa fa-plus addMarble"></i></div>';
		html +=		'<div class="noMarblesMsg hint">No marbles</div>';
		//html +=		'<p class="hint" style="text-align:center;">' + data[i].company + '</p>';
		html +=	'</div>';

		$('.companyPanel[company="' + data[i].company + '"]').find('.ownerWrap').append(html);
	}
	//$('#allUserPanelsWrap').html(html);

	//drag and drop marble
	$('.innerMarbleWrap').sortable({connectWith: '.innerMarbleWrap', items: 'span'}).disableSelection();
	$('.innerMarbleWrap').droppable({drop:
		function( event, ui ) {
			var dragged_user = $(ui.draggable).attr('username').toLowerCase();
			var dropped_user = $(event.target).parents('.marblesWrap').attr('username').toLowerCase();
			var dropped_company = $(event.target).parents('.marblesWrap').attr('company').toLowerCase();
			console.log('dropped a marble', dragged_user, dropped_user, dropped_company);
			if(dragged_user != dropped_user){										//only transfer marbles that changed owners
				$(ui.draggable).addClass('invalid');
				transfer_marble($(ui.draggable).attr('id'), dropped_user, dropped_company);
				return true;
			}
		}
	});

	//user count
	$('#foundUsers').html(data.length);
	$('#totalUsers').html(data.length);
}

//build company wrap
function build_company_panel(company){
	var html = '';
	html += '<div class="companyPanel" company="' + company + '">';
	html +=		'<div class="companyNameWrap">';
	html +=			'<span class="companyName">' + company.toUpperCase() + '</span>';
	html +=			'<span class="fa fa-angle-double-down floatRight"></span>';
	if(company.toLowerCase() === bag.marble_company.toLowerCase()) {
		html +=			'<span class="fa fa-angle-double-up floatRight"></span>';
	}
	html +=		'</div>';
	html +=		'<div class="ownerWrap"></div>';
	html += '</div>';
	$('#allUserPanelsWrap').append(html);
}

/*
//build all user table rows
function build_user_table_row(data){
	var html = '';
	var opened = 0;

	for(var i in data){
		var full_owner = build_full_owner(data[i].username, data[i].company);
		console.log('building user', full_owner);

		var icon = '<span class="fa fa-circle-thin"></span>';
		var rowCss = '';
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);
		if(data[i].company.toLowerCase() === bag.marble_company.toLowerCase()) {		//open all users for my company
			icon = '<span class="fa fa-check"></span>';
			rowCss = 'selectedRow';
			opened++;
		}
		else if(opened < 4){															//open up to 4 from other companies
			rowCss = 'selectedRow';
			opened++;
		}

		html += '<tr full_owner="' + full_owner + '" class="userRow ' + rowCss  +'">';
		html +=		'<td class="userMarbles">0</td>';
		html +=		'<td class="userName">' + toTitleCase(data[i].username) + '</td>';
		html +=		'<td class="userCompany">' + data[i].company + '</td>';
		html +=		'<td class="userRights">' + icon  +'</td>';
		html +=	'</div>';
	}
	$('#userTable tbody').html(html);
}
*/

/*
//show user panels that are selected in table
function show_users_panels(){
	$('.selectedRow').each(function(){
		var full_owner = $(this).attr('full_owner');
		$('.marblesWrap[full_owner="' + full_owner + '"]').css('display', 'inline-block');
	});
}
*/

//build the correct "full owner" string - concate username and company
function build_full_owner(username, company){
	return username.toLowerCase() + '.' + company.toLowerCase();
}

/*
function build_user_options(user_list){
	var html = '<option disabled="disabled" selected="selected">User</option>';
	for(var i in user_list){
		var full_owner = build_full_owner(user_list[i].username, user_list[i].company);

		if(user_list[i].company.toLowerCase() === bag.marble_company.toLowerCase()) {				//only add users for my company
			html += '<option value="' + full_owner +'">' + toTitleCase(user_list[i].username) + '</option>';
		}
	}
	$('select[name="user"]').html(html);
}
*/

//build a notification msg, `error` is boolean
function build_notification(error, msg){
	var html = '';

	var css = '';
	var iconClass = 'fa-check';
	if(error) {
		css = 'warningNotice';
		iconClass = 'fa-minus-circle';
	}

	html +=	'<div class="notificationWrap ' + css + '">';
	html +=		'<span class="fa ' + iconClass + ' notificationIcon"></span>';
	html +=		'<span class="noticeTime">' + formatDate(Date.now(), '%M/%d %I:%m:%s') + '&nbsp;&nbsp;</span>';
	html +=		'<span>' + msg + '</span>';
	html +=		'<span class="fa fa-close closeNotification"></span>';
	html +=	'</div>';
	return html;
}

//add notification to the panel, show panel now if you want with 2nd param
function addshow_notification(html, expandPanelNow){
	$('#emptyNotifications').hide();
	$('#noticeScrollWrap').prepend(html);

	if(expandPanelNow === true){
		openNoticePanel();
		clearTimeout(autoCloseNoticePanel);
		autoCloseNoticePanel = setTimeout(function(){		//auto close, xx seconds from now
			closeNoticePanel();
		}, 10000);
	}
}

//open the notice panel
function openNoticePanel(){
	$('#noticeScrollWrap').slideDown();
	$('#notificationHandle').children().removeClass('fa-angle-down').addClass('fa-angle-up');
}

//close the notice panel
function closeNoticePanel(){
	$('#noticeScrollWrap').slideUp();
	$('#notificationHandle').children().removeClass('fa-angle-up').addClass('fa-angle-down');
	clearTimeout(autoCloseNoticePanel);
}
/* global new_block, randStr, $, document, WebSocket, escapeHtml */
/* global toTitleCase, show_start_up_step, build_notification, build_user_panels, build_company_panel, populate_users_marbles*/
/* exported transfer_marble, record_company*/
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

	//fix marble owner panel (don't filter/hide it)
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
			for(i in known_companies){
				known_companies[i].visible = known_companies[i].count;
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
				$('.companyPanel[company="' + i + '"]').find('.companyCount').html(known_companies[i].count);
			}
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
				$('.companyPanel[company="' + i + '"]').find('.companyVisible').html(known_companies[i].visible);
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

	//close create marble panel
	$('#tint').click(function(){
		$('#createPanel, #startUpPanel, #tint').fadeOut();
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

	//hide a notification
	$(document).on('click', '.closeNotification', function(){
		$(this).parents('.notificationWrap').fadeOut();
	});
});


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	var connected = false;
	connect();
	
	function connect(){
		var wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
		console.log('Connecting to websocket', wsUri);

		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log('WS CONNECTED');
		addshow_notification(build_notification(false, 'Connected to Marbles application'), false);
		connected = true;
		known_companies = {};					//reset
		start_up = true;						//reset
		$('#allUserPanelsWrap').html('');		//reset
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
			
			//marbles
			if(msgObj.msg === 'users_marbles'){
				console.log('rec', msgObj.msg, msgObj);
				populate_users_marbles(msgObj);
			}

			//chainstats
			else if(msgObj.msg === 'chainstats'){
				console.log('rec', msgObj.msg, ': ledger blockheight', msgObj.chainstats.height, 'block', msgObj.blockstats.height);
				//var e = formatDate(msgObj.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				//$('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp =  {
								id: msgObj.blockstats.height, 
								blockstats: msgObj.blockstats
							};
				new_block(temp);														//send to blockchain.js
			}

			//marble owners
			else if(msgObj.msg === 'owners'){
				console.log('rec', msgObj.msg, msgObj);
				$('.innerMarbleWrap').html('<i class="fa fa-plus addMarble"></i>');		//reset the panels
				$('.noMarblesMsg').show();
				build_user_panels(msgObj.owners);
				ws.send(JSON.stringify({type: 'get_marbles', v:1}));
			}

			//transaction error
			else if(msgObj.msg === 'tx_error'){
				console.log('rec', msgObj.msg, msgObj);
				addshow_notification(build_notification(true, escapeHtml(msgObj.e)), true);
			}

			//all marbles sent
			else if(msgObj.msg === 'all_marbles_sent'){
				console.log('rec', msgObj.msg, msgObj);
				start_up = false;
			}

			//app startup state
			else if(msgObj.msg === 'app_state'){
				console.log('rec', msgObj.msg, msgObj);
				setTimeout(function(){
					show_start_up_step(msgObj);
				}, 1000);
			}

			//unknown
			else console.log('rec', msgObj.msg, msgObj);
		}
		catch(e){
			console.log('onMessage ERROR', e);
		}
	}

	function onError(evt){
		console.log('ws ERROR ', evt);
	}
}


// =================================================================================
// Helper Fun
// ================================================================================
//show admin panel page
function showHomePanel(){
	$('#createPanel').fadeOut();
	$('#tint').fadeOut();
		
	setTimeout(function(){
		console.log('getting new marbles!');
		ws.send(JSON.stringify({type: 'get_marbles', v: 1}));					//need to wait a bit
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

//add notification to the panel, show panel now if you want with 2nd param
function addshow_notification(html, expandPanelNow){
	$('#emptyNotifications').hide();
	$('#noticeScrollWrap').prepend(html);

	var i = 0;
	$('.notificationWrap').each(function(){
		i++;
		if(i > 10) $(this).remove();
	});

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
/* global new_block, $, document, WebSocket, escapeHtml, ws:true, start_up:true, known_companies:true, autoCloseNoticePanel:true */
/* global show_start_up_step, build_notification, build_user_panels, build_company_panel, populate_users_marbles*/
/* exported transfer_marble, record_company, connect_to_server*/

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	var connected = false;
	connect();
	
	function connect(){
		var wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
		console.log('[ws] Connecting to websocket', wsUri);

		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log('[ws] CONNECTED');
		addshow_notification(build_notification(false, 'Connected to Marbles application'), false);
		connected = true;
		known_companies = {};					//reset
		start_up = true;						//reset
	}

	function onClose(evt){
		console.log('[ws] DISCONNECTED', evt);
		connected = false;
		addshow_notification(build_notification(true, 'Lost connection to Marbles application'), true);
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var msgObj = JSON.parse(msg.data);
			
			//marbles
			if(msgObj.msg === 'users_marbles'){
				console.log('[ws] rec', msgObj.msg, msgObj);
				populate_users_marbles(msgObj);
			}

			//chainstats
			else if(msgObj.msg === 'chainstats'){
				console.log('[ws] rec', msgObj.msg, ': ledger blockheight', msgObj.chainstats.height, 'block', msgObj.blockstats.height);
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
				console.log('[ws] rec', msgObj.msg, msgObj);
				build_user_panels(msgObj.owners);
				console.log('[ws] sending get_marbles msg');
				ws.send(JSON.stringify({type: 'get_marbles', v:1}));
			}

			//transaction error
			else if(msgObj.msg === 'tx_error'){
				console.log('[ws] rec', msgObj.msg, msgObj);
				addshow_notification(build_notification(true, escapeHtml(msgObj.e)), true);
			}

			//all marbles sent
			else if(msgObj.msg === 'all_marbles_sent'){
				console.log('[ws] rec', msgObj.msg, msgObj);
				start_up = false;
			}

			//app startup state
			else if(msgObj.msg === 'app_state'){
				console.log('[ws] rec', msgObj.msg, msgObj);
				setTimeout(function(){
					show_start_up_step(msgObj);
				}, 1000);
			}

			//unknown
			else console.log('[ws] rec', msgObj.msg, msgObj);
		}
		catch(e){
			console.log('[ws] onMessage ERROR', e);
		}
	}

	function onError(evt){
		console.log('[ws] ERROR ', evt);
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
		console.log('sending get_marbles msg');
		ws.send(JSON.stringify({type: 'get_marbles', v: 1}));					//need to wait a bit
	}, 1500);
}

//transfer_marble selected ball to user
function transfer_marble(marbleName, to_username, to_company){
	if(marbleName){
		var obj = 	{
						type: 'transfer_marble',
						name: marbleName,
						username: to_username,
						company: to_company,
						v: 1
					};
		console.log('[ws] sending transfer marble msg', obj);
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
	if(start_up === true) addshow_notification(build_notification(false, 'Detected company "' + company + '".'), false);

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
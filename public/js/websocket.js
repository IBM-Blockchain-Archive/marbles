/* global new_block, $, document, WebSocket, escapeHtml, ws:true, start_up:true, known_companies:true, autoCloseNoticePanel:true */
/* global show_start_up_step, build_notification, build_user_panels, build_company_panel, populate_users_marbles, show_tx_step*/
/* global getRandomInt, block_ui_delay:true, build_a_tx, auditingMarble*/
/* exported transfer_marble, record_company, connect_to_server, refreshHomePanel, pendingTxDrawing*/

var getEverythingWatchdog = null;
var wsTxt = '[ws]';
var pendingTransaction = null;
var pendingTxDrawing = [];

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server() {
	var connected = false;
	connect();

	function connect() {
		var wsUri = null;
		if (document.location.protocol === 'https:') {
			wsTxt = '[wss]';
			wsUri = 'wss://' + document.location.hostname + ':' + document.location.port;
		} else {
			wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
		}
		console.log(wsTxt + ' Connecting to websocket', wsUri);

		ws = new WebSocket(wsUri);
		ws.onopen = function (evt) { onOpen(evt); };
		ws.onclose = function (evt) { onClose(evt); };
		ws.onmessage = function (evt) { onMessage(evt); };
		ws.onerror = function (evt) { onError(evt); };
	}

	function onOpen(evt) {
		console.log(wsTxt + ' CONNECTED');
		addshow_notification(build_notification(false, 'Connected to Marbles application'), false);
		connected = true;
	}

	function onClose(evt) {
		console.log(wsTxt + ' DISCONNECTED', evt);
		connected = false;
		addshow_notification(build_notification(true, 'Lost connection to Marbles application'), true);
		setTimeout(function () { connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg) {
		try {
			var msgObj = JSON.parse(msg.data);

			//marbles
			if (msgObj.msg === 'everything') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				clearTimeout(getEverythingWatchdog);
				clearTimeout(pendingTransaction);
				$('#appStartingText').hide();
				clear_trash();
				build_user_panels(msgObj.everything.owners);
				for (var i in msgObj.everything.marbles) {
					populate_users_marbles(msgObj.everything.marbles[i]);
				}

				start_up = false;
				$('.marblesWrap').each(function () {
					if ($(this).find('.innerMarbleWrap').find('.ball').length === 0) {
						$(this).find('.noMarblesMsg').show();
					}
				});
			}

			//marbles
			else if (msgObj.msg === 'users_marbles') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				populate_users_marbles(msgObj);
			}

			// block
			else if (msgObj.msg === 'block') {
				console.log(wsTxt + ' rec', msgObj.msg, ': ledger blockheight', msgObj.block_height);
				if (msgObj.block_delay) block_ui_delay = msgObj.block_delay * 2;				// should be longer than block delay
				new_block(msgObj.block_height);													// send to blockchain.js
				
				if ($('#auditContentWrap').is(':visible')) {
					var obj = {
						type: 'audit',
						marble_id: auditingMarble.id
					};
					ws.send(JSON.stringify(obj));
				}
			}

			//marble owners
			else if (msgObj.msg === 'owners') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				clearTimeout(getEverythingWatchdog);
				build_user_panels(msgObj.owners);
				console.log(wsTxt + ' sending get_marbles msg');
			}

			//transaction error
			else if (msgObj.msg === 'tx_error') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				if (msgObj.e) {
					var err_msg = (msgObj.e.parsed) ? msgObj.e.parsed : msgObj.e;
					addshow_notification(build_notification(true, escapeHtml(err_msg)), true);
					$('#txStoryErrorTxt').html(err_msg);
					$('#txStoryErrorWrap').show();
				}
			}

			//all marbles sent
			else if (msgObj.msg === 'all_marbles_sent') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				start_up = false;

				$('.marblesWrap').each(function () {
					console.log('checking', $(this).attr('owner_id'), $(this).find('.innerMarbleWrap').find('.ball').length);
					if ($(this).find('.innerMarbleWrap').find('.ball').length === 0) {
						$(this).find('.noMarblesMsg').show();
					}
				});
			}

			//app startup state
			else if (msgObj.msg === 'app_state') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				setTimeout(function () {
					show_start_up_step(msgObj);
				}, 1000);
			}

			//tx state
			else if (msgObj.msg === 'tx_step') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				show_tx_step(msgObj);
			}

			//tx history
			else if (msgObj.msg === 'history') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				var built = 0;
				var x = 0;
				var count = $('.txDetails').length;

				for(x in pendingTxDrawing) clearTimeout(pendingTxDrawing[x]);

				if (count <= 0) {									//if no tx shown yet, append to back
					$('.txHistoryWrap').html('');					//clear
					for (x=msgObj.data.parsed.length-1; x >= 0; x--) {
						built++;
						slowBuildtx(msgObj.data.parsed[x], x, built);
					}

				} else {											//if we already showing tx, prepend to front
					console.log('skipping tx', count);
					for (x=msgObj.data.parsed.length-1; x >= count; x--) {
						var html = build_a_tx(msgObj.data.parsed[x], x);
						$('.txHistoryWrap').prepend(html);
						$('.txDetails:first').animate({ opacity: 1, left: 0 }, 600, function () {
							//after animate
						});
					}
				}
			}

			//general error
			else if (msgObj.msg === 'error') {
				console.log(wsTxt + ' rec', msgObj.msg, msgObj);
				if (msgObj.e) {
					addshow_notification(build_notification(true, escapeHtml(msgObj.e.parsed)), true);
				}
			}

			//unknown
			else console.log(wsTxt + ' rec', msgObj.msg, msgObj);
		}
		catch (e) {
			console.log(wsTxt + ' error handling a ws message', e);
		}
	}

	function onError(evt) {
		console.log(wsTxt + ' ERROR ', evt);
	}
}


// =================================================================================
// Helper Fun
// ================================================================================
//show admin panel page
function refreshHomePanel() {
	clearTimeout(pendingTransaction);
	pendingTransaction = setTimeout(function () {								//need to wait a bit
		get_everything_or_else();
	}, block_ui_delay);
}

//transfer_marble selected ball to user
function transfer_marble(marbleId, to_owner_id) {
	show_tx_step({ state: 'building_proposal' }, function () {
		var obj = {
			type: 'transfer_marble',
			id: marbleId,
			owner_id: to_owner_id,
			v: 1
		};
		console.log(wsTxt + ' sending transfer marble msg', obj);
		ws.send(JSON.stringify(obj));
		refreshHomePanel();
	});
}

//record the compan, show notice if its new
function record_company(company) {
	if (known_companies[company]) return;										//if i've seen it before, stop

	// -- Show the new company Notification -- //
	if (start_up === false) {
		console.log('[ui] this is a new company! ' + company);
		addshow_notification(build_notification(false, 'Detected a new company "' + company + '"!'), true);
	}

	build_company_panel(company);
	if (start_up === true) addshow_notification(build_notification(false, 'Detected company "' + company + '".'), false);

	console.log('[ui] recorded company ' + company);
	known_companies[company] = {
		name: company,
		count: 0,
		visible: 0
	};
}

//add notification to the panel, show panel now if you want with 2nd param
function addshow_notification(html, expandPanelNow) {
	$('#emptyNotifications').hide();
	$('#noticeScrollWrap').prepend(html);

	var i = 0;
	$('.notificationWrap').each(function () {
		i++;
		if (i > 10) $(this).remove();
	});

	if (expandPanelNow === true) {
		openNoticePanel();
		clearTimeout(autoCloseNoticePanel);
		autoCloseNoticePanel = setTimeout(function () {		//auto close, xx seconds from now
			closeNoticePanel();
		}, 10000);
	}
}

//open the notice panel
function openNoticePanel() {
	$('#noticeScrollWrap').slideDown();
	$('#notificationHandle').children().removeClass('fa-angle-down').addClass('fa-angle-up');
}

//close the notice panel
function closeNoticePanel() {
	$('#noticeScrollWrap').slideUp();
	$('#notificationHandle').children().removeClass('fa-angle-up').addClass('fa-angle-down');
	clearTimeout(autoCloseNoticePanel);
}

//get everything with timeout to get it all again!
function get_everything_or_else(attempt) {
	console.log(wsTxt + ' sending get everything msg');
	clearTimeout(getEverythingWatchdog);
	ws.send(JSON.stringify({ type: 'read_everything', v: 1 }));

	if (!attempt) attempt = 1;
	else attempt++;

	getEverythingWatchdog = setTimeout(function () {
		if (attempt <= 3) {
			console.log('\n\n! [timeout] did not get owners in time, impatiently calling it again', attempt, '\n\n');
			get_everything_or_else(attempt);
		}
		else {
			console.log('\n\n! [timeout] did not get owners in time, hopeless', attempt, '\n\n');
		}
	}, 5000 + getRandomInt(0, 10000));
}

//emtpy trash marble wrap
function clear_trash() {
	$('#trashbin .ball').fadeOut();
	setTimeout(function () {
		$('#trashbin .ball').remove();
	}, 500);
}

// delay build each transaction
function slowBuildtx(data, txNumber, built){
	pendingTxDrawing.push(setTimeout(function () {
		var html = build_a_tx(data, txNumber);
		$('.txHistoryWrap').append(html);
		$('.txDetails:last').animate({ opacity: 1, left: 0 }, 600, function () {
			//after animate
		});
	}, (built * 150)));
}

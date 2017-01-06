/* global new_block,formatDate, randStr, bag, $, clear_blocks, document, WebSocket, escapeHtml, window */
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
						user: $('select[name="user"]').val(),
						v: 1
					};
		if(obj.user && obj.name && obj.color){
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
	$('#user2wrap').droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER2){
				$(ui.draggable).addClass('invalid');
				transfer($(ui.draggable).attr('id'), bag.setup.USER2);
			}
		}
	});
	$('#user1wrap').droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER1){
				$(ui.draggable).addClass('invalid');
				transfer($(ui.draggable).attr('id'), bag.setup.USER1);
			}
		}
	});
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
	
	
	// =================================================================================
	// Helper Fun
	// ================================================================================
	//show admin panel page
	function showHomePanel(){
		$('#homePanel').fadeIn(300);
		$('#createPanel').hide();
		
		var part = window.location.pathname.substring(0,3);
		window.history.pushState({},'', part + '/home');						//put it in url so we can f5
		
		console.log('getting new balls');
		setTimeout(function(){
			$('#user1wrap').html('');											//reset the panel
			$('#user2wrap').html('');
			ws.send(JSON.stringify({type: 'get', v: 1}));						//need to wait a bit
			ws.send(JSON.stringify({type: 'chainstats', v: 1}));
		}, 1000);
	}
	
	//transfer selected ball to user
	function transfer(marbleName, user){
		if(marbleName){
			console.log('transfering', marbleName);
			var obj = 	{
							type: 'transfer',
							name: marbleName,
							user: user,
							v: 1
						};
			ws.send(JSON.stringify(obj));
			showHomePanel();
		}
	}
});


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	var connected = false;

    // Redirect https requests to http so the server can handle them
    if(this.location.href.indexOf("https://") > -1) {
        this.location.href = this.location.href.replace("https://", "http://");
    }

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
		ws.send(JSON.stringify({type: 'get', v:1}));
		ws.send(JSON.stringify({type: 'chainstats', v:1}));
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
				if(msgObj.blockstats && msgObj.blockstats.transactions) {
                    var e = formatDate(msgObj.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
                    $('#blockdate').html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
                    var temp =  {
                        id: msgObj.blockstats.height,
                        blockstats: msgObj.blockstats
                    };
                    new_block(temp);								//send to blockchain.js
				}
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
function build_ball(data){
	var html = '';
	var colorClass = '';
	var size = 'fa-5x';
	
	data.name = escapeHtml(data.name);
	data.color = escapeHtml(data.color);
	data.user = escapeHtml(data.user);
	
	console.log('got a marble: ', data.color);
	if(!$('#' + data.name).length){								//only populate if it doesn't exists
		if(data.size == 16) size = 'fa-3x';
		if(data.color) colorClass = data.color.toLowerCase();
		
		html += '<span id="' + data.name + '" class="fa fa-circle ' + size + ' ball ' + colorClass + ' title="' + data.name + '" user="' + data.user + '"></span>';
		if(data.user && data.user.toLowerCase() == bag.setup.USER1){
			$('#user1wrap').append(html);
		}
		else{
			$('#user2wrap').append(html);
		}
	}
	return html;
}
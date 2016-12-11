/* global bag, $*/
/* global escapeHtml, toTitleCase, formatDate, known_companies, transfer_marble, record_company*/
/* exported build_marble, record_company, build_user_panels, build_company_panel, build_notification, populate_users_marbles*/

// =================================================================================
//	UI Building
// =================================================================================
//build a marble
function build_marble(marble){
	var html = '';
	var colorClass = '';
	var size = 'largeMarble';
	
	marble.name = escapeHtml(marble.name);
	marble.color = escapeHtml(marble.color);
	marble.owner.username = escapeHtml(marble.owner.username);
	marble.owner.company = escapeHtml(marble.owner.company);

	console.log('building marble: ', marble.color);
	if(!$('#' + marble.name).length){								//only populate if it doesn't exists
		if(marble.size == 16) size = 'smallMarble';
		if(marble.color) colorClass = marble.color.toLowerCase() + 'bg';
		
		html += '<span id="' + marble.name + '" class="ball ' + size + ' ' + colorClass + ' title="' + marble.name + '"';
		html += ' username="' + marble.owner.username + '" company="' + marble.owner.company + '"></span>';

		var full_owner = build_full_owner(marble.owner.username, marble.owner.company);
		$('.marblesWrap[full_owner="' + full_owner +'"]').find('.innerMarbleWrap').prepend(html);
		$('.marblesWrap[full_owner="' + full_owner +'"]').find('.noMarblesMsg').hide();
	}
	return html;
}

//redraw the user's marbles
function populate_users_marbles(msg){
	var full_owner = build_full_owner(msg.username, msg.company);

	//reset
	$('.marblesWrap[full_owner="' + full_owner +'"]').find('.innerMarbleWrap').html('<i class="fa fa-plus addMarble"></i>');//reset the panels
	$('.marblesWrap[full_owner="' + full_owner +'"]').find('.noMarblesMsg').show();

	for(var i in msg.marbles){
		build_marble(msg.marbles[i]);
	}
}

//crayp resize - dsh to do, dynamic one
function size_user_name(name){
	var style = '';
	if(name.length >= 10) style = 'font-size: 22px;';
	if(name.length >= 15) style = 'font-size: 18px;';
	if(name.length >= 20) style = 'font-size: 15px;';
	if(name.length >= 25) style = 'font-size: 11px;';
	return style;
}

//build all user panels
function build_user_panels(data){
	var full_owner = '';

	//reset
	$('.innerMarbleWrap').html('<i class="fa fa-plus addMarble"></i>');		//reset the panels
	$('.noMarblesMsg').show();

	for(var i in data){
		var html = '';
		var colorClass = '';
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);
		record_company(data[i].company);
		known_companies[data[i].company].count++;
		known_companies[data[i].company].visible++;

		//reset
		$('.companyPanel[company="' + data[i].company + '"]').find('.ownerWrap').html('');

		full_owner = build_full_owner(data[i].username, data[i].company);
		console.log('building user', full_owner);

		html += '<div id="user' + i + 'wrap" username="' + data[i].username + '" company="' + data[i].company + '" full_owner="' + full_owner +'" class="marblesWrap ' + colorClass +'">';
		html +=		'<div class="legend" style="' + size_user_name(data[i].username) + '">';
		html +=			toTitleCase(data[i].username);
		html +=			'<span class="fa fa-thumb-tack marblesCloseSectionPos marblesFix" title="Never Hide Owner"></span>';
		html +=		'</div>';
		html +=		'<div class="innerMarbleWrap"><i class="fa fa-plus addMarble"></i></div>';
		html +=		'<div class="noMarblesMsg hint">No marbles</div>';
		html +=	'</div>';

		$('.companyPanel[company="' + data[i].company + '"]').find('.ownerWrap').append(html);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyVisible').html(known_companies[data[i].company].visible);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyCount').html(known_companies[data[i].company].count);
	}

	//drag and drop marble
	$('.innerMarbleWrap').sortable({connectWith: '.innerMarbleWrap', items: 'span'}).disableSelection();
	$('.innerMarbleWrap').droppable({drop:
		function( event, ui ) {
			var dragged_user = $(ui.draggable).attr('username').toLowerCase();
			var dropped_user = $(event.target).parents('.marblesWrap').attr('username').toLowerCase();
			var dropped_company = $(event.target).parents('.marblesWrap').attr('company');
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
	html +=			'<span class="companyName">' + toTitleCase(company) + '&nbsp;-&nbsp;</span>';
	html +=			'<span class="companyVisible">0</span>/';
	html +=			'<span class="companyCount">0</span>';
	if(company === bag.marble_company) {
		html +=			'<span class="fa fa-exchange floatRight"></span>';
	}
	else{
		html +=			'<span class="fa fa-long-arrow-left floatRight"></span>';
	}
	html +=		'</div>';
	html +=		'<div class="ownerWrap"></div>';
	html += '</div>';
	$('#allUserPanelsWrap').append(html);
}

//build the correct "full owner" string - concate username and company
function build_full_owner(username, company){
	return username.toLowerCase() + '.' + company;
}

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

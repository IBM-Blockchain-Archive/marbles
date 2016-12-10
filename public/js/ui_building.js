/* global bag, $*/
/* global escapeHtml, toTitleCase, formatDate, known_companies, transfer_marble, record_company*/
/* exported build_marble, record_company, build_user_panels, build_company_panel, build_notification*/

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
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyVisible').html(known_companies[data[i].company].visible);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyCount').html(known_companies[data[i].company].count);

	}

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
	html +=			'<span class="companyName">' + toTitleCase(company) + '&nbsp;-&nbsp;</span>';
	html +=			'<span class="companyVisible">0</span>/';
	html +=			'<span class="companyCount">0</span>';
	if(company.toLowerCase() === bag.marble_company.toLowerCase()) {
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

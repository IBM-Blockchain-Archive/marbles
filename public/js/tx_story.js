/* global $, document */
/* exported show_tx_step */
//var lsKey = 'marbles';
//var fromLS = {};

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	//fromLS = window.localStorage.getItem(lsKey);
	//if(fromLS) fromLS = JSON.parse(fromLS);
	//else fromLS = {};
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#closeTxStory').click(function(){
		$('#txStoryPanel, #tint').fadeOut();
	});

});
// =================================================================================
// Start Up Fun
// ================================================================================

//show the current step from the start up panel
function show_tx_step(obj){
	var state = obj.state;
	$('#txStoryPanel, #tint').fadeIn();

	if(state === 'building_proposal'){
		$('#txStep1').removeClass('inactiveStep');
		$('#txStep2, #txStep3, #txStep4').addClass('inactiveStep');

		setTimeout(function(){story1_animation();}, 500);
		setTimeout(function(){show_tx_step({state: 'endorsing'});}, 3000);
	}
	else if(state === 'endorsing'){
		$('#txStep1, #txStep2').removeClass('inactiveStep');
		$('#txStep3, #txStep4').addClass('inactiveStep');
		$('#txStep1').addClass('stepComplete');

		story2_animation();
	}
	else if(state === 'ordering'){
		$('#txStep1, #txStep2, #txStep3').removeClass('inactiveStep');
		$('#txStep4').addClass('inactiveStep');
		$('#txStep1, #txStep2').addClass('stepComplete');

		story3_animation();
		setTimeout(function(){show_tx_step({state: 'committing'});}, 3000);
	}
	else if(state === 'committing'){
		$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
		$('#txStep1, #txStep2, #txStep3').addClass('stepComplete');

		story4_animation(200);
		setTimeout(function(){show_tx_step({state: 'finished'});}, 5000);
	}
	else if(state === 'finished'){
		$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
		$('#txStep1, #txStep2, #txStep3, #txStep4').addClass('stepComplete');
	}
}


function story1_animation(){
	var dist = 50;
	$('#marbleBorderTop, #marbleBorderBottom, #marbleBorderLeft, #marbleBorderRight').show();
	$('#marbleBorderTop').animate({top: '+=' + dist}, {duration: 1800});
	$('#marbleBorderBottom').animate({top: '-=' + dist}, {duration: 1300});
	$('#marbleBorderLeft').animate({left: '+=' + dist}, {duration: 800});
	$('#marbleBorderRight').animate({left: '-=' + dist}, {duration: 800});
}


function story2_animation(){
	$('#proposeMarble').show();

	$('#proposeMarbleStable').removeClass('hideBorders');
	$('#marbleBorderTop').hide();
	$('#marbleBorderBottom').hide();
	$('#marbleBorderLeft').hide();
	$('#marbleBorderRight').hide();

	roll_ball('#proposeMarbleStable', 220, function(){
		$('#endorseMarbleStable').show();
	});
}

function story3_animation(){
	$('#endorseMarble').show();
	roll_ball('#endorseMarble', 250, function(){
		$('#endorseMarbleStable').show();
		$('.ordererMarbles:first').css('left', '420px').fadeIn();
		$('.ordererMarbles:last').css('left', '370px').fadeIn();
		$('#orderBox').fadeIn();
	});
}

function roll_ball(who, move, cb) {
	if(!cb) cb = function(){};

	$(who).animate({left: '+='+move}, {
		duration: 2000,
		step: function(distance) {
			var degree = distance * 360 / move;
			$(who).css('transform','rotate(' + degree + 'deg)');
		},
		complete: cb
	});
}

function story4_animation(dist){
	$('#orderBox').css('background', '#2EB9D6');
	setTimeout(function(){
		$('#proposeMarbleStable, .ordererMarbles').hide();
		setTimeout(function(){
			$('#orderBox').animate({left: '+=' + dist}, {
				duration: 2000,
				/*complete: function(){
					$('#orderBox').css('background', '#2EB9D6');
				}*/
			});
		}, 500);
	}, 500);
}


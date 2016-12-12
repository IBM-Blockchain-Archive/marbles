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
		setTimeout(function(){show_tx_step({state: 'endorsing'});}, 1000);
	}
	else if(state === 'endorsing'){
		$('#txStep1, #txStep2').removeClass('inactiveStep');
		$('#txStep3, #txStep4').addClass('inactiveStep');
		$('#txStep1').addClass('stepComplete');
	}
	else if(state === 'ordering'){
		$('#txStep1, #txStep2, #txStep3').removeClass('inactiveStep');
		$('#txStep4').addClass('inactiveStep');
		$('#txStep1, #txStep2').addClass('stepComplete');
		setTimeout(function(){show_tx_step({state: 'committing'});}, 1000);
	}
	else if(state === 'committing'){
		$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
		$('#txStep1, #txStep2, #txStep3').addClass('stepComplete');
		setTimeout(function(){show_tx_step({state: 'finished'});}, 2000);
	}
	else if(state === 'finished'){
		$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
		$('#txStep1, #txStep2, #txStep3, #txStep4').addClass('stepComplete');
	}
}
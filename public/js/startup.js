/* global $, document, ws, get_everything_or_else */
/* exported show_start_up_step */

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function () {
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#showStartupPanel').click(function () {
		$('#startUpPanel, #tint').fadeIn();
	});

	// ----------------------------- Actions-------------------------------------
	//enroll admin
	$('#enrollAdmin').click(function () {
		var obj = {
			type: 'setup',
			configure: 'enrollment',
			caUrl: $('input[name="caUrl"]').val(),
			enrollId: $('input[name="enrollId"]').val(),
			enrollSecret: $('input[name="enrollSecret"]').val(),
		};
		console.log('[startup] sending enrollment msg', obj);
		ws.send(JSON.stringify(obj));
	});
	
	//find chaincode again
	$('#findCcButton').click(function () {
		var obj = {
			type: 'setup',
			configure: 'find_chaincode',
			ordererUrl: $('input[name="ordererUrl"]').val(),
			peerUrl: $('input[name="peerUrl"]').val(),
			chaincodeId: $('input[name="chaincodeId"]').val(),
			chaincodeVersion: $('input[name="chaincodeVersion"]').val()
		};
		console.log('[startup] sending find_chaincode msg');
		ws.send(JSON.stringify(obj));
	});

	//register new marble owners
	$('#registerOwners').click(function () {
		var owners = $('input[name="marbleOwners"]').val();
		owners = owners.split(',');
		var obj = {
			type: 'setup',
			configure: 'register',
			build_marble_owners: owners,
		};
		console.log('[startup] sending register msg');
		ws.send(JSON.stringify(obj));
	});

	// show loading spinner
	$('.runStep').click(function () {
		var stepid = $(this).attr('stepid');
		$('#' + stepid + ' .loadingdiv').show();
	});

	/*$('.runStep').click(function () {
		var stepid = $(this).attr('stepid');
		var nextStepId = $(this).attr('nextstepid');
		console.log('got id', stepid, nextStepId);

		$('#' + stepid + ' .loadingdiv').show();
		let self = this;
		setTimeout(function () {
			$('#' + stepid + ' .loadingdiv').hide();
			$(self).parent().addClass('success');
			$('.oneStepWrap[stepid="' + stepid + '"').addClass('successfulStepIcon').removeClass('inactive');
			$('.oneStepWrap[stepid="' + nextStepId + '"').removeClass('inactive');
		}, 500);
	});*/

	// ----------------------------- Nav -------------------------------------
	$('.closeStartUp').click(function () {
		$('#createPanel, #startUpPanel, #tint').fadeOut();
	});

	$('.settingsExpand').click(function () {
		let content = $(this).parent().find('.settingsContent');
		if (content.is(':visible')) content.slideUp();
		else content.slideDown();
	});
	$('.nextStep').click(function () {
		var nextStep = $(this).attr('nextstepid');
		showStepPanel(nextStep);
	});
	$('.oneStepWrap').click(function () {
		var stepid = $(this).attr('stepid');
		if (!$(this).hasClass('inactive')) {
			showStepPanel(stepid);
		}
	});
});
// =================================================================================
// Start Up Fun
// ================================================================================

// show the step content and hide the current step content
function showStepPanel(openStepId) {
	let onStep = $('.onStep').attr('stepid');

	if (onStep != openStepId) {
		$('#' + onStep).fadeOut(100);
		console.log('hiding step', onStep, 'showing step', openStepId);
		setTimeout(function () {
			$('#' + openStepId).fadeIn(400);
			$('.onStep').removeClass('onStep');
			$('.oneStepWrap[stepid="' + openStepId + '"').addClass('onStep');
		}, 150);
	}
}

//show the current step from the start up panel
function show_start_up_step(obj) {
	var state = obj.state;

	//fake state stuff, dsh remove this
	/*state = {
		checklist: { state: 'success', step: 'step1' },
		enrolling: { state: 'success', step: 'step2' },
		find_chaincode: { state: 'success', step: 'step3' },
		register_owners: { state: 'waiting', step: 'step4' },
	};*/

	// we are not done with startup, show the panel
	if (state.register_owners.state !== 'success') {
		$('#startUpPanel, #tint').fadeIn();
		$('#doneStep').hide();
	} else {
		get_everything_or_else();
	}

	$('.loadingdiv').hide();				//hide all loading spinners when we get an updated state

	for (let i in state) {
		//console.log('working on state', i, state[i].step, state[i].state);
		let nextStep = 'step' + (Number(state[i].step[4]) + 1);
		if (state[i].state === 'success') {
			$('#' + state[i].step).removeClass('errorStepContent').addClass('success');
			$('.oneStepWrap[stepid="' + state[i].step + '"').removeClass('inactive, errorStepIcon').addClass('successfulStepIcon');
			$('.oneStepWrap[stepid="' + nextStep + '"').removeClass('inactive');
			console.log('removing inactive to step', nextStep, 'by step', state[i].step);
		} else if (state[i].state === 'failed') {
			$('#' + state[i].step).removeClass('success').addClass('errorStepContent');
			$('.oneStepWrap[stepid="' + state[i].step + '"').removeClass('successfulStepIcon, inactive').addClass('errorStepIcon');
			$('.oneStepWrap[stepid="' + nextStep + '"').addClass('inactive');
			console.log('adding inactive tostep', nextStep, 'by step', i);
		} else {
			$('#' + state[i].step).removeClass('success, errorStepContent');
			$('.oneStepWrap[stepid="' + state[i].step + '"').removeClass('successfulStepIcon, errorStepIcon');
			$('.oneStepWrap[stepid="' + nextStep + '"').addClass('inactive');
			console.log('adding inactive tostep', nextStep, 'by step', i);
		}
	}

	if (state.register_owners.state === 'success') {				//last step
		$('#step5').removeClass('errorStepContent').addClass('success');
		$('.oneStepWrap[stepid="step5"').removeClass('inactive, errorStepIcon').addClass('successfulStepIcon');
		$('.oneStepWrap[stepid="step5"').removeClass('inactive');
	}

	/*if(state === 'start_waiting'){						//lets start it up
		var json = 	{
						type: 'setup',
						configure: 'enrollment',
					};
		console.log('[startup] sending enrollment msg');
		ws.send(JSON.stringify(json));						//send msg to start
	}*/

	$('#showStartupPanel, #showSettingsPanel').prop('disabled', false);
}
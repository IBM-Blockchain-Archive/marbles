/* global $, window, document, ws, fromLS, lsKey, get_everything_or_else */
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
	//find chaincode again
	$('#retryDeploy').click(function () {
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
		$('#chaincodeStep').slideUp();
		$('#step2').removeClass('stepFailed');
	});

	//register new marble owners
	$('#registerOwners').click(function () {
		var owners = $('input[name="marbleOwners"]').val();
		owners = owners.split(',');
		console.log('owners', owners);
		var obj = {
			type: 'setup',
			configure: 'register',
			build_marble_owners: owners,
		};
		console.log('[startup] sending register msg');
		ws.send(JSON.stringify(obj));
		$('#regUserStep').slideUp();
		$('#step3').removeClass('stepFailed').removeClass('stepComplete');
	});

	//enroll admin
	$('#enrollAdmin').click(function () {
		var obj = {
			type: 'setup',
			configure: 'enrollment',
			caUrl: $('input[name="caUrl"]').val(),
			enrollId: $('input[name="enrollId"]').val(),
			enrollSecret: $('input[name="enrollSecret"]').val(),
		};
		console.log('[startup] sending enrollment msg');
		ws.send(JSON.stringify(obj));
		$('#adminStep').slideUp();
		$('#step1').removeClass('stepFailed').removeClass('stepComplete');
	});

	// ----------------------------- Nav -------------------------------------
	//show register user panel
	$('#step1 .stepEdit').click(function () {
		if ($('#adminStep').is(':visible')) {
			$('#adminStep').slideUp();
		} else {
			$('.stepHelpWrap').hide();
			$('#adminStep').slideDown();
		}
	});

	//show register user panel
	$('#step2 .stepEdit').click(function () {
		if ($('#chaincodeStep').is(':visible')) {
			$('#chaincodeStep').slideUp();
		} else {
			$('.stepHelpWrap').hide();
			$('#chaincodeStep').slideDown();
		}
	});

	//show find chaincode panel
	$('#step3 .stepEdit').click(function () {
		if ($('#regUserStep').is(':visible')) {
			$('#regUserStep').slideUp();
		} else {
			$('.stepHelpWrap').hide();
			$('#regUserStep').slideDown();
		}
	});

	$('.closeStartUp').click(function () {
		$('#createPanel, #startUpPanel, #tint, #adminStep, #chaincodeStep, #regUserStep').fadeOut();
	});

	$('.settingsExpand').click(function(){
		let content = $(this).parent().find('.settingsContent');
		if(content.is(':visible')) content.slideUp();
		else content.slideDown();
	});
});
// =================================================================================
// Start Up Fun
// ================================================================================

//show the current step from the start up panel
function show_start_up_step(obj) {
	var state = obj.state;

	// we are not done with startup, show the panel
	if (state.register_owners !== 'success') {
		$('#startUpPanel, #tint').fadeIn();
		$('#doneStep').hide();
	}

	state = {
		checklist: { state: 'success', step: 'step1' },
		enrolling: { state: 'success', step: 'step2' },
		find_chaincode: { state: 'success', step: 'step3' },
		register_owners: { state: 'waiting', step: 'step4' },
	};

	for (let i in state) {
		//console.log('working on state', i, state[i].step, state[i].state);
		let nextStep = 'step' + (Number(state[i].step[4]) + 1);
		if (state[i].state === 'success') {
			$('#' + state[i].step).removeClass('errorStepContent').addClass('success');
			$('.oneStepWrap[stepid="' + state[i].step + '"').removeClass('inactive, errorStepIcon').addClass('successfulStepIcon');
			$('.oneStepWrap[stepid="' + nextStep + '"').removeClass('inactive');
			console.log('removing inactive to step', nextStep, 'by step', i);
		} else if (state[i].state === 'failed') {
			$('#' + state[i].step).removeClass('success').addClass('errorStepContent');
			$('.oneStepWrap[stepid="' + state[i].step + '"').removeClass('successfulStepIcon, inactive').addClass('errorStepIcon');
			$('.oneStepWrap[stepid="' + nextStep + '"').addClass('inactive');
			console.log('adding inactive tostep', nextStep, 'by step', i);
		} else {
			$('#' + state[i].step).removeClass('success, errorStepContent');
			$('.oneStepWrap[stepid="' + state[i].step + '"').removeClass('successfulStepIcon, errorStepIcon').addClass('inactive')
			$('.oneStepWrap[stepid="' + nextStep + '"').addClass('inactive');
			console.log('adding inactive tostep', nextStep, 'by step', i);
		}
	}

	/*if(state === 'start_waiting'){						//lets start it up
		$('#startUpPanel, #tint').fadeIn();
		$('#step1').removeClass('stepFailed');
		$('#step1').removeClass('inactiveStep');
		$('#step2, #step3').addClass('inactiveStep');
		$('#step1, #step2, #step3').removeClass('stepComplete');
		$('#doneStep').hide();

		var json = 	{
						type: 'setup',
						configure: 'enrollment',
					};
		console.log('[startup] sending enrollment msg');
		ws.send(JSON.stringify(json));						//send msg to start
	}
	else if(state === 'failed_enroll'){						//could not enroll
		$('#startUpPanel, #tint').fadeIn();
		$('#step1').addClass('stepFailed');
		$('#step1').removeClass('inactiveStep');
		$('#step2, #step3').addClass('inactiveStep');
		$('#step2, #step3').removeClass('stepComplete');
		$('#doneStep').hide();

		$('.stepHelpWrap').hide();
		$('#adminStep').slideDown();						//show help
	}
	else if(state === 'enrolled'){							//enroll good, trying to find chaincode
		$('#startUpPanel, #tint').fadeIn();
		$('#doneStep').hide();
		step1_success();
	}
	else if(state === 'no_chaincode'){						//could not find chaincode
		$('#startUpPanel, #tint').fadeIn();
		$('#step1').removeClass('stepFailed');
		$('#step2').addClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step3').addClass('inactiveStep');
		$('#step1').addClass('stepComplete');
		$('#doneStep').hide();

		$('.stepHelpWrap').hide();
		$('#chaincodeStep').slideDown();					//show help
	}
	else if(state === 'found_chaincode'){					//found chaincode, trying to register users
		$('#startUpPanel, #tint').fadeIn();
		$('#doneStep').hide();
		step2_success();
	}
	else if(state === 'registered_owners'){					//register complete
		if(obj.first_setup === 'yes'){
			$('#startUpPanel, #tint').fadeIn();
		}
		step3_success(function(){
			start_marbles();
		});
	}*/

	setTimeout(function () {
		$('#showStartupPanel, #showSettingsPanel').prop('disabled', false);
	}, 2000);

	function start_marbles() {
		$('.stepHelpWrap').hide();
		$('#doneStep').slideDown();

		console.log('[startup] sending get everything msg');
		get_everything_or_else();
		fromLS.startedUpBefore = true;
		window.localStorage.setItem(lsKey, JSON.stringify(fromLS));		//save
	}

	function step1_success(cb) {
		console.log('success step 1');
		$('#step1').removeClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step3').addClass('inactiveStep');
		$('#step1').addClass('stepComplete');
		$('#step2, #step3').removeClass('stepComplete');
		if (cb) {
			setTimeout(function () {
				cb();
			}, 1000);
		}
	}

	function step2_success(cb) {
		console.log('success step 2');
		$('#step1, #step2').removeClass('stepFailed');
		$('#step1, #step2, #step3').removeClass('inactiveStep');
		$('#step1, #step2').addClass('stepComplete');
		$('#step3').removeClass('stepComplete');
		if (cb) {
			setTimeout(function () {
				cb();
			}, 1000);
		}
	}

	function step3_success(cb) {
		console.log('success step 3');
		$('#step1, #step2, #step3').removeClass('stepFailed');
		$('#step1, #step2, #step3').removeClass('inactiveStep');
		$('#step1, #step2, #step3').addClass('stepComplete');
		if (cb) cb();
	}
}
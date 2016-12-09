/* global $, document, ws */
/* exported show_start_up_step */

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#retryDeploy').click(function(){
		var obj = 	{
						type: 'setup',
						configure: 'find_chaincode',
						ordererUrl: $('input[name="ordererUrl]').val(),
						peerUrl: $('input[name="peerUrl"]').val(),
						chaincodeId: $('input[name="chaincodeId"]').val()
					};
		ws.send(JSON.stringify(obj));
		$('#chaincodeStep').slideUp();
		$('#step2').removeClass('stepFailed');
	});

	$('#deployButton').click(function(){
		var obj = 	{
						type: 'setup',
						configure: 'deploy_chaincode',
						ordererUrl: $('input[name="ordererUrl]').val(),
						peerUrl: $('input[name="peerUrl"]').val(),
						chaincodeId: $('input[name="chaincodeId"]').val()
					};
		ws.send(JSON.stringify(obj));
		$('#chaincodeStep').slideUp();
		$('#step2').removeClass('stepFailed');
	});
});
// =================================================================================
// Start Up Fun
// ================================================================================

//
function show_start_up_step(state){
	console.log('marbles is in state', state);

	//outcome of the last step
	//'starting', 'failed_enroll', 'enrolled', 'no_chaincode', 'found_chaincode', 'registered_owners'

	if(state === 'starting'){
		//$()

		delay_try_again(1000);
	}
	else if(state === 'failed_enroll'){						//could not enroll
		$('#step1').removeClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step2, #step3').addClass('inactiveStep');

		$('.stepHelpWrap').hide();
		$('#adminStep').slideDown();						//show help

		delay_try_again(2000);
	}
	else if(state === 'enrolled'){							//enroll good, trying to find chaincode
		$('#step1').removeClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step3').addClass('inactiveStep');
		$('#step1').addClass('stepComplete');

		delay_try_again(2000);
	}
	else if(state === 'no_chaincode'){						//could not find chaincode
		$('#step1').removeClass('stepFailed');
		$('#step2').addClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step3').addClass('inactiveStep');
		$('#step1').addClass('stepComplete');

		$('.stepHelpWrap').hide();
		$('#chaincodeStep').slideDown();					//show help

		delay_try_again(3000);
	}
	else if(state === 'found_chaincode'){					//found chaincode, trying to register users
		$('#step1, #step2').removeClass('stepFailed');
		$('#step1, #step2, #step3').removeClass('inactiveStep');
		$('#step1, #step2').addClass('stepComplete');

		delay_try_again(3000);
	}
	else if(state === 'registered_owners'){					//register complete
		$('#step1, #step2, #step3').removeClass('stepFailed');
		$('#step1, #step2, #step3').removeClass('inactiveStep');
		$('#step1, #step2, #step3').addClass('stepComplete');
		$('#startUpPanel').hide();

		ws.send(JSON.stringify({type: 'get_owners', v: 1}));
	}

	function delay_try_again(delay_ms){
		setTimeout(function(){
			ws.send(JSON.stringify({type: 'get_owners', v: 1}));
		}, delay_ms);
	}
}
/* global $, document, ws */
/* exported show_start_up_step */

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('#showStartupPanel').click(function(){
		$('#startUpPanel').fadeIn();
	});
	
	// ----------------------------- Actions-------------------------------------
	//find chaincode again
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

	//deploy chaincode
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

	//register new marble owners
	$('#registerOwners').click(function(){
		var owners =  $('input[name="marbleOwners"]').val();
		owners = owners.split(',');
		console.log('owners', owners);
		var obj = 	{
						type: 'setup',
						configure: 'register',
						build_marble_owners: owners,
					};
		ws.send(JSON.stringify(obj));
		$('#regUserStep').slideUp();
		$('#step2').removeClass('stepFailed').removeClass('stepComplete');
	});

	//enroll admin
	$('#enrollAdmin').click(function(){
		var obj = 	{
						type: 'setup',
						configure: 'enrollment',
						copUrl: $('input[name="copUrl"]').val(),
						enrollId: $('input[name="enrollId"]').val(),
						enrollSecret: $('input[name="enrollSecret"]').val(),
					};
		ws.send(JSON.stringify(obj));
		$('#adminStep').slideUp();
		$('#step1').removeClass('stepFailed').removeClass('stepComplete');
	});

	// ----------------------------- Nav -------------------------------------
	//show register user panel
	$('#step1 .stepEdit').click(function(){
		$('.stepHelpWrap').hide();
		$('#adminStep').slideDown();
	});

	//show register user panel
	$('#step2 .stepEdit').click(function(){
		$('.stepHelpWrap').hide();
		$('#chaincodeStep').slideDown();
	});

	//show find chaincode panel
	$('#step3 .stepEdit').click(function(){
		$('.stepHelpWrap').hide();
		$('#regUserStep').slideDown();
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
	}
	else if(state === 'failed_enroll'){						//could not enroll
		$('#step1').addClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step2, #step3').addClass('inactiveStep');

		$('.stepHelpWrap').hide();
		$('#adminStep').slideDown();						//show help
	}
	else if(state === 'enrolled'){							//enroll good, trying to find chaincode
		step1_success();
	}
	else if(state === 'no_chaincode'){						//could not find chaincode
		$('#step1').removeClass('stepFailed');
		$('#step2').addClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step3').addClass('inactiveStep');
		$('#step1').addClass('stepComplete');

		$('.stepHelpWrap').hide();
		$('#chaincodeStep').slideDown();					//show help
	}
	else if(state === 'found_chaincode'){					//found chaincode, trying to register users
		step1_success(function(){
			step2_success();
		});
	}
	else if(state === 'registered_owners'){					//register complete
		step1_success(function(){
			step2_success(function(){
				step3_success(function(){
					$('#startUpPanel').hide();
					ws.send(JSON.stringify({type: 'get_owners', v: 1}));
				});
			});
		});
	}

	function step1_success(cb){
		console.log('success step 1');
		$('#step1').removeClass('stepFailed');
		$('#step1, #step2').removeClass('inactiveStep');
		$('#step3').addClass('inactiveStep');
		$('#step1').addClass('stepComplete');
		if(cb){
			setTimeout(function(){
				cb();
			}, 1500);
		}
	}

	function step2_success(cb){
		console.log('success step 2');
		$('#step1, #step2').removeClass('stepFailed');
		$('#step1, #step2, #step3').removeClass('inactiveStep');
		$('#step1, #step2').addClass('stepComplete');
		if(cb){
			setTimeout(function(){
				cb();
			}, 1000);
		}
	}

	function step3_success(cb){
		console.log('success step 3');
		$('#step1, #step2, #step3').removeClass('stepFailed');
		$('#step1, #step2, #step3').removeClass('inactiveStep');
		$('#step1, #step2, #step3').addClass('stepComplete');
		if(cb){
			setTimeout(function(){
				cb();
			}, 1500);
		}
	}
}
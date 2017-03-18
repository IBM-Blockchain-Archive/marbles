/* global $, document, fromLS, set_story_mode */
/* exported show_tx_step*/
var story1html = '';
var story2html = '';
var story3html = '';
var story4html = '';

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	if(fromLS && fromLS.story_mode === true){
		set_story_mode('on');
	}
	else{
		set_story_mode('off');
	}

	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$('.closeTxStory').click(function(){
		$('#txStoryPanel, #tint, #doneTxStep').fadeOut();

		//reset
		setTimeout(function(){
			$('#txStep1 .txStoryWrap').html(story1html);
			$('#txStep2 .txStoryWrap').html(story2html);
			$('#txStep3 .txStoryWrap').html(story3html);
			$('#txStep4 .txStoryWrap').html(story4html);
		}, 500);
	});

	//remember initial contents, we will rebuild on reset
	story1html = $('#txStep1 .txStoryWrap').html();
	story2html = $('#txStep2 .txStoryWrap').html();
	story3html = $('#txStep3 .txStoryWrap').html();
	story4html = $('#txStep4 .txStoryWrap').html();
});

// =================================================================================
// Start Up Fun
// ================================================================================

//show the current step from the start up panel
function show_tx_step(obj, cb_orig){
	var state = obj.state;
	if(fromLS.story_mode === false) {
		console.log('tx story mode is false');
		if(cb_orig) return cb_orig();
		else return;
	}

	setTimeout(function(){													//wait for initial panel fade in
		
		//1
		if(state === 'building_proposal'){
			reset();
			$('.closeTxStory').hide();
			$('#txStep1').removeClass('inactiveStep');
			$('#txStep2, #txStep3, #txStep4').addClass('inactiveStep');
			$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('stepComplete');//reset

			story1_animation(function(){
				setTimeout(function(){
					show_tx_step({state: 'endorsing'}, cb_orig);			//we pass callback to next step!
				}, 500);
			});
		}

		//2
		else if(state === 'endorsing'){
			reset();
			$('#txStep1, #txStep2').removeClass('inactiveStep');
			$('#txStep3, #txStep4').addClass('inactiveStep');
			$('#txStep1').addClass('stepComplete');

			story2_animation(function(){
				if(cb_orig) cb_orig();
			});																//finally call it here
		}

		//3
		else if(state === 'ordering'){
			$('#txStep1, #txStep2, #txStep3').removeClass('inactiveStep');
			$('#txStep4').addClass('inactiveStep');
			$('#txStep1, #txStep2').addClass('stepComplete');

			story3_animation();
		}

		//4
		else if(state === 'committing'){
			setTimeout(function(){
				$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
				$('#txStep1, #txStep2, #txStep3').addClass('stepComplete');

				story4_animation();
			}, 4000);
		}

		//exit
		else if(state === 'finished'){
			$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
			$('#txStep1, #txStep2, #txStep3, #txStep4').addClass('stepComplete');
			$('#commitBoxStable span').removeClass('fa-search').addClass('fa-check');
			$('#doneTxStep').slideDown();
			$('.closeTxStory').show();
		}

		//error states
		else if(state === 'endorsing_failed'){
			$('#txStep1, #txStep2').removeClass('inactiveStep');
			$('#txStep3, #txStep4').addClass('inactiveStep');
			$('#txStep1').addClass('stepComplete');

			$('#txStep2').addClass('stepFailed');
			$('#endorseMarbleStable .fa-check').removeClass('fa-check').addClass('fa-close');
			$('#endorseMarbleStable span').fadeIn();
			$('.closeTxStory').show();
		}
		else if(state === 'ordering_failed'){
			$('#txStep1, #txStep2, #txStep3').removeClass('inactiveStep');
			$('#txStep4').addClass('inactiveStep');
			$('#txStep1, #txStep2').addClass('stepComplete');

			$('#txStep3').addClass('stepFailed');
			$('.closeTxStory').show();
		}
		else if(state === 'committing_failed'){
			$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('inactiveStep');
			$('#txStep1, #txStep2, #txStep3').addClass('stepComplete');

			$('#txStep4').addClass('stepFailed');
			$('#commitBoxStable span').removeClass('fa-search').addClass('fa-close');
			$('.closeTxStory').show();
		}
	}, 300);
}

function reset(){
	$('#txStoryPanel, #tint').fadeIn(300);
	$('#txStep1, #txStep2, #txStep3, #txStep4').removeClass('stepFailed');	//reset
	$('#txStoryErrorTxt').html('');
	$('#txStoryErrorWrap').hide();
	$('#commitBoxStable span').removeClass('fa-check').removeClass('fa-close').addClass('fa-search');
}

//1. animate borders to join marble in center
function story1_animation(cb){
	var dist = 50;
	$('#marbleBorderTop, #marbleBorderBottom, #marbleBorderLeft, #marbleBorderRight').show();
	$('#marbleBorderTop').animate({top: '+=' + dist}, {
		duration: 1800,
		complete: cb
	});
	$('#marbleBorderBottom').animate({top: '-=' + dist}, {duration: 1300});
	$('#marbleBorderLeft').animate({left: '+=' + dist}, {duration: 800});
	$('#marbleBorderRight').animate({left: '-=' + dist}, {duration: 800});
}

//1. show marble that will roll
//2. roll it
//3. hide rolled marble
//4. show endorse marble with (icon hidden)
function story2_animation(cb){
	$('#proposeMarble').show();
	$('#proposeMarbleStable').removeClass('hideBorders');

	var dist1 = $('#txStep1 .txStatusWrap .txStatus').offset();
	var dist2 = $('#txStep2 .txStatusWrap .txStatus').offset();
	var diff = dist2.left - dist1.left;


	roll_ball('#proposeMarble', diff, function(){
		$('#proposeMarble').hide();
		$('#endorseMarbleStable').show();
		if(cb) cb();
	});
}

//1. show the marble that will roll
//2. roll endorsed marble
//3. show orderer marbles
//4. hide rolled marble
//5. build box around marbles
function story3_animation(cb){
	$('#endorseMarbleStable span').fadeIn();
	$('#endorseMarble').show();

	var dist2 = $('#txStep2 .txStatusWrap .txStatus').offset();
	var dist3 = $('#txStep3 .txStatusWrap .txStatus').offset();
	var diff = dist3.left - dist2.left;

	roll_ball('#endorseMarble', diff, function(){
		$('#endorseMarbleStable').show();
		$('.ordererMarbles').fadeIn();
		setTimeout(function(){
			$('#orderBoxStable').fadeIn(500);
			setTimeout(function(){
			$('#orderBoxStable').css('border', '2px #fff solid');
				setTimeout(function(){
					$('#endorseMarble').hide();
					if(cb) cb();
				}, 500);
			}, 1000);
		}, 300);
	});
}

//1. fade in solid box around marbles
//2. animate it right
//3. fade in stable box
//4. hide box we moved
function story4_animation(cb){
	var dist3 = $('#txStep3 .txStatusWrap .txStatus').offset();
	var dist4 = $('#txStep4 .txStatusWrap .txStatus').offset();
	var diff = dist4.left - dist3.left;

	$('#orderBox').fadeIn(1000);
	setTimeout(function(){
		setTimeout(function(){
			$('#orderBox').animate({left: '+=' + diff}, {
				duration: 2000,
				complete: function(){
					$('#commitBoxStable').show();
					$('#orderBox').hide();
					if(cb) cb();
				}
			});
		}, 500);
	}, 1000);
}

//roll a circle right xxx distance
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

/* global formatDate */
/* global $ */
var block = 0;
var blocks = [];

$(document).on('ready', function() {
	setInterval(function(){
		move_on_down();
	}, 2000);

	var clicked = false;
	$(document).on("click", ".block", function(event){
		clicked = !clicked;
		show_details(Number($(this).html()));
	});

	$(document).on("mouseover", ".block", function(event){
		show_details(Number($(this).html()));
	});
	
	$(document).on("mouseleave", "#blockWrap", function(){
		if(!clicked) $("#details").fadeOut();
	});
});

function show_details(id){
	var left = event.pageX - $('#details').parent().offset().left - 50;
	if(left < 0) left = 0;

	var html = '<p class="blckLegend"> Block Height: ' + blocks[id].id + '</p>';
	html += '<hr class="line"/><p>Created: &nbsp;' + formatDate(blocks[id].blockstats.transactions[0].timestamp.seconds * 1000, '%M-%d-%Y %I:%m%p') + ' UTC</p>';
	html += '<p> UUID: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + blocks[id].blockstats.transactions[0].uuid + '</p>';
	html += '<p> Type:  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + blocks[id].blockstats.transactions[0].type + '</p>';
	html += '<p> CC ID:  &nbsp;&nbsp;&nbsp;&nbsp;' + atob(blocks[id].blockstats.transactions[0].chaincodeID) + '</p>';
	$("#details").html(html).css("left", left).fadeIn();
}

function new_block(newblck){
	if(!blocks[Number(newblck.id)]){
		for(var last in blocks);								//find the id of the last known block
		if(!last) last = 0;
		last++;
		//console.log('last', last, Number(newblck.id));
		if(block > 0){											//never fake blocks on an initial load
			for(var i=last; i < Number(newblck.id); i++){		//build fake blocks for ones we missed out on
				console.log('run?');
				blocks[Number(i)] = newblck;
				build_block(i);
			}
		}
		blocks[Number(newblck.id)] = newblck;
		build_block(newblck.id);								//build block
	}
}

function build_block(id){
	$("#blockWrap").append('<div class="block">' +  nDig(id, 3) + '</div>');
	$(".block:last").animate({opacity: 1, left: (block * 36)}, 600, function(){
		$(".lastblock").removeClass("lastblock");
		$(".block:last").addClass("lastblock");
	});
	block++;
}

function move_on_down(){
	if(block > 10){
		$(".block:first").animate({opacity: 0}, 800, function(){$(".block:first").remove();});
		$(".block").animate({left: "-=36"}, 800, function(){});
		block--;
	}
}

function clear_blocks(){
	block = 0;
	blocks = [];
	$(".block").remove();
}
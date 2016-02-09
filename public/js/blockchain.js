var block = 0;
var blocks = [];

$(document).on('ready', function() {
	setInterval(function(){
		move_on_down();
	}, 2000);

	$(document).on("mouseover", ".block", function(event){
		var left = event.pageX - $('#details').parent().offset().left - 50;
		var id = Number($(this).html());
		if(left < 0) left = 0;
		console.log('you be hovering', event.pageX, id);
		
		var html = '<p class="blckLegend"> Block Height: ' + blocks[id].id + '</p>';
		html += '<hr class="line"/><p>Created: &nbsp;' + formatDate(blocks[id].blockstats.transactions[0].timestamp.seconds * 1000, '%M-%d-%Y %I:%m%p') + ' UTC</p>';
		html += '<p> UUID: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + blocks[id].blockstats.transactions[0].uuid + '</p>';
		html += '<p> Type:  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + blocks[id].blockstats.transactions[0].type + '</p>';
		html += '<p> CC ID:  &nbsp;&nbsp;&nbsp;&nbsp;' + blocks[id].blockstats.transactions[0].chaincodeID + '</p>';
		$("#details").html(html).css("left", left).fadeIn();
	});
	
	$(document).on("mouseleave", "#blockWrap", function(){
		$("#details").fadeOut();
	});
});

function new_block(newblck){
	blocks[newblck.id] = newblck;
	console.log('on block', newblck.id);
	$("#blockWrap").append('<div class="block">' + newblck.id + '</div>');
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
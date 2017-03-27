/* global $, document, nDig */
/* exported clear_blocks, new_block */
var uiBlocksCount = 0;
var blocks = [];
var block_height = 0;

var block_width_px = 32;				//width of the block in px (match this to css)
var block_margin_px = 15;				//desired margin of the block
var block_left_px = block_width_px + block_margin_px;
var moveBlocks = null;					//interval var

$(document).on('ready', function () {
	startTheShow();
});

function startTheShow() {
	moveBlocks = setInterval(function () {
		move_on_down();
	}, 2000);
}

function new_block(id) {											//rec a new block
	id = Number(id);
	if (!blocks[id]) {											//if its a new block, build it

		if (uiBlocksCount > 0) {									//build missing blocks, except on load (so we dont start at block 0)
			for (var prev = block_height + 1; prev < id; prev++) {
				console.log('building missing block', prev);
				blocks[prev] = { block_height: prev };
				build_block(prev);								//build the missing blocks
			}
		}

		if (id > block_height) {									//only draw blocks that are newer
			blocks[id] = { block_height: id };
			build_block(id);									//build this new block
			block_height = id;
		}
	}
}

function build_block(id) {										//build and append the block html
	var sizeClass = '';
	if (id >= 1000000) {
		sizeClass = 'million';									//figure out a size thats okay
	} else if (id >= 1000) {
		sizeClass = 'thousands';
	} else {
		id = nDig(id, 3);
	}

	var html = `<div class="block ` + sizeClass + `">
					<div class="tooltip">
						<span class="tooltiptext">Block ` + Number(id) + ` has been committed to the ledger</span>
						` + id + `
					</div>
				</div>`;
	$('#blockWrap').append(html);

	// move the block left (number_of_blocks * blocks_width) + 2 blocks_width
	$('.block:last').animate({ opacity: 1, left: (uiBlocksCount * block_left_px) + block_left_px * 2 }, 600, function () {
		$('.lastblock').removeClass('lastblock');
		$('.block:last').addClass('lastblock');
	});
	uiBlocksCount++;
}

function move_on_down() {										//move the blocks left
	if (uiBlocksCount > 10) {
		$('.block:first').animate({ opacity: 0 }, 800, function () { 
			$('.block:first').remove(); 
		});
		$('.block').animate({ left: '-=' + block_left_px }, 800, function () { });
		uiBlocksCount--;

		if (uiBlocksCount > 10) {								//fast mode, clear the blocks!
			clearInterval(moveBlocks);
			setTimeout(function () {
				move_on_down();
			}, 900);											//delay should be longer than animation delay
		}
		else {
			startTheShow();
		}
	}
}

/* global $ */
//make random string of set length
function randStr(length){
	var text = "";
	var possible = "abcdefghijkmnpqrstuvwxyz0123456789";
	for(var i=0; i < length; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}	
	
//capital first letter of each word
function toTitleCase(str){
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function formatDate(date, fmt) {
	var date = new Date(date);
    function pad(value) {
        return (value.toString().length < 2) ? '0' + value : value;
    }
    return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
        switch (fmtCode) {
        case 'Y':
            return date.getUTCFullYear();
        case 'M':
            return pad(date.getUTCMonth() + 1);
        case 'd':
            return pad(date.getUTCDate());
        case 'H':
            return pad(date.getUTCHours());
        case 'm':
            return pad(date.getUTCMinutes());
        case 's':
            return pad(date.getUTCSeconds());
        default:
            throw new Error('Unsupported format code: ' + fmtCode);
        }
    });
}

function formatTimer(seconds){
	hr = '00';
	min = '00';
	sec = '00';
	seconds = eval(seconds);
	if(seconds >= 60*60){
		hr = Math.floor(seconds / (60*60));
		seconds = seconds % (60*60);
		//console.log('seconds left: ' + seconds);
	}
	if(seconds >= 60){
		min = Math.floor(seconds / 60);
		seconds = seconds % 60;
		//console.log('seconds left: ' + seconds);
	}
	sec = seconds;
	//console.log('seconds left: ' + seconds);

	str = nDig(hr, 2) + ':' + nDig(min, 2) + ':' + nDig(sec, 2);
	//console.log("str: " + str);
	return str;
}

function nDig(n, digits){						//zero pad to number of digits, up to 4
	var ret = n;
	if(digits == 2) ret = (n > 9) ? "" + n: "0" + n;
	else if(digits == 3) ret = (n > 99) ? "" + n: "0" + n;
	else if(digits == 4) ret = (n > 999) ? "" + n: "0" + n;
	if(ret.toString().length > digits){
		ret = ret.substring(ret.toString().length-digits, digits+1); 	//i don't think this is right yet...
	}
	return ret;
}

var API_URL = "";
var API_VER = "";
$(document).ready(function(){
	API_URL = "https://" + $("#api_url").val();
	API_VER = $("#api_ver").val();
	//console.log(API_URL + API_VER);
	
	/*$(".formatDate").each(function(){
		var tmp = $(this).html();
		console.log(tmp);
		$(this).html(formatDate(eval(tmp), "%M/%d/%Y %H:%m:%s"));
	});*/
});
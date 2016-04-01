'use strict';
/* global Buffer */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
/*
	Version: 0.6.3
	Updated: 4/01/2015
	-----------------------------------------------------------------
	Use:	var rest = require('./rest');
			rest.init({quiet: false});						//set default values here for all calls of 'rest'
			var options = {									//set options here for this call (overrides init)
				host: HOST_HERE,
				path: PATH HERE,
				headers: {
							"Content-Type": "application/json",
							"Accept": "application/json"
						}
			};
			options.success = function(statusCode, data){
				console.log("Get - success");
			}
			options.failure = function(statusCode, e){
				console.log("Get - failure", e);
			}
			rest.get(options, {'user':'david'});
	-----------------------------------------------------------------
	
	Valid "options" values: (these are default ones that come from requests module)
	-----------------------------------------------------------------
	host: A domain name or IP address of the server to issue the request to. Defaults to 'localhost'.
	hostname: To support url.parse() hostname is preferred over host
	port: Port of remote server. Defaults to 80.
	localAddress: Local interface to bind for network connections.
	socketPath: Unix Domain Socket (use one of host:port or socketPath)
	method: A string specifying the HTTP request method. Defaults to 'GET'.
	path: Request path. Defaults to '/'. Should include query string if any. E.G. '/index.html?page=12'. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future.
	headers: An object containing request headers.
	auth: Basic authentication i.e. 'user:password' to compute an Authorization header.
	agent: Controls Agent behavior. When an Agent is used request will default to Connection: keep-alive. Possible values:
		undefined (default): use global Agent for this host and port.
		Agent object: explicitly use the passed in Agent.
		false: opts out of connection pooling with an Agent, defaults request to Connection: close.
	keepAlive: {Boolean} Keep sockets around in a pool to be used by other requests in the future. Default = false
	keepAliveMsecs: {Integer} When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive. Default = 1000. Only relevant if keepAlive is set to true.
	
	Plus my "options" values:
	-----------------------------------------------------------------
	quiet: If true will not print to console. Defaults false.
	ssl: Iff false will use http instead of https. Defaults true.
	timeout: Integer in milliseconds to time out requests. Defaults 20,000
	cb: Node.js call back style of cb(error_obj, response).
	success: jQuery call back style of success(statusCode, response)
	failure: jQuery call back style of failure(statusCode, response)
	include_headers: If true the response argument will be {"response":<response>, "headers":<headers>} 
*/

var https_mod = require('https');
var http_mod = require('http');
var default_options = 	{
							quiet: false,
							ssl: true,
							timeout: 20000,
							include_headers: false
						};

//is the obj empty or not
function isEmpty(obj) {
	for(var prop in obj) {
		if(obj.hasOwnProperty(prop))
			return false;
	}
	return true;
}

//merge fields in obj B to obj A only if they don't exist in obj A
function mergeBtoA(b, a){
	for(var i in b){
		if(a[i] === undefined) {
			//console.log(' - copying');
			a[i] = b[i];
			//a[i] = JSON.parse(JSON.stringify(b[i]));
		}
		//else console.log(' - not copying');
	}
	return a;
}

//main http request builder/handler/thingy
function http(options, parameters, body){
	var acceptJson = false, jQuery = false, nodeJs = false, http, http_txt = '', goodJSON = false;
	var ids = 'abcdefghijkmnopqrstuvwxyz';
	var id = ids[Math.floor(Math.random() * ids.length)];										//random letter to help id calls when there are multiple rest calls
	options = mergeBtoA(default_options, options);
	
	//// Handle Call Back ////
	function success(statusCode, headers, resp){												//go to success callback
		if(options.include_headers) resp = {response:resp, headers: headers};
		if(jQuery) options.success(statusCode, resp);
		else if(nodeJs) options.cb(null, resp);													//if neither callback set, don't do either
	}
	
	function failure(statusCode, headers, msg){													//go to failure callback
		if(options.include_headers) msg = {response:msg, headers: headers};
		if(jQuery) options.failure(statusCode, msg);
		else if(nodeJs) options.cb(statusCode, msg);											//if neither callback set, don't do either
	}
	
	if(typeof(options.ssl) === 'undefined' || options.ssl) {									//if options.ssl not found or true use https
		http = https_mod;
		http_txt = '[https ' + options.method + ' - ' + id + ']';
	}
	else {
		http = http_mod;																		//if options.ssl == false use http
		http_txt = '[http ' + options.method + ' - ' + id + ']';
	}
	if(!options.quiet) console.log(http_txt + ' ' + options.path);
	
	//// Sanitize Inputs ////
	var querystring = require('querystring');													//convert all header keys to lower-case for easier parsing
	for(var i in options.headers) {
		var temp = options.headers[i];
		delete options.headers[i];
		if(temp != null){
			options.headers[i.toLowerCase()] = temp;
		}
	}
	
	if(typeof body == 'object'){
		if(options.headers) options.headers['content-type'] = 'application/json';
		else options.headers = {'content-type': 'application/json'};
		body = JSON.stringify(body);																//stringify body
	}
	
	if(options.headers && options.headers['accept'] && options.headers['accept'].toLowerCase().indexOf('json') >= 0) acceptJson = true;
	if(options.success && options.failure) jQuery = true;
	else if(options.cb) nodeJs = true;

	if(body){
		if(options.headers) options.headers['content-length'] = Buffer.byteLength(body);
		else options.headers = {'content-lenght': Buffer.byteLength(body)};
	}
	//else if(options.headers['content-length']) delete options.headers['content-length'];			//we don't need you
	
	if(!options.quiet && options.method.toLowerCase() !== 'get') {
		console.log('  body:', body);
	}
		
	//// Handle Request ////
	if(typeof parameters == 'object') options.path += '?' + querystring.stringify(parameters);		//should be a json object
	var request = http.request(options, function(resp) {
		var str = '', temp, chunks = 0;
		if(!options.quiet) console.log(http_txt + ' Status code: ' + resp.statusCode);
		
		resp.setEncoding('utf8');
		resp.on('data', function(chunk) {															//merge chunks of request
			str += chunk;
			chunks++;
		});
		resp.on('end', function() {																	//wait for end before decision
			if(resp.statusCode == 204){																//empty response, don't parse body
				if(!options.quiet) console.log(http_txt + ' Data: No Content');
				success(resp.statusCode, resp.headers, str);
			}
			else if(resp.statusCode >= 200 && resp.statusCode <= 399){								//check status codes
				if(acceptJson){
					try{
						temp = JSON.parse(str);
						goodJSON = true;
					}
					catch(e){
						goodJSON = false;
						if(!options.quiet) console.log(http_txt + ' Error - response is not JSON: ', str);
						failure(500, resp.headers, 'Invalid JSON response: ' + str);
					}
					if(goodJSON){
						//if(!options.quiet) console.log(http_txt + ' Data:', str);					//all good [json resp]
						success(resp.statusCode, resp.headers, temp);
					}
				}
				else {																				//all good [not json resp]
					if(!options.quiet) console.log(http_txt + ' Data:', str);
					success(resp.statusCode, resp.headers, str);
				}
			}
			else {
				if(!options.quiet) console.log(http_txt + ' Error - status code: ' + resp.statusCode, str);
				if(acceptJson){
					try{
						str = JSON.parse(str);														//attempt to parse error for JSON
					}
					catch(e){}
				}
				failure(resp.statusCode, resp.headers, str);
			}
		});
	});
	
	request.on('error', function(e) {																//handle error event
		if(!options.quiet) console.log(http_txt + ' Error - unknown issue with request: ', e);		//catch failed request (failed DNS lookup and such)
		failure(500, null, e);
	});
	
	request.setTimeout(Number(options.timeout) || default_options.timeout);
	request.on('timeout', function(){																//handle time out event
		if(!options.quiet) console.log(http_txt + ' Error - request timed out');
		failure(408, null, 'Request timed out');
		request.destroy();
	});
	
	if(body && body !== '' && !isEmpty(body)){
		request.write(body);
	}
	request.end();																					//send the request
}

//load new default option values
module.exports.init = function(opt){
	for(var i in opt){
		default_options[i] = opt[i];
	}
};

//http post
module.exports.post = function (l_options, parameters, body){
	l_options.method = 'POST';
	http(l_options, parameters, body);
};

//http put
module.exports.put = function (l_options, parameters, body){
	l_options.method = 'PUT';
	http(l_options, parameters, body);
};

//http delete
module.exports.delete = function (l_options, parameters, body){
	l_options.method = 'DELETE';
	http(l_options, parameters, body);
};

//http get
module.exports.get = function (l_options, parameters){
	l_options.method = 'GET';
	http(l_options, parameters, '');
};

//http head
module.exports.head = function (l_options, parameters){
	l_options.method = 'HEAD';
	http(l_options, parameters, '');
};

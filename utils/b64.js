"use strict";
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
	Version: 0.1
	Updated: 7/16/2015
	-------------------------   Base 64 Encoding Wrapper   -------------------------
	Description: This is a very simple module for converting strings to and from base 64 encoding
	
	Use:	var b64 = require('./b64');
			var input = "hello there";
			var base64EncodedStr = b64.to(input);					//encode it to base64 string
			var decodedStr = b64.from(base64EncodedStr);			//decode it from base64 string to ascii string
			console.log(input, base64EncodedStr, decodedStr);
	---------------------------------------------------------------------------------
*/

exports.to = function (str){
	if(typeof str != 'string') return null;
	return new Buffer(str).toString('base64');
};

exports.from = function (b64str, encoding){						//encoding defaults to ascii.  Other valid options are hex, utf8, utf16le, ucs2, base64, binary
	if(typeof b64str != 'string') return null;
	if(encoding == null) encoding = 'ascii';
	return new Buffer(b64str, 'base64').toString(encoding);
};


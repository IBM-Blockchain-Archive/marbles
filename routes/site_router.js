"use strict";
/* global process */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
var express = require('express');
var router = express.Router();
var base64  = require('base64-js');
var fs = require("fs");

// Load our modules.
var aux     = require("./site_aux.js");
var rest    = require("../utils/rest.js");
var b64     = require("../utils/b64.js");


// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function(req, res){
	var cc = {};
	try{
		cc = require('../utils/temp/cc.json');
	}
	catch(e){
		console.log('error loading cc.json', e);
	};
	res.render('home', {title: 'Home', bag: cc} );
});


// ============================================================================================================================
// Chain Code Investigator
// ============================================================================================================================
router.route("/investigate").get(function(req, res){
	var cc = {};
	try{
		cc = require('../utils/temp/cc.json');
	}
	catch(e){
		console.log('error loading cc.json', e);
	};
	res.render('investigate', {title: 'Investigator', bag: cc} );
});


module.exports = router;
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
var fs = require("fs");
var setup = require('../setup.js');

// Load our modules.
var aux     = require("./site_aux.js");
var rest    = require("../utils/rest.js");

// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function(req, res){
	res.render('home', {title: 'Home', bag: {setup: setup}} );
});


// ============================================================================================================================
// Chain Code Investigator
// ============================================================================================================================
router.route("/cci").get(function(req, res){
	var cc = {};
	try{
		cc = require('../chaincode.json');
	}
	catch(e){
		console.log('error loading cc.json', e);
	};
	res.render('investigate', {title: 'Investigator', bag: {cc: cc, setup: setup}} );
});

module.exports = router;
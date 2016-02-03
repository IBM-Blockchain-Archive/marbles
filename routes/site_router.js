/* global __dirname */
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
var path = require('path');

// Load our modules.
var aux     = require("./site_aux.js");
var rest    = require("../utils/rest.js");

// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function(req, res){
	res.redirect('/app1');
});

// ============================================================================================================================
// App 1
// ============================================================================================================================
router.route("/app1").get(function(req, res){
	res.render('app1', {title: 'SimpleStuff App1', bag: {setup: setup}} );
});

// ============================================================================================================================
// App 2
// ============================================================================================================================
router.route("/app2").get(function(req, res){
	res.render('app2', {title: 'SimpleStuff App2', bag: {setup: setup}} );
});


// ============================================================================================================================
// Chaincode Summary File List
// ============================================================================================================================
router.route("/cc/summary").get(function(req, res){
	fs.readdir('./cc_summaries/', cb_got_names);											//get file names
	function cb_got_names(err, obj){
		res.status(200).json(obj);
	}
});

// ============================================================================================================================
// Chaincode Investigator
// ============================================================================================================================
router.route("/cci/:filename?").get(function(req, res){
	var cc = {};
	if(req.params.filename){
		try{
			console.log('loading cc summary:', req.params.filename);
			cc = require('../cc_summaries/' + req.params.filename + '.json');
		}
		catch(e){
			console.log('error loading chaincode summary file', e);
		};
	}
	res.render('investigate', {title: 'Investigator', bag: {cc: cc, setup: setup}} );
});

module.exports = router;
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

// Load our modules.
var aux     = require("./site_aux.js");
var rest    = require("../utils/rest.js");

var Obc1 = require('../utils/obc-js/index');
var obc = new Obc1();
var contract = {};
var options = 	{
					zip_url: 'https://codeload.github.com/dshuffma-ibm/simplestuff/zip/master',
					dir: 'simplestuff-master',
					git_url: 'https://github.com/dshuffma-ibm/simplestuff',
					name: 'ba0c1e910af1b479c606e5295050499f3d558ebb78a49a489af437f17ea59025c56e990a1652893437f578a9aca449974e70d54e0fd2d1b942f46b4a81a55425'
				};
//obc.load(options, cb_ready2);				//parse/load chaincode
function cb_ready2(err, cc){
	contract = cc;
	obc.save('./');
};
// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function(req, res){
	res.render('home', {title: 'Home', bag: {}} );
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
	res.render('investigate', {title: 'Investigator', bag: {cc: cc}} );
});


// ============================================================================================================================
// Create
// ============================================================================================================================
/*router.route("/create").post(function(req, res){
	//console.log('!', req.body);
	var errors = [];
	
	if(!req.body || !req.body.name) errors.push('name is requied');
	if(!req.body || !req.body.color) errors.push('color is requied');
	if(!req.body || !req.body.size) errors.push('size is requied');
	if(!req.body || !req.body.user) errors.push('user is requied');
	
	if(errors.length > 0){
		res.render('home', {title: 'Home', bag: {body: req.body}} );
	}
	else{
		contract.init_ball([req.body.name, req.body.color, req.body.size, req.body.user], cb_invoke);
		
	}
	function cb_invoke(e, a){
		console.log('?', e, a);
		res.render('home', {title: 'Home', bag: {body: req.body}} );
	}
});
*/
module.exports = router;
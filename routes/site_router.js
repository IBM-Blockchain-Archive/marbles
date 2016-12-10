'use strict';
/* global process */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 *******************************************************************************/
var express = require('express');
var router = express.Router();

//anything in here gets passed to JADE template engine
function build_bag(req){
	return {
				session: req.session.user,					//pass session info
				e: process.error,							//send any setup errors
				jshash: process.env.cachebust_js,			//js cache busting hash (not important)
				csshash: process.env.cachebust_css,			//css cache busting hash (not important)
				marble_company: process.env.marble_company,
				creds: get_credential_data()
			};
}

//get cred data
function get_credential_data(){
	var helper = require(__dirname + '/../utils/helper.js')(process.env.creds_filename, console);
	var ret =	{
					admin_id: helper.getUsers(0).enrollId,
					admin_secret: helper.getUsers(0).enrollSecret,
					orderer: helper.getOrderersUrl(0),
					cop: helper.getMemberservicesUrl(0),
					peer: helper.getPeersUrl(0),
					chaincode_id: helper.getChaincodeId(),
					marble_owners: helper.getMarbleUsers()
				};
	for(var i in ret){
		if(ret[i] == null) ret[i] = '';			//set to blank if not found
	}
	return ret;
}

function toTitleCase(str){
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// ============================================================================================================================
// Root
// ============================================================================================================================
router.route('/').get(function(req, res){
	res.redirect('/home');
});

// ============================================================================================================================
// Login
// ============================================================================================================================
router.route('/login').get(function(req, res){
	res.render('login', {title: 'Marbles - Login', bag: build_bag(req)});
});

router.route('/login').post(function(req, res){
	req.session.user = {username: toTitleCase(req.body.username)};
	res.redirect('/home');
});

router.route('/logout').get(function(req, res){
	req.session.destroy();
	res.redirect('/login');
});


// ============================================================================================================================
// Home
// ============================================================================================================================
router.route('/home').get(function(req, res){
	route_me(req, res);
});

router.route('/create').get(function(req, res){
	route_me(req, res);
});

function route_me(req, res){
	if(!req.session.user || !req.session.user.username){
		res.redirect('/login');
	}
	else{
		res.render('marbles', {title: 'Marbles - Home', bag: build_bag(req)});
	}
}

// ============================================================================================================================
// Part 2
// ============================================================================================================================
router.route('/p2').get(function(req, res){
	res.render('part2', {title: 'Marbles Part 2', bag: build_bag(req)});
});
router.route('/p2/:page?').get(function(req, res){
	res.render('part2', {title: 'Marbles Part 2', bag: build_bag(req)});
});

module.exports = router;
'use strict';
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
var setup = require('../setup.js');

//anything in here gets passed to JADE template engine
function build_bag(req){
	return {
				session: req.session.user,					//pass session info
				setup: setup,								//static vars for configuration settings
				e: process.error,							//send any setup errors
				jshash: process.env.cachebust_js,			//js cache busting hash (not important)
				csshash: process.env.cachebust_css,			//css cache busting hash (not important)
				marble_company: process.env.marble_company
			};
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
	req.session.user = {username: req.body.username};
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
	if(!req.session.user || !req.session.user.username){
		res.redirect('/login');
	}
	else{
		res.render('marbles', {title: 'Marbles - Home', bag: build_bag(req)});
	}
});

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
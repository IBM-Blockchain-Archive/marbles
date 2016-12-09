/* global process */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
//Environments are either:
// 	1 - Bluemix Production
// 	2 - Bluemix Development
// 	3 - Localhost Development

var vcap_app = {application_uris: ['']};						//default blank
var ext_uri = '';
if(process.env.VCAP_APPLICATION){
	vcap_app = JSON.parse(process.env.VCAP_APPLICATION);
	for(var i in vcap_app.application_uris){
		if(vcap_app.application_uris[i].indexOf(vcap_app.name) >= 0){
			ext_uri = vcap_app.application_uris[i];
		}
	}
}
////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////    1. Bluemix Production    ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
if(process.env.VCAP_APP_HOST && process.env.PRODUCTION){
	exports.SERVER = 	{
							HOST: process.env.VCAP_APP_HOST,
							PORT: process.env.VCAP_APP_PORT,
							DESCRIPTION: 'Bluemix - Production',
							EXTURI: ext_uri,		//no longer used 4/29/2016
						};
}

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////    2. Bluemix Development    ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
else if(process.env.VCAP_APP_HOST){
		exports.SERVER = 	{
								HOST: process.env.VCAP_APP_HOST,
								PORT: process.env.VCAP_APP_PORT,
								DESCRIPTION: 'Bluemix - Development',
								EXTURI: ext_uri,		//no longer used 4/29/2016
							 };
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////     3. Localhost - Development    ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
else{
	exports.SERVER = 	{
							HOST:'localhost',
							PORT: process.env.marble_port || 3000,
							DESCRIPTION: 'Localhost',
							EXTURI: 'localhost:3000',	//no longer used 4/29/2016
						 };
}

exports.SERVER.vcap_app = vcap_app;

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////     Common     ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
exports.DEBUG = vcap_app;
/*
var marbles_users = ['unknown1', 'unknown2'];
try{
	marbles_users = JSON.parse(process.env.marbles_users);
}
catch(e){
	console.log('build_marbles_users is not json', e);
}
exports.USER1 = marbles_users[0];				//left username
exports.USER2 = marbles_users[1];				//right username
*/
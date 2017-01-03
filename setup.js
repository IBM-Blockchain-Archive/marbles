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
if(process.env.PORT && process.env.PRODUCTION){
	exports.SERVER = 	{	
							HOST: '0.0.0.0',
							PORT: process.env.PORT,
							DESCRIPTION: 'Bluemix - Production',
							EXTURI: ext_uri,		//no longer used 4/29/2016
						};
}

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////    2. Bluemix Development    ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
else if(process.env.PORT){
		exports.SERVER = 	{	
								HOST: '0.0.0.0',
								PORT: process.env.PORT,
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
							PORT: 3000,
							DESCRIPTION: 'Localhost',
							EXTURI: 'localhost:3000',	//no longer used 4/29/2016
						 };
}

exports.SERVER.vcap_app = vcap_app;

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////     Common     ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
exports.DEBUG = vcap_app;
exports.USER1 = 'bob';									//left username
exports.USER2 = 'leroy';								//right username
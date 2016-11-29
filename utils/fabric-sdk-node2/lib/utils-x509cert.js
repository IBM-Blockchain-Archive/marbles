/*
 Copyright 2016 IBM All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

	  http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

var _asn1js = require('asn1js');
var common = require('asn1js/org/pkijs/common');
var _pkijs = require('pkijs');
var _x509schema = require('pkijs/org/pkijs/x509_schema');
var merge = require('node.extend');

/**
 * Abstract Syntax Notation One (ASN.1) is a standard and notation that describes
 * rules and structures for representing, encoding, transmitting, and decoding data
 * in telecommunications and computer networking
 *
 *
 */
module.exports = function() {
	// #region Merging function/object declarations for ASN1js and PKIjs
	var asn1js = merge(true, _asn1js, common);
	var x509schema = merge(true, _x509schema, asn1js);
	var pkijs_1 = merge(true, _pkijs, asn1js);
	var pkijs = merge(true, pkijs_1, x509schema);

	return pkijs;
};

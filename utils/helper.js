var fs = require('fs');
var url = require('url');
var path = require('path');
var crypto = require('crypto');

module.exports = function (config_filename, logger) {
	var helper = {};
	var creds_path = path.join(__dirname, '../config/' + config_filename);
	helper.creds = require(creds_path);

	//hash of credential json file
	helper.getHash = function(){
		var shasum = crypto.createHash('sha1');
		shasum.update(JSON.stringify(helper.creds));
		return shasum.digest('hex').toString();
	};

//	console.log('Creds = ', helper.creds);
	helper.getNetworkId = function() {
		return helper.creds.credentials.network_id;
	};

	helper.getPeers = function (index) {
		if (index === undefined || index == null) {
			return helper.creds.credentials.peers;
		} else {
			if (index < helper.creds.credentials.peers.length) {
				return helper.creds.credentials.peers;
			} else {
				throw new Error('Peer index out of bounds. Total peers = ' + helper.creds.credentials.peers.length);
			}
		}
	};

	helper.getPeersUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peer index not passed');
		}
		else {
			if (index < helper.creds.credentials.peers.length) {
				//console.log('Peer = ', helper.creds.credentials.peers[index]);
				return 'grpc://' + helper.creds.credentials.peers[index].grpc_host + ':' + helper.creds.credentials.peers[index].grpc_port;
			}
			else {
				throw new Error('Peer index out of bounds. Total peers = ' + helper.creds.credentials.peers.length);
			}
		}
	};

	helper.getMemberservices = function (index) {
		if (index === undefined || index == null) {
			return helper.creds.credentials.memberservices;
		}
		else {
			if (index < helper.creds.credentials.memberservices.length) {
				return helper.creds.credentials.memberservices[index];
			}
			else {
				throw new Error('Member Services index out of bounds. Total member services = '	+ helper.creds.credentials.memberservices.length);
			}
		}
	};

	helper.getMemberservicesUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Member Services index not passed');
		} else {
			if (index < helper.creds.credentials.memberservices.length) {
				return 'http://' + helper.creds.credentials.memberservices[index].host + ':' + helper.creds.credentials.memberservices[index].port;
			} else {
				throw new Error('Member Services index out of bounds. Total member services = ' + helper.creds.credentials.memberservices.length);
			}
		}
	};

	helper.getOrderers = function (index) {
		if (index === undefined || index == null) {
			return helper.creds.credentials.orderers;
		}
		else {
			if (index < helper.creds.credentials.orderers.length) {
				return helper.creds.credentials.orderers[index];
			}
			else {
				throw new Error('Orderers index out of bounds. Total member services = '	+ helper.creds.credentials.orderers.length);
			}
		}
	};

	helper.getOrderersUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Orderers index not passed');
		} else {
			if (index < helper.creds.credentials.orderers.length) {
				return 'grpc://' + helper.creds.credentials.orderers[index].host + ':' + helper.creds.credentials.orderers[index].port;
			} else {
				throw new Error('Orderers index out of bounds. Total member services = ' + helper.creds.credentials.orderers.length);
			}
		}
	};

	helper.getUsers = function (index) {
		if (index === undefined || index == null) {
			return helper.creds.credentials.users;
		}
		else {
			if (index < helper.creds.credentials.users.length) {
				return helper.creds.credentials.users[index];
			}
			else {
				throw new Error('Users index out of bounds. Total member services = '	+ helper.creds.credentials.users.length);
			}
		}
	};

	helper.getChaincodeId = function () {
		return getMarblesField('chaincode_id');
	};

	helper.write = function(obj){
		var creds_file = JSON.parse(fs.readFileSync(creds_path, 'utf8'));
		var parsed = '';
		console.log('hey there', obj);

		if(obj.ordererUrl){
			parsed = url.parse(obj.ordererUrl, true);
			creds_file.credentials.orderers[0].host = parsed.hostname;
			creds_file.credentials.orderers[0].port = Number(parsed.port);
		}
		if(obj.peerUrl){
			parsed = url.parse(obj.peerUrl, true);
			creds_file.credentials.peers[0].grpc_host = parsed.hostname;
			creds_file.credentials.peers[0].grpc_port = Number(parsed.port);
		}
		if(obj.copUrl){
			parsed = url.parse(obj.copUrl, true);
			creds_file.credentials.memberservices[0].host = parsed.hostname;
			creds_file.credentials.memberservices[0].port = Number(parsed.port);
		}
		if(obj.chaincodeId){
			creds_file.credentials.marbles.chaincode_id = obj.chaincodeId;
		}
		if(obj.enrollId && obj.enrollSecret){
			creds_file.credentials.users[0] = 	{
													enrollId: obj.enrollId, 
													enrollSecret: obj.enrollSecret
												};
		}
		fs.writeFileSync(creds_path, JSON.stringify(creds_file, null, 4), 'utf8');							//save to file
		helper.creds = creds_file;													//replace old copy
	};

	helper.getMarbleUsers = function(){
		return getMarblesField('marbles_users');
	};

	helper.getCompanyName = function(){
		return getMarblesField('company');
	};

	helper.getMarblesPort = function(){
		return getMarblesField('port');
	};

	//safely retrieve marbles fields
	function getMarblesField(marbles_field){
		try{
			if(helper.creds.credentials.marbles[marbles_field]) {
				return helper.creds.credentials.marbles[marbles_field];
			}
			else {
				console.log('Error - "' + marbles_field +'" not found in creds json');
				return null;
			}
		}
		catch(e){
			console.log('Error - "' + marbles_field +'" not found in creds json');
			return null;
		}
	}

	return helper;
};

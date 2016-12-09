var fs = require('fs');
var url = require('url');
var path = require('path');

module.exports = function (logger) {
	var helper = {};
	var creds_path = path.join(__dirname, '../mycreds.json');
	helper.creds = require(creds_path);

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
		if(helper.creds.credentials.chaincode_id) return helper.creds.credentials.chaincode_id;
		else return null;
	};

	helper.write = function(obj){
		var creds_file = JSON.parse(fs.readFileSync(creds_path, 'utf8'));
		var parsed = '';
		console.log('hey there', obj);

		if(obj.ordererUrl){
			parsed = url.parse(obj.ordererUrl, true);
			creds_file.credentials.orderers[0].host = parsed.host;
			creds_file.credentials.orderers[0].port = parsed.port;
		}
		if(obj.peerUrl){
			parsed = url.parse(obj.peerUrl, true);
			creds_file.credentials.peers[0].grpc_host = parsed.host;
			creds_file.credentials.peers[0].grpc_port = parsed.port;
		}
		if(obj.chaincodeId){
			console.log('yes');
			creds_file.credentials.chaincode_id = obj.chaincodeId;
		}

		fs.writeFileSync(creds_path, JSON.stringify(creds_file, null, 4), 'utf8');							//save to file
		helper.creds = creds_file;													//replace old copy
	};

	return helper;
};

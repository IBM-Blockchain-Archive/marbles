
module.exports = function (logger) {

	var helper = {}
	helper.creds = require(__dirname + '/../mycreds.json');

//	console.log('Creds = ', helper.creds);
	helper.getNetworkId = function() {
		return helper.creds.credentials.network_id;
	}

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
	}

	helper.getPeersUrl = function (index) {
		if (index === undefined || index == null) {
			throw new Error('Peer index not passed');
		}
		else {
			if (index < helper.creds.credentials.peers.length) {
				console.log('Peer = ', helper.creds.credentials.peers[index]);
				return 'grpc://' + helper.creds.credentials.peers[index].grpc_host + ':' + helper.creds.credentials.peers[index].grpc_port;
			}
			else {
				throw new Error('Peer index out of bounds. Total peers = ' + helper.creds.credentials.peers.length);
			}
		}
	}

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
	}

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
	}

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
	}

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
	}

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
	}

	return helper;
};

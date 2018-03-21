// ============================================================================================================================
// 												Get peer fields from connection profile data
// ============================================================================================================================
module.exports = function (cp, logger) {
	const helper = {};

	// find the first peer in the peers field for this org
	helper.getFirstPeerName = function (ch) {
		const channel = cp.creds.channels[ch];
		if (channel && channel.peers) {
			const peers = Object.keys(channel.peers);
			if (peers && peers[0]) {
				return peers[0];
			}
		}
		throw new Error('Peer not found on this channel', ch);
	};

	// get a peer object
	helper.getPeer = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer key not passed');
		}
		else {
			if (cp.creds.peers) {
				return cp.creds.peers[key];
			}
			else {
				return null;
			}
		}
	};

	// get a peer's grpc url
	helper.getPeersUrl = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer key not passed');
		}
		else {
			let peer = helper.getPeer(key);
			if (peer) {
				return peer.url;
			}
			else {
				throw new Error('Peer key not found.');
			}
		}
	};

	// get all peers grpc urls and event urls, on this channel
	helper.getAllPeerUrls = function (channelId) {
		let ret = {
			urls: [],
			eventUrls: []
		};
		if (cp.creds.channels && cp.creds.channels[channelId]) {
			for (let peerId in cp.creds.channels[channelId].peers) {	//iter on the peers on this channel
				ret.urls.push(cp.creds.peers[peerId].url);				//get the grpc url for this peer
				ret.eventUrls.push(cp.creds.peers[peerId].eventUrl);	//get the grpc EVENT url for this peer
			}
		}
		return ret;
	};

	// get a peer's grpc event url
	helper.getPeerEventUrl = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer key not passed');
		} else {
			let peer = helper.getPeer(key);
			if (peer) {
				return peer.eventUrl;
			}
			else {
				throw new Error('Peer key not found.');
			}
		}
	};

	// get a peer's tls options
	helper.getPeerTlsCertOpts = function (key) {
		if (key === undefined || key == null) {
			throw new Error('Peer\'s key not passed');
		} else {
			let peer = helper.getPeer(key);
			return cp.buildTlsOpts(peer);
		}
	};

	return helper;
};

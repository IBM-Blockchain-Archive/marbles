// ------------------------------------------------------------------------
// HA Functions (HA = High Availability) aka try another peer/orderer
// ------------------------------------------------------------------------
// - Remember the last peer we used that worked. Keep using this peer as long as it works.
// - If the peer has crashed, switch to the next peer.
// - Keep trying peers until we have looped through all the peers.

module.exports = function (logger) {
	var Peer = require('fabric-client/lib/Peer.js');
	var ha = {};
	ha.success_peer_position = 0;								//the last peer position that was successful
	ha.using_peer_position = 0;									//the peer array position to use for the next request

	// Change what peer the SDK is using
	/*
		options: {
					peer_url: 'peer grpc url',
					peer_tls_opts: {
						pem: 'complete tls certificate',					<required if using ssl>
						common_name: 'common name used in pem certificate' 	<required if using ssl>
					},
		}
	*/
	ha.use_peer = function (obj, options) {
		try {
			logger.debug('Adding peer to sdk client', options.peer_url);
			obj.channel.addPeer(new Peer(options.peer_url, {
				pem: options.peer_tls_opts.pem,
				'ssl-target-name-override': options.peer_tls_opts.common_name	//can be null if cert matches hostname
			}));
		}
		catch (e) {
			//might error if peer already exists, but we don't care
		}
	};

	// Switch to Another Peer - returns null if there IS another peer to switch to
	/*
		options: {
					peer_urls: ['array of peer grpc urls'],
					peer_tls_opts: {
						pem: 'complete tls certificate',					<required if using ssl>
						common_name: 'common name used in pem certificate' 	<required if using ssl>
					},
		}
	*/
	ha.switch_peer = function (obj, options) {
		if (!options || !options.peer_urls || !options.peer_tls_opts) {
			logger.error('Missing options for switch_peer()');
			return { error: 'Missing options for switch_peer()' };
		}

		try {																	//remove current peer
			logger.debug('Removing peer from sdk   ', options.peer_urls[ha.using_peer_position]);
			obj.channel.removePeer(new Peer(options.peer_urls[ha.using_peer_position], options.peer_tls_opts));
		} catch (e) {
			logger.error('could not remove peer from sdk client', e);
		}

		ha.using_peer_position++;
		if (ha.using_peer_position >= options.peer_urls.length) {					//wrap around
			ha.using_peer_position = 0;
		}

		if (ha.using_peer_position === ha.success_peer_position) {					//we've tried all peers, error out
			logger.error('Exhausted all peers. There are no more peers to try.');
			return { error: 'Exhausted all peers.' };
		} else {
			const temp = {
				peer_url: options.peer_urls[ha.using_peer_position],
				peer_tls_opts: options.peer_tls_opts
			};
			ha.use_peer(obj, temp);
			return null;
		}
	};

	return ha;
};

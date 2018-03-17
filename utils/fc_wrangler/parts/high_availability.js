// ------------------------------------------------------------------------
// HA Functions (HA = High Availability) aka try another peer/CAs
// ------------------------------------------------------------------------
// - Remember the last peer we used that worked. Keep using this peer as long as it works.
// - If the peer has crashed, switch to the next peer.
// - Keep trying peers until we have looped through all the peers.

module.exports = function (logger) {
	var Peer = require('fabric-client/lib/Peer.js');
	var ha = {};
	ha.success_peer_position = 0;								//the last peer position that was successful
	ha.using_peer_position = 0;									//the peer array position to use for the next request
	ha.success_ca_position = 0;									//the last ca position that was successful
	ha.using_ca_position = 0;									//the ca array position to use for the next enrollment

	// ------------------------------------------------------------------------
	// Change what peer the SDK is using
	/*
		options: {
					peer_url: 'peer grpc url',
					peer_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					},
		}
	*/
	// ------------------------------------------------------------------------
	ha.use_peer = function (obj, options) {
		try {
			logger.debug('Adding peer to sdk client', options.peer_url);
			obj.channel.addPeer(new Peer(options.peer_url, options.peer_tls_opts));
		}
		catch (e) {
			//might error if peer already exists, but we don't care
		}
	};

	// ------------------------------------------------------------------------
	// Switch to Another Peer - returns null if there IS another peer to switch to
	/*
		options: {
					peer_urls: ['array of peer grpc urls'],
					event_urls: ['array of peer grpc EVENT urls'],							<optional> only used for invoke
					peer_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					},
		}
	*/
	// ------------------------------------------------------------------------
	ha.switch_peer = function (obj, options) {
		if (!options || !options.peer_urls || !options.peer_tls_opts) {
			logger.error('Missing options for switch_peer()');
			return { error: 'Missing options for switch_peer()' };
		}
		let next_peer_position = ha.using_peer_position + 1;
		if (next_peer_position >= options.peer_urls.length) {						//wrap around
			next_peer_position = 0;
		}

		// --- Tried All Peers --- //
		if (next_peer_position === ha.success_peer_position) {						//we've tried all peers, error out
			logger.error('Exhausted all peers. There are no more peers to try.');
			return { error: 'Exhausted all peers.' };

		} else {

			try {																	//remove current peer
				logger.warn('Switching peers!', ha.using_peer_position, next_peer_position);
				logger.debug('Removing peer from sdk client', options.peer_urls[ha.using_peer_position]);
				obj.channel.removePeer(new Peer(options.peer_urls[ha.using_peer_position], options.peer_tls_opts));
			} catch (e) {
				logger.error('Could not remove peer from sdk client', e);
			}

			// --- Use Next Peer --- //
			ha.using_peer_position = next_peer_position;
			const temp = {
				peer_url: options.peer_urls[ha.using_peer_position],
				peer_tls_opts: options.peer_tls_opts
			};
			ha.use_peer(obj, temp);
			return null;
		}
	};

	// ------------------------------------------------------------------------
	// Get the Event URl to use - returns null if there are NO urls
	/*
		options: {
					event_urls: ['array of peer grpc EVENT urls'],			only used for invoke
		}
	*/
	// ------------------------------------------------------------------------
	ha.get_event_url = function (options) {
		let ret = null;
		if (options && options.event_urls && options.event_urls[ha.using_peer_position]) {
			ret = options.event_urls[ha.using_peer_position];
		}
		logger.debug('[fcw] setting target event url', ret);
		return ret;
	};

	// ------------------------------------------------------------------------
	// Get the Next Certificate Authority - returns options to use for enrollment if there IS another CA to switch to
	/*
		options: {
					ca_urls: ['array of ca grpc urls'],
					ca_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					},
		}
	*/
	// ------------------------------------------------------------------------
	ha.get_next_ca = function (options) {
		if (!options || !options.ca_urls || !options.ca_tls_opts) {
			logger.error('Missing options for get_next_ca()');
			return null;
		}

		ha.using_ca_position++;
		if (ha.using_ca_position >= options.ca_urls.length) {				//wrap around
			ha.using_ca_position = 0;
		}

		if (ha.using_ca_position === ha.success_ca_position) {				//we've tried all ca, error out
			logger.error('Exhausted all CAs. There are no more CAs to try.');
			return null;
		} else {
			return ha.get_ca(options);
		}
	};

	// ------------------------------------------------------------------------
	// Get the Current Certificate Authority - returns options for enrollment
	/*
		options: {
					ca_urls: ['array of ca grpc urls'],
					ca_tls_opts: {
						pem: 'complete tls certificate',									<required if using ssl>
						ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
						grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
						grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
					},
		}
	*/
	// ------------------------------------------------------------------------
	ha.get_ca = function (options) {
		if (!options || !options.ca_urls || !options.ca_tls_opts) {
			logger.error('Missing options for get_ca()');
			return null;
		}

		options.ca_url = options.ca_urls[ha.using_ca_position];			//use this CA
		//options.ca_tls_opts = options.ca_tls_opts;					//dsh todo get the array, return the right one
		//options.ca_name = options.ca_name;							//dsh todo get the array, return the right one
		return options;
	};

	return ha;
};

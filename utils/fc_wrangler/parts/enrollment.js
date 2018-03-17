//-------------------------------------------------------------------
// Enrollment HFC Library
//-------------------------------------------------------------------

module.exports = function (logger) {
	var FabricClient = require('fabric-client');
	var path = require('path');
	var common = require(path.join(__dirname, './common.js'))(logger);
	var enrollment = {};
	var User = require('fabric-client/lib/User.js');
	var CaService = require('fabric-ca-client/lib/FabricCAClientImpl.js');
	var Orderer = require('fabric-client/lib/Orderer.js');
	var Peer = require('fabric-client/lib/Peer.js');
	FabricClient.setConfigSetting('request-timeout', 90000);

	//-----------------------------------------------------------------
	// Enroll an enrollId with the ca - use this for query/invoke chaincode
	//-----------------------------------------------------------------
	/*
		options = {
			peer_urls: ['array of peer grpc urls'],
			channel_id: 'channel name',
			uuid: 'unique name for this enrollment',
			ca_url: 'http://urlhere:port',
			ca_name: 'name of ca tou use, not used if ca's not in a hierarchy
			orderer_url: 'grpc://url_here:port',
			enroll_id: 'enrollId',
			enroll_secret: 'enrollSecret',
			msp_id: 'string',
			ca_tls_opts: {
				pem: 'complete tls certificate',									<required if using ssl>
				ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
				grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
				grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
			},
			orderer_tls_opts: {
				pem: 'complete tls certificate',									<required if using ssl>
				ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
				grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
				grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
			},
			peer_tls_opts: {
				pem: 'complete tls certificate',									<required if using ssl>
				ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
				grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
				grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
			}
			kvs_path: '/path/to/the/key/value/store'
		}
	*/

	enrollment.enroll = function (options, cb) {
		var client = new FabricClient();
		var channel = client.newChannel(options.channel_id);

		var debug = {														// this is just for console printing, no PEM here
			peer_urls: options.peer_urls,
			channel_id: options.channel_id,
			uuid: options.uuid,
			ca_url: options.ca_url,
			orderer_url: options.orderer_url,
			enroll_id: options.enroll_id,
			enroll_secret: options.enroll_secret,
			msp_id: options.msp_id,
			kvs_path: options.kvs_path
		};
		logger.info('[fcw] Going to enroll', debug);

		// Make eCert kvs (Key Value Store)
		FabricClient.newDefaultKeyValueStore({
			path: options.kvs_path 							//store crypto in the kvs directory
		}).then(function (store) {
			client.setStateStore(store);
			return getSubmitter(client, options);			//do most of the work here
		}).then(function (submitter) {

			channel.addOrderer(new Orderer(options.orderer_url, options.orderer_tls_opts));

			channel.addPeer(new Peer(options.peer_urls[0], options.peer_tls_opts));
			logger.debug('added peer', options.peer_urls[0]);

			// --- Success --- //
			logger.debug('[fcw] Successfully got enrollment ' + options.uuid);
			if (cb) cb(null, { client: client, channel: channel, submitter: submitter });
			return;

		}).catch(function (err) {

			// --- Failure --- //
			logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err);
			var formatted = common.format_error_msg(err);

			if (cb) cb(formatted);
			return;
		});
	};

	// Get Submitter - ripped this function off from fabric-client
	function getSubmitter(client, options) {
		var member;
		return client.getUserContext(options.enroll_id, true).then((user) => {
			if (user && user.isEnrolled()) {
				if (user._mspId !== options.msp_id) {										//if they don't match, this isn't our user! can't use it
					logger.warn('[fcw] The msp id in KVS does not match the msp id passed to enroll. Need to clear the KVS.', user._mspId, options.msp_id);
					common.rmdir(options.kvs_path);											//delete it
					logger.error('[fcw] MSP in KVS mismatch. KVS has been deleted. Restart the app to try again.');
					process.exit();															//this is terrible, but can't seem to reset client._userContext
				} else {
					logger.info('[fcw] Successfully loaded enrollment from persistence');	//load from KVS if we can
					return user;
				}
			} else {

				// Need to enroll it with the CA
				var tlsOptions = {
					trustedRoots: [options.ca_tls_opts.pem],								//pem cert required
					verify: false
				};
				var ca_client = new CaService(options.ca_url, tlsOptions, options.ca_name);	//ca_name is important for the bluemix service
				member = new User(options.enroll_id);

				logger.debug('enroll id: "' + options.enroll_id + '", secret: "' + options.enroll_secret + '"');
				logger.debug('msp_id: ', options.msp_id, 'ca_name:', options.ca_name);

				// --- Lets Do It --- //
				return ca_client.enroll({
					enrollmentID: options.enroll_id,
					enrollmentSecret: options.enroll_secret

				}).then((enrollment) => {

					// Store Certs
					logger.info('[fcw] Successfully enrolled user \'' + options.enroll_id + '\'');
					return member.setEnrollment(enrollment.key, enrollment.certificate, options.msp_id);
				}).then(() => {

					// Save Submitter Enrollment
					return client.setUserContext(member);
				}).then(() => {

					// Return Submitter Enrollment
					return member;
				}).catch((err) => {

					// Send Errors
					logger.error('[fcw] Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
					throw new Error('Failed to obtain an enrolled user');
				});
			}
		});
	}

	//-----------------------------------------------------------------
	// Enroll with Admin Certs - use this for install || instantiate || creating a channel
	//-----------------------------------------------------------------
	/*
		options = {
			peer_urls: ['array of peer grpc urls'],
			channel_id: 'channel name',
			uuid: 'unique name for this enrollment',
			orderer_url: 'grpc://url_here:port',
			privateKeyPEM: '<cert here>',
			signedCertPEM: '<cert here>',
			msp_id: 'string',
			orderer_tls_opts: {
				pem: 'complete tls certificate',									<required if using ssl>
				ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
				grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
				grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
			},
			peer_tls_opts: {
				pem: 'complete tls certificate',									<required if using ssl>
				ssl-target-name-override: 'common name used in pem certificate' 	<required if using ssl>
				grpc.keepalive_time_ms: <integer in milliseconds>,					<optional>
				grpc.keepalive_timeout_ms: <integer in milliseconds>				<optional>
			},
			kvs_path: '/path/to/the/key/value/store'
		}
	*/

	enrollment.enrollWithAdminCert = function (options, cb) {
		var client = new FabricClient();
		var channel = client.newChannel(options.channel_id);

		var debug = {														// this is just for console printing, no PEM here
			peer_urls: options.peer_urls,
			channel_id: options.channel_id,
			uuid: options.uuid,
			orderer_url: options.orderer_url,
			msp_id: options.msp_id,
		};
		logger.info('[fcw] Going to enroll with admin cert! ', debug);

		// Make eCert kvs (Key Value Store)
		FabricClient.newDefaultKeyValueStore({
			path: options.kvs_path 													//get eCert in the kvs directory
		}).then(function (store) {
			client.setStateStore(store);
			return getSubmitterWithAdminCert(client, options);						//admin cert is different
		}).then(function (submitter) {

			channel.addOrderer(new Orderer(options.orderer_url, options.orderer_tls_opts));

			channel.addPeer(new Peer(options.peer_urls[0], options.peer_tls_opts));	//add the first peer
			logger.debug('added peer', options.peer_urls[0]);

			// --- Success --- //
			logger.debug('[fcw] Successfully got enrollment ' + options.uuid);
			if (cb) cb(null, { client: client, channel: channel, submitter: submitter });
			return;

		}).catch(function (err) {

			// --- Failure --- //
			logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err);
			var formatted = common.format_error_msg(err);

			if (cb) cb(formatted);
			return;
		});
	};

	// Get Submitter - ripped this function off from helper.js in fabric-client
	function getSubmitterWithAdminCert(client, options) {
		return Promise.resolve(client.createUser({
			username: options.msp_id,
			mspid: options.msp_id,
			cryptoContent: {
				privateKeyPEM: options.privateKeyPEM,
				signedCertPEM: options.signedCertPEM
			}
		}));
	}

	return enrollment;
};

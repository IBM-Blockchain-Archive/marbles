//-------------------------------------------------------------------
// Marbles Chaincode Library
//-------------------------------------------------------------------

module.exports = function (chain, g_options, logger) {
	var marbles_chaincode = {};
	var fcw = require('../fcw_wrangler/index.js')(logger);


	// Chaincode -------------------------------------------------------------------------------

	//deploy chaincode
	marbles_chaincode.deploy_chaincode = function (options, cb) {
		console.log('\ndeploying marbles chaincode...');

		var opts = {
			peer_urls: options.peerl_urls,
			path_2_chaincode: './marbles',
			channel_id: g_options.channel_id,
			chaincode_id: g_options.chaincode_id,
			endorsed_hook: options.endorsed_hook,
			ordered_hook: options.ordered_hook,
			cc_args: ['99'],
			deploy_wait: 30000
		};
		fcw.deploy_chaincode(opts, cb);
	};

	//check chaincode
	marbles_chaincode.check_if_already_deployed = function (options, cb) {
		console.log('\nchecking for chaincode...');

		var opts = {
			targets: options.peer_urls,
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			fcn: 'read',
			args: '_ownerindex'
		};
		fcw.query_chaincode(chain, opts, cb);
	};


	// Marbles -------------------------------------------------------------------------------

	//create a marble
	marbles_chaincode.create_a_marble = function (options, cb) {
		console.log('\ncreating a marble...');

		var opts = {
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			endorsed_hook: options.endorsed_hook,
			ordered_hook: options.ordered_hook,
			fcn: 'init_marble',
			args: [
				options.args.marble_id,
				options.args.color,
				options.args.size,
				options.args.marble_owner,
				options.args.owners_company,
				options.args.auth_company
			]
		};
		fcw.invoke_chaincode(chain, opts, cb);
	};

	//get list of marbles
	marbles_chaincode.get_marble_list = function (options, cb) {
		console.log('\nfetching marble index list...');

		var opts = {
			targets: options.peer_urls,
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			fcn: 'compelte_marble_index',
			args: [' ']
		};
		fcw.query_chaincode(chain, opts, cb);
	};

	//get marble
	marbles_chaincode.get_marble = function (options, cb) {
		console.log('\nfetching marble ' + options.marble_id + ' list...');

		var opts = {
			targets: options.peer_urls,
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			fcn: 'read',
			args: [options.args.marble_id]
		};
		fcw.query_chaincode(chain, opts, cb);
	};

	//set marble owner
	marbles_chaincode.set_marble_owner = function (options, cb) {
		console.log('\nsetting marble owner...');

		var opts = {
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			endorsed_hook: options.endorsed_hook,
			ordered_hook: options.ordered_hook,
			fcn: 'set_owner',
			args: [
				options.args.marble_id,
				options.args.marble_owner,
				options.args.owners_company,
				options.args.auth_company
			]
		};
		fcw.invoke_chaincode(chain, opts, cb);
	};

	//delete marble
	marbles_chaincode.delete_marble = function (options, cb) {
		console.log('\ndeleting a marble...');

		var opts = {
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			endorsed_hook: options.endorsed_hook,
			ordered_hook: options.ordered_hook,
			fcn: 'delete_marble',
			args: [options.args.marble_id, options.args.auth_company]
		};
		fcw.invoke_chaincode(chain, opts, cb);
	};


	// Owners -------------------------------------------------------------------------------

	//register a owner/user
	marbles_chaincode.register_owner = function (options, cb) {
		console.log('\nCreating a marble owner\n');

		var opts = {
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			endorsed_hook: options.endorsed_hook,
			ordered_hook: options.ordered_hook,
			fcn: 'init_owner',
			args: [options.args.marble_owner, options.args.owners_company]
		};
		fcw.invoke_chaincode(chain, opts, cb);
	};

	//get a owner/user
	marbles_chaincode.get_owner = function (options, cb) {
		var full_username = build_owner_name(options.args.marble_owner, options.args.owners_company);
		console.log('\nFetching owner ' + full_username + ' list...');

		var opts = {
			targets: options.peer_urls,
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			fcn: 'read',
			args: [full_username]
		};
		fcw.query_chaincode(chain, opts, cb);
	};

	//get the owner list
	marbles_chaincode.get_owner_list = function (options, cb) {
		console.log('\nFetching owner index list...');

		var opts = {
			targets: options.peer_urls,
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			fcn: 'read',
			args: ['_ownerindex']
		};
		fcw.query_chaincode(chain, opts, cb);
	};

	//build full name
	marbles_chaincode.build_owner_name = function (username, company) {
		return build_owner_name(username, company);
	};


	// All ---------------------------------------------------------------------------------

	//build full name
	marbles_chaincode.read_everything = function (options, cb) {
		console.log('\nFetching EVERYTHING...');

		var opts = {
			targets: options.peer_urls,
			chainId: g_options.channel_id,
			chaincodeId: g_options.chaincode_id,
			fcn: 'read_everything',
			args: ['']
		};
		fcw.query_chaincode(chain, opts, cb);
	};


	// Other -------------------------------------------------------------------------------

	// Format Owner's Actual Key Name
	function build_owner_name(username, company) {
		return username.toLowerCase() + '.' + company;
	}

	return marbles_chaincode;
};


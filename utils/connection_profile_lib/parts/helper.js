// ============================================================================================================================
// 													 Get config file fields
// ============================================================================================================================

module.exports = function (cp, logger) {
	var helper = {};

	// get the marble owner names
	helper.getMarbleUsernamesConfig = function () {
		return cp.getMarblesField('usernames');
	};

	// get the marbles trading company name from config file
	helper.getCompanyNameFromFile = function () {
		return cp.getMarblesField('company');
	};

	// get the marble's server port number
	helper.getMarblesPort = function () {
		return cp.getMarblesField('port');
	};

	// get the status of marbles previous startup
	helper.getEventsSetting = function () {
		if (cp.config['use_events']) {
			return cp.config['use_events'];
		}
		return false;
	};

	// get the re-enrollment period in seconds
	helper.getKeepAliveMs = function () {
		var sec = cp.getMarblesField('keep_alive_secs');
		if (!sec) sec = 30;									// default to 30 seconds
		return (sec * 1000);
	};

	return helper;
};

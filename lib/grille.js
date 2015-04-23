'use strict';

var async = require('async');
var extend = require('deep-extend');

var Spreadsheet = require('./spreadsheet.js');
var RedisGrilleStorage = require('./storage/redis.js');

/**
 * Creates a new instance of the Grille CMS
 *
 * @param {string|string[]} sheets Either a single Google Spreadsheet ID or an array of IDs
 * @param GrilleStorage storage An object with persistence capabilities (see lib/storage/redis.js)
 * @param number timeout Timeout value in milliseconds (default 5000)
 * @param number parallel Number of Worksheets to request in parallel (default 5)
 * @param number retry Number of times to retry downloading a Worksheet if a timeout occurs (default 3)
 */
var Grille = function(sheets, storage, timeout, parallel, retry) {
	var self = this;
	sheets = typeof sheets === 'string' ? [sheets] : sheets;

	this.storage = storage || new RedisGrilleStorage();
	this.content = Grille.deepFreeze({});

	this.version = null;

	this.spreadsheets = [];
	sheets.forEach(function(sheet_id) {
		self.spreadsheets.push(new Spreadsheet(sheet_id, timeout, parallel, retry));
	});
};

/**
 * Loads the default CMS versions data
 */
Grille.prototype.load = function(callback) {
	var self = this;

	this.storage.loadDefaultVersion(function(err, data, version) {
		if (err || !data || !version) {
            return async.eachSeries(self.spreadsheets, function(spreadsheet, cb) {
                spreadsheet.load(cb);
            }, function(err) {
				if (err) {
					return callback(err);
				}

				var new_data = {};

				self.spreadsheets.forEach(function(spreadsheet) {
					extend(new_data, spreadsheet.content);
				});

				self.version = Grille.versionFromDate();
				new_data.version = self.version;
				self.content = Grille.deepFreeze(new_data);

				self.storage.save(self.version, new_data, function(err) {
					if (err) {
						return callback(new Error("Error persisting loaded data"));
					}

					self.storage.setDefaultVersion(self.version, function(err) {
						if (err) {
							return callback(err);
						}

						callback(null, new_data, version);
					});
				});
			});
		}

		data.version = version;
		self.version = version;
		self.content = Grille.deepFreeze(data);

		callback(null, data, version);
	});

};

/**
 * Loads a specific version of CMS data
 */
Grille.prototype.loadVersion = function(version, callback) {
	var self = this;

	this.storage.load(version, function(err, data) {
		if (err || !data) {
			return callback(new Error("Version " + version + " of CMS data is not available"));
		}
		
		self.version = version;
		data.version = version;
		self.content = Grille.deepFreeze(data);

		callback(null, data);
	});
};

/**
 * Makes a request to Google Spreadsheets, grabbing the latest version of content.
 * It also checks the date for version purposes
 * It then updates the local version and content
 */
Grille.prototype.update = function(callback) {
	var self = this;

	async.eachSeries(self.spreadsheets, function(spreadsheet, cb) {
		spreadsheet.load(cb);
	}, function(err) {
		if (err) {
			return callback(err);
		}

		var new_data = {};

		self.spreadsheets.forEach(function(spreadsheet) {
			extend(new_data, spreadsheet.content);
		});

		self.version = Grille.versionFromDate();
		new_data.version = self.version;
		self.content = Grille.deepFreeze(new_data);

		self.storage.save(self.version, self.content, function(err) {
			if (err) {
				return callback(err);
			}

			self.storage.setDefaultVersion(self.version, function(err) {
				if (err) {
					return callback(err);
				}

				callback(null, self.content, self.version);
			});
		});
	});
};

/**
 * Gets content from memory.
 *
 * If no identifier is provided it will give the entire collection.
 * If no collection is provided it will give everything.
 */
Grille.prototype.get = function(collection, identifier) {
    if (!this.content[collection]) {
        return null;
    }

    if (typeof identifier === 'undefined') {
        return this.content[collection];
    }

    return this.content[collection][identifier];
};

/**
 * Returns the content store
 */
Grille.prototype.toJSON = function() {
	return this.content;
};

/**
 * Returns the date as YYYYMMDDHHMMSS as to be an ever increasing numeric string
 */
Grille.versionFromDate = function(date) {
	return (new Date()).toISOString().replace(/\D/g, '').slice(0, -3);
};

/**
 * This is a deep version of the shallow Object.freeze()
 *
 * Adapted from MDN:
 * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze#Examples
 */
Grille.deepFreeze = function(o) {
	var prop, propKey;
	Object.freeze(o); // First freeze the object.

	for (propKey in o) {
		prop = o[propKey];
		if (!o.hasOwnProperty(propKey) || prop === null || typeof prop !== 'object' || Object.isFrozen(prop)) {
			// If the object is on the prototype, not an object, or is already frozen,
			// skip it. Note that this might leave an unfrozen reference somewhere in the
			// object if there is an already frozen object containing an unfrozen object.
			continue;
		}

		Grille.deepFreeze(prop); // Recursively call deepFreeze.
	}

	return o;
};

/**
 * This way you can do `var g = new Grille(id, new Grille.RedisGrilleStorate(config));`
 */
Grille.RedisGrilleStorage = RedisGrilleStorage;

module.exports = Grille;

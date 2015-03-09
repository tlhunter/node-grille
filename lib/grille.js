'use strict';

var Spreadsheet = require('./spreadsheet.js');

var Grille = function(spreadsheet_id, storage, timeout) {
	this.spreadsheet_id = spreadsheet_id;
	this.storage = storage;
	this.timeout = timeout;
	this.content = {};

	this.version = null;
	this.ready = false;

	this.spreadsheet = new Spreadsheet(spreadsheet_id, timeout);
};

/**
 * Loads the default CMS versions data
 */
Grille.prototype.load = function(callback) {
	var self = this;

	this.storage.loadDefaultVersion(function(err, data) {
		if (err || !data) {
			return self.spreadsheet.load(function(err, data) {
				if (err) {
					return callback(new Error("Couldn't get data"));
				}

				self.version = Grille.versionFromDate(self.spreadsheet.last_updated);
				self.content = data;

				// TODO: Save to storage
				self.storage.save(self.version, self.content, function(err) {
					if (err) {
						return callback(new Error("Error persisting loaded data"));
					}

					callback(null, data);
				});
			});
		}

		self.content = data;

		callback(null, data);
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
		
		self.version = Grille.versionFromDate(self.spreadsheet.last_updated);
		self.content = data;

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

	this.spreadsheet.load(function(err) {
		if (err) {
			return callback(err);
		}

		self.content = self.spreadsheet.content;
		self.version = Grille.versionFromDate(self.spreadsheet.last_updated);

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

Grille.prototype.get = function(collection, identifier) {
	return this.ready && this.spreadsheet.get(collection, identifier);
};

Grille.versionFromDate = function(date) {
	return date.toISOString().replace(/\D/g, '').slice(0, -3);
};

module.exports = Grille;

'use strict';

var async = require('async');
var _ = require('lodash');

var Sheet = require('./sheet.js');
var ValidationError = require('./errors/validation.js');
var TimeoutError = require('./errors/timeout.js');

var DEFAULT_TIMEOUT = 10 * 1000;

var Registry = function(sheet_id, timeout) {
    this.id = sheet_id;
    this.timeout = timeout || DEFAULT_TIMEOUT;
    this.sheet = new Sheet(sheet_id);
    this.meta = null;
    this.content = {};
    this.ready = false;
};

Registry.META = 'meta';

Registry.prototype.setTimeout = function(timeout) {
    this.timeout = timeout;
};

Registry.prototype.load = function(load_callback) {
    var self = this;

    async.series({
        meta: function(meta_callback) {
            self.sheet.getSpreadsheetData(Registry.META, function(err, data) {
                if (err) {
                    return meta_callback(err);
                }

                self.meta = data;

                meta_callback();
            });
        },
        sheets: function(sheets_callback) {
            var tabs = Object.keys(self.meta);

            async.each(tabs, function(tab, cb) {
                if (self.meta[tab].format === 'hash') {
                    self.loadHashData(tab, cb);
                } else if (self.meta[tab].format === 'keyvalue') {
                    self.loadKeyValueData(tab, cb);
                } else if (self.meta[tab].format === 'array') {
                    self.loadArrayData(tab, cb);
                }
            }, function(err, results) {
                if (err) {
                    return sheets_callback(err);
                }

                self.ready = true;

                sheets_callback();
            });
        }
    }, function(err, results) {
        if (err) {
            return load_callback(err);
        }

        self.ready = true;

        load_callback(null, self.content);
    });

};

Registry.prototype.toJSON = function() {
    return this.content;
};

Registry.prototype.get = function(collection, identifier) {
    if (!this.ready) {
        return null;
    }

    if (!this.content[collection]) {
        return null;
    }

    if (typeof identifier === 'undefined') {
        return this.content[collection];
    }

    return this.content[collection][identifier];
};

Registry.prototype.loadHashData = function(collection, callback) {
    var self = this;

    var timeout = setTimeout(function() {
        callback(new TimeoutError(collection));
    }, this.timeout);

    //console.log("loading HASH:" + collection + "...");

    this.sheet.getSpreadsheetData(collection, function(err, data) {
        clearTimeout(timeout);

        if (err) {
            return callback(err);
        }

        //console.log("loading " + collection + " complete.");

        // TODO: Break up object on .'s
        self.content[self.meta[collection].collection] = data;

        callback();
    });
};

Registry.prototype.loadKeyValueData = function(collection, callback) {
    var self = this;

    var timeout = setTimeout(function() {
        callback(new TimeoutError(collection));
    }, this.timeout);

    //console.log("loading KEYVALUE:" + collection + "...");

    this.sheet.getSpreadsheetData(collection, function(err, data) {
        clearTimeout(timeout);

        if (err) {
            return callback(err);
        }

        //console.log("loading " + collection + " complete.");

        data = Registry.extractKeyValue(data);

        if (!self.content[self.meta[collection].collection]) {
            self.content[self.meta[collection].collection] = {};
        }

        // TODO: Break up object on .'s
        _.extend(self.content[self.meta[collection].collection], data);

        callback();
    });
};

/**
 * Load each level in parallel, once complete replace the Registry.levels object
 */
Registry.prototype.loadArrayData = function(collection, callback) {
    var self = this;

    var timeout = setTimeout(function() {
        callback(new TimeoutError(collection));
    }, this.timeout);

    //console.log("loading ARRAY:" + collection + "...");

    this.sheet.getSpreadsheetData(collection, function(err, data) {
        if (err) {
            return callback(err);
        }

        //console.log("loading " + collection + " complete.");

        // TODO: Break up object on .'s
        self.content[self.meta[collection].collection] = Registry.extractArray(data);

        callback();
    });
};

Registry.extractKeyValue = function(keyvalues) {
    Object.keys(keyvalues).map(function(key) {
        keyvalues[key] = keyvalues[key].value;
    });

    return keyvalues;
};

Registry.extractArray = function(values) {
    var array = [];
    var rows = Object.keys(values).length;
    var columns = Object.keys(values['1']).length - 1; // id column is 1

    for (var y = 0; y < rows; y++) {
        array[y] = [];
        for (var x = 0; x < columns; x++) {
            array[y][x] = values[y+1]['col-'+(x+1)];
        }
    }

    return array;
};

Registry.ValidationError = ValidationError;
Registry.TimeoutError = TimeoutError;

module.exports = Registry;

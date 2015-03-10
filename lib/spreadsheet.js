'use strict';

var async = require('async');
var _ = require('lodash');

var Worksheet = require('./worksheet.js');
var ValidationError = require('./errors/validation.js');
var TimeoutError = require('./errors/timeout.js');

var DEFAULT_TIMEOUT = 10 * 1000;

/**
 * Represents a collection of Worksheets within a Google Spreadsheet.
 * Contains functionality for reading meta information and loading different tabs.
 *
 * @param String id The hash Google uses for representing this worksheet
 */
var Spreadsheet = function(sheet_id, timeout) {
    this.id = sheet_id;
    this.timeout = timeout || DEFAULT_TIMEOUT;
    this.meta_worksheet = new Worksheet(sheet_id, Spreadsheet.META);
    this.meta = null;
    this.content = {};
    this.ready = false;
    this.last_updated = null;
};

Spreadsheet.META = 'meta';

Spreadsheet.prototype.setTimeout = function(timeout) {
    this.timeout = timeout;
};

Spreadsheet.prototype.load = function(load_callback) {
    var self = this;

    async.series({
        meta: function(meta_callback) {
            self.meta_worksheet.load(function(err, data) {
                if (err) {
                    return meta_callback(err);
                }

                self.meta = data;
                self.last_updated = self.meta_worksheet.last_updated;

                meta_callback();
            });
        },
        sheets: function(sheets_callback) {
            var tabs = Object.keys(self.meta);

            async.each(tabs, function(tab, cb) {
                self.loadWorksheet(tab, self.meta[tab].format, cb);
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

Spreadsheet.prototype.toJSON = function() {
    return this.content;
};

Spreadsheet.prototype.get = function(collection, identifier) {
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

Spreadsheet.prototype.loadWorksheet = function(collection, type, callback) {
    var self = this;
    var callbackFired = false;

    var timeout = setTimeout(function() {
        callbackFired = true;
        callback(new TimeoutError(collection));
    }, this.timeout);

    var worksheet = new Worksheet(this.id, collection);

    worksheet.load(function(err, data) {
        if (callbackFired) {
            // We got the data back from Google but it was too late.
            return;
        }

        callbackFired = true;

        clearTimeout(timeout);

        if (err) {
            return callback(err);
        }

        var path = self.meta[collection].collection;

        if (type === 'hash') {
            Spreadsheet.dotSet(self.content, data, path);
        } else if (type === 'keyvalue') {
            var new_data = Spreadsheet.extractKeyValue(data);

            if (!self.content[path]) {
                self.content[path] = {};
            }

            Spreadsheet.dotMerge(self.content, new_data, path);
        } else if (type === 'array') {
            Spreadsheet.dotSet(self.content, Spreadsheet.extractArray(data), path);
        }

        callback(null);
    });
};

Spreadsheet.extractKeyValue = function(keyvalues) {
    Object.keys(keyvalues).map(function(key) {
        keyvalues[key] = keyvalues[key].value;
    });

    return keyvalues;
};

Spreadsheet.extractArray = function(values) {
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

/**
 * Sets data in a deep object using dot notation
 *
 * @param destination Object Tree where we want to put the source
 * @param source Mixed What we want to stick in the destination object
 * @param path String The location in the tree to put the source, such that x.y.z => destination.x.y.z = source
 */
Spreadsheet.dotSet = function(destination, source, path) {
    var nodes = path.split("."); // e.g. x, y, z

    var pointer = destination;

    for (var i = 0; i < nodes.length - 1; i++) {
        if (!pointer[nodes[i]]) {
            pointer[nodes[i]] = {};
        }

        pointer = pointer[nodes[i]];
    }

    pointer[nodes[nodes.length-1]] = source;

    return destination;
};

/**
 * Merges data in a deep object using dot notation
 *
 * @param destination Object Tree where we want to merge the source
 * @param source Mixed What we want to stick in the destination object
 * @param path String The location in the tree to put the source, such that x.y.z => destination.x.y.z = source
 */
Spreadsheet.dotMerge = function(destination, source, path) {
    var nodes = path.split("."); // e.g. x, y, z

    var pointer = destination;

    for (var i = 0; i < nodes.length; i++) {
        if (!pointer[nodes[i]]) {
            pointer[nodes[i]] = {};
        }

        pointer = pointer[nodes[i]];
    }

    _.extend(pointer, source);

    return destination;
};

module.exports = Spreadsheet;

'use strict';

var GoogleSpreadsheet = require("google-spreadsheet");
var ValidationError = require('./errors/validation.js');

/**
 * Represents a single Worksheet within a Google Spreadsheet.
 * Contains functionality for extracting and casting data in the worksheet.
 *
 * @param String id The hash Google uses for representing the containing spreadsheet
 * @param String name The tab name for this Worksheet
 */
var Worksheet = function(id, name) {
    this.spreadsheet = new GoogleSpreadsheet(id);
    this.name = name;

    this.last_updated = null;
};

Worksheet.parseWorksheetData = function(row) {
    var parsed = {};
    var descriptors = Worksheet.removeExcessKeys(row.shift());

    row.forEach(function(row) {
        row = Worksheet.removeExcessKeys(row);
        row = Worksheet.convertKeys(descriptors, row);

        parsed[row.id] = row;
    });

    return parsed;
};

Worksheet.removeExcessKeys = function(row) {
    delete row._xml;
    delete row._links;
    delete row.content;
    delete row.save;
    delete row.del;
    delete row.title;

    return row;
};

Worksheet.convertKeys = function(descriptors, row) {
    Object.keys(descriptors).forEach(function(column) {
        var type = descriptors[column];

        switch(type) {
            case 'ignore':
                delete row[column];

                break;

            case 'integer':
                row[column] = Math.floor(row[column]);

                break;

            case 'float':
                row[column] = parseFloat(row[column]);

                break;

            case 'string':
                row[column] = row[column];

                break;

            case 'boolean':
                row[column] = row[column].toUpperCase();

                if (row[column] !== 'TRUE' && row[column] !== 'FALSE') {
                    throw new ValidationError("Not a boolean");
                }

                row[column] = row[column] === 'TRUE';

                break;

            case 'array':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new ValidationError("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new ValidationError("Data is not of type array: " + column);
                }

                break;

            case 'array.integer':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new ValidationError("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new ValidationError("Data is not of type array: " + column);
                }

                row[column].forEach(function(value) {
                    if (typeof value !== 'number' || value % 1 !== 0) {
                        throw new ValidationError("Not an array of integers");
                    }
                });

                break;

            case 'array.string':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new ValidationError("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new ValidationError("Data is not of type array: " + column);
                }

                row[column].forEach(function(value) {
                    if (typeof value !== 'string') {
                        throw new ValidationError("Not an array of strings");
                    }
                });

                break;

            case 'array.boolean':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new ValidationError("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new ValidationError("Data is not of type array: " + column);
                }

                row[column].forEach(function(value) {
                    if (typeof value !== 'boolean') {
                        throw new ValidationError("Not an array of booleans");
                    }
                });

                break;

            case 'array.float':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new ValidationError("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new ValidationError("Data is not of type array: " + column);
                }

                row[column].forEach(function(value) {
                    if (typeof value !== 'number') {
                        throw new ValidationError("Not an array of floats");
                    }
                });

                break;

            case 'json':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new ValidationError("Unable to parse JSON: " + row[column]);
                }

                break;

            default:
                console.log("NOTICE: Unable to parse data type, assuming string", JSON.stringify(type));

                row[column] = row[column];

                break;
        }
    });

    return row;
};

Worksheet.getIndex = function(name, data) {
    for (var i = 0; i < data.worksheets.length; i++) {
        if (data.worksheets[i].title === name) {
            return i + 1; // Google Spreadsheet uses 1-based indexes
        }
    }

    return null;
};

Worksheet.prototype.load = function(callback) {
    var self = this;

    this.getWorksheetIndex(function(err, sheet) {
        if (err) {
            return callback(err);
        }

        self.spreadsheet.getRows(sheet, function(err, data) {
            if (err) {
                return callback(err);
            }

            callback(null, Worksheet.parseWorksheetData(data));
        });
    });
};

// TODO: This should be called once per document load
Worksheet.prototype.getWorksheetIndex = function(callback) {
    var self = this;

    self.spreadsheet.getInfo(function(err, data) {
        if (err) {
            return callback(err);
        }

        self.last_updated = new Date(data.updated);

        var worksheet_index = Worksheet.getIndex(self.name, data);

        if (!worksheet_index) {
            return callback("Couldn't find a worksheet tab named '" + self.name + "'!");
        }

        callback(null, worksheet_index);
    });
};

module.exports = Worksheet;

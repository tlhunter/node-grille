'use strict';

var GoogleSpreadsheet = require("google-spreadsheet");

var Sheet = function(id) {
    this.spreadsheet = new GoogleSpreadsheet(id);
    this.last_updated = null;
};

Sheet.parseWorksheetData = function(row_data) {
    var parsed = {};
    var descriptors = Sheet.removeExcessKeys(row_data.shift());

    row_data.forEach(function(row) {
        row = Sheet.removeExcessKeys(row);
        row = Sheet.convertKeys(descriptors, row);

        parsed[row.id] = row;
    });

    return parsed;
};

Sheet.removeExcessKeys = function(row) {
    delete row._xml;
    delete row._links;
    delete row.content;
    delete row.save;
    delete row.del;
    delete row.title;

    return row;
};

Sheet.convertKeys = function(descriptors, row) {
    Object.keys(descriptors).forEach(function(column) {
        var type = descriptors[column];
        switch(type) {
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
                row[column] = row[column].toLowerCase() === 'true';
                break;

            case 'array':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new Error("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new Error("Data is not of type array: " + column);
                }

                break;

            case 'array.integer':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new Error("Unable to parse JSON: " + row[column]);
                }

                if (!Array.isArray(row[column])) {
                    throw new Error("Data is not of type array: " + column);
                }

                row[column].forEach(function(value) {
                    if (typeof value !== 'number' || value % 1 !== 0) {
                        throw new Error("Not an array of integers");
                    }
                });
                break;

            case 'array.string':
                throw new Error('shit');
                break;

            case 'array.boolean':
                throw new Error('shit');
                break;

            case 'array.float':
                throw new Error('shit');
                break;

            case 'json':
                try {
                    row[column] = JSON.parse(row[column]);
                } catch(e) {
                    throw new Error("Unable to parse JSON: " + row[column]);
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

Sheet.getIndexFromInfo = function(name, data) {
    for (var i = 0; i < data.worksheets.length; i++) {
        if (data.worksheets[i].title === name) {
            return i + 1; // Google Spreadsheet uses 1-based indexes
        }
    }

    return null;
};

Sheet.prototype.getSpreadsheetData = function(name, callback) {
    var self = this;

    this.getWorksheetIndexByName(name, function(err, tab) {
        if (err) {
            return callback(err);
        }

        self.spreadsheet.getRows(tab, function(err, data) {
            if (err) {
                return callback(err);
            }

            var clean = Sheet.parseWorksheetData(data);

            callback(null, clean);
        });
    });
};

Sheet.prototype.getWorksheetIndexByName = function(name, callback) {
    var self = this;

    self.spreadsheet.getInfo(function(err, data) {
        if (err) {
            return callback(err);
        }

        self.last_updated = new Date(data.updated);

        var worksheet_index = Sheet.getIndexFromInfo(name, data);

        if (!worksheet_index) {
            return callback("Couldn't find a worksheet tab named '" + name + "'!");
        }

        callback(null, worksheet_index);
    });
};

module.exports = Sheet;

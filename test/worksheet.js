'use strict';

var assert = require('assert');

var Worksheet = require('../lib/worksheet.js');
var ValidationError = require('../lib/errors/validation.js');

describe("Worksheet", function() {
    var worksheet;

    before(function() {
        worksheet = new Worksheet('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04', 'people');
    });

    it("removes excess keys", function() {
        var raw = {
            _xml: '<entry>lots of XML</entry>',
            id: '2',
            title: '2',
            content: 'name: Rupert Styx, likesgum: FALSE, gender: m',
            _links: {},
            name: 'Rupert Styx',
            likesgum: 'FALSE',
            gender: 'm',
            save: function() {},
            del: function() {}
        };

        var parsed = Worksheet.removeExcessKeys(raw);

        assert.deepEqual(parsed, {
            id: '2',
            name: 'Rupert Styx',
            likesgum: 'FALSE',
            gender: 'm'
        });

    });

    it("finds valid worksheet index", function() {
        var sheetInfo = {
            title: 'Simple CMS Demo',
            updated: '2015-02-25T06:52:51.866Z',
            author: { name: 'tlhunter', email: 'tlhunter@gmail.com' },
            worksheets: [{
                id: 'od6',
                title: 'help',
                rowCount: '1002',
                colCount: '26',
                getRows: function() {},
                getCells: function() {},
                addRow: function() {}
            }, {
                id: 'oarl7dm',
                title: 'meta',
                rowCount: '1000',
                colCount: '26',
                getRows: function() {},
                getCells: function() {},
                addRow: function() {}
            }]
        };

        var index = Worksheet.getIndex('meta', sheetInfo);

        assert.strictEqual(index, 2);
    });

    it("doesn't find invalid worksheet index", function() {
        var sheetInfo = {
            title: 'Simple CMS Demo',
            updated: '2015-02-25T06:52:51.866Z',
            author: { name: 'tlhunter', email: 'tlhunter@gmail.com' },
            worksheets: [{
                id: 'od6',
                title: 'help',
                rowCount: '1002',
                colCount: '26',
                getRows: function() {},
                getCells: function() {},
                addRow: function() {}
            }, {
                id: 'oarl7dm',
                title: 'meta',
                rowCount: '1000',
                colCount: '26',
                getRows: function() {},
                getCells: function() {},
                addRow: function() {}
            }]
        };

        var badIndex = Worksheet.getIndex('fake', sheetInfo);

        assert.strictEqual(badIndex, null);
    });

    it("converts keys", function() {
        var descriptors = {
            id: 'integer',
            name: 'string',
            likesgum: 'boolean',
            gender: 'string',
            money: 'float',
            pets: 'json',
            oddsnends: 'array',
            friends: 'array.string',
            comment: 'ignore',
            luckynumbers: 'array.integer',
            cointosses: 'array.boolean',
            yarnlengths: 'array.float'
        };

        var row = {
            id: '1',
            name: 'Thomas Hunter II',
            likesgum: 'TRUE',
            gender: 'm',
            money: '123.45',
            pets: '{ "shadow": "cat", "captain": "betta" }',
            oddsnends: '[1, "b"]',
            friends: '["john", "jack", "jose"]',
            comment: 'not gonna exist',
            luckynumbers: '[1, 2, 3]',
            cointosses: '[false, true]',
            yarnlengths: '[1.1, 3.4]'
        };

        var converted = Worksheet.convertKeys(descriptors, row);

        assert.deepEqual(converted, {
            id: 1,
            name: 'Thomas Hunter II',
            likesgum: true,
            gender: 'm',
            money: 123.45,
            pets: {
                shadow: 'cat',
                captain: 'betta'
            },
            oddsnends: [1, 'b'],
            friends: ['john', 'jack', 'jose'],
            luckynumbers: [1, 2, 3],
            cointosses: [false, true],
            yarnlengths: [1.1, 3.4]
        });
    });

    it("fails validation for boolean", function() {
        var descriptors = {
            id: 'integer',
            alive: 'boolean'
        };

        var row = {
            id: 1,
            alive: 'a'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);
    });

    it("fails validation for array", function() {
        var descriptors = {
            id: 'integer',
            items: 'array'
        };

        var row = {
            id: 1,
            items: '{}'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);

        var row2 = {
            id: 1,
            items: 'a'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row2);
        }, ValidationError);
    });

    it("fails validation for array.integer", function() {
        var descriptors = {
            id: 'integer',
            items: 'array.integer'
        };

        var row = {
            id: 1,
            items: '[1, 2, 3.1]'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);

        var row2 = {
            id: 1,
            items: 'not json'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row2);
        }, ValidationError);

        var row3 = {
            id: 1,
            items: '{}'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row3);
        }, ValidationError);
    });

    it("fails validation for array.string", function() {
        var descriptors = {
            id: 'integer',
            items: 'array.string'
        };

        var row = {
            id: 1,
            items: '["dog", 8]'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);

        var row2 = {
            id: 1,
            items: 'not json'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row2);
        }, ValidationError);

        var row3 = {
            id: 1,
            items: '{}'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row3);
        }, ValidationError);
    });

    it("fails validation for array.boolean", function() {
        var descriptors = {
            id: 'integer',
            items: 'array.boolean'
        };

        var row = {
            id: 1,
            items: '[true, "FALSE"]'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);

        var row2 = {
            id: 1,
            items: 'not json'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row2);
        }, ValidationError);

        var row3 = {
            id: 1,
            items: '{}'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row3);
        }, ValidationError);
    });

    it("fails validation for array.float", function() {
        var descriptors = {
            id: 'integer',
            items: 'array.float'
        };

        var row = {
            id: 1,
            items: '[1, 2.2, "c"]'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);

        var row2 = {
            id: 1,
            items: 'not json'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row2);
        }, ValidationError);

        var row3 = {
            id: 1,
            items: '{}'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row3);
        }, ValidationError);
    });

    it("fails validation with invalid json", function() {
        var descriptors = {
            id: 'integer',
            items: 'json'
        };

        var row = {
            id: 1,
            items: 'not json'
        };

        assert.throws(function() {
            Worksheet.convertKeys(descriptors, row);
        }, ValidationError);
    });

    it("falls back to parsing as string with unknown format", function() {
        var descriptors = {
            id: 'integer',
            items: 'unknown'
        };

        var row = {
            id: 1,
            items: '999'
        };

        var result = Worksheet.convertKeys(descriptors, row);

        assert.strictEqual(result.items, '999');
    });

    describe("integration tests", function() {
        this.timeout(10 * 1000);

        it("loads data", function(done) {
            worksheet.load(function(err, data) {
                assert.ifError(err);

                assert.deepEqual(data, {
                    '1': {
                        id: 1,
                        name: 'Thomas Hunter II',
                        likesgum: true,
                        gender: 'm'
                    },
                    '2': {
                        id: 2,
                        name: 'Rupert Styx',
                        likesgum: false,
                        gender: 'm'
                    },
                    '3': {
                        id: 3,
                        name: 'Morticia Addams',
                        likesgum: true,
                        gender: 'f'
                    },
                    '4': {
                        id: 4,
                        name: 'Lurch',
                        likesgum: false,
                        gender: 'm'
                    }
                });

                done();
            });
        });
    });
});


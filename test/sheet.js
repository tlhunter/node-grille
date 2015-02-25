var assert = require('assert');

var Sheet = require('../lib/sheet.js');

describe("sheet", function() {
    var sheet;

    before(function() {
        sheet = new Sheet('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04');
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

        var parsed = Sheet.removeExcessKeys(raw);

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

        var index = Sheet.getIndexFromInfo('meta', sheetInfo);

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

        var badIndex = Sheet.getIndexFromInfo('fake', sheetInfo);

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
            friends: 'array',
            luckynumbers: 'array.integer'
        };

        var row = {
            id: '1',
            name: 'Thomas Hunter II',
            likesgum: 'TRUE',
            gender: 'm',
            money: '123.45',
            pets: '{ "shadow": "cat", "captain": "betta" }',
            friends: '["john", "jack", "jose"]',
            luckynumbers: '[1, 2, 3]'
        };

        var converted = Sheet.convertKeys(descriptors, row);

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
            friends: ['john', 'jack', 'jose'],
            luckynumbers: [1, 2, 3]
        });
    });

    describe("integration tests", function() {
        it("loads data", function(done) {
            this.timeout(10 * 1000);

            sheet.getSpreadsheetData('people', function(err, data) {
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


'use strict';

var assert = require('assert');
var sinon = require('sinon');

var Spreadsheet = require('../lib/spreadsheet.js');

describe("spreadsheet", function() {
    var spreadsheet;

    before(function() {
        spreadsheet = new Spreadsheet('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04');
    });

    it("updates timeout", function() {
        assert.strictEqual(spreadsheet.timeout, 10000);

        spreadsheet.setTimeout(9000);

        assert.strictEqual(spreadsheet.timeout, 9000);
    });

    it("doesn't get data when not ready", function() {
        var result = spreadsheet.get('collection');

        assert.strictEqual(result, null);
    });

    it("extracts key value pairs", function() {
        var raw = {
            alpha: {
                id: "alpha",
                value: "A"
            },
            beta: {
                id: "beta",
                value: "B"
            }
        };

        var extracted = Spreadsheet.extractKeyValue(raw);

        assert.deepEqual(extracted, {
            alpha: 'A',
            beta: 'B'
        });
    });

    it("extracts 2d array", function() {
        var raw = {
            '1': {
                'id': 1,
                'col-1': 'A',
                'col-2': 'B',
                'col-3': 'C'
            },
            '2': {
                'id': 2,
                'col-1': 'D',
                'col-2': 'E',
                'col-3': 'F'
            }
        };

        var extracted = Spreadsheet.extractArray(raw);

        assert.deepEqual(extracted, [
            ['A', 'B', 'C'],
            ['D', 'E', 'F']
        ]);
    });

    describe("integration tests", function() {
        this.timeout(10 * 1000);

        it("loads data", function(done) {
            spreadsheet.load(function(err, data) {
                assert.ifError(err);

                assert.deepEqual(spreadsheet.get('people', 1), data.people['1']);
                assert.deepEqual(spreadsheet.get('people', 2), data.people['2']);
                assert.deepEqual(spreadsheet.get('people', 3), data.people['3']);
                assert.deepEqual(spreadsheet.get('people', 4), data.people['4']);

                assert.strictEqual(spreadsheet.get('keyvalue', 'title'), data.keyvalue.title);
                assert.strictEqual(spreadsheet.get('keyvalue', 'author'), data.keyvalue.author);
                assert.strictEqual(spreadsheet.get('keyvalue', 'seconds_in_minutes'), data.keyvalue.seconds_in_minutes);
                assert.strictEqual(spreadsheet.get('keyvalue', 'hours_in_day'), data.keyvalue.hours_in_day);

                // TODO: These should be split on .'s
                assert.deepEqual(spreadsheet.get('levels.0'), data['levels.0']);
                assert.deepEqual(spreadsheet.get('levels.1'), data['levels.1']);
                assert.deepEqual(spreadsheet.get('levels.secret'), data['levels.secret']);

                assert.deepEqual(spreadsheet.toJSON(), data);

                done();
            });
        });

        it("doesn't callback twice when timeout occurs", function(done) {
            spreadsheet.setTimeout(100);

            var callback = sinon.spy(function(err, data) {
                assert(err);
            });

            spreadsheet.load(callback);

            setTimeout(function() {
                assert(callback.calledOnce);
                done();
            }, 6000);
        });
    });
});

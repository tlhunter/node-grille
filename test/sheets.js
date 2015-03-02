var assert = require('assert');
var sinon = require('sinon');

var Sheets = require('../lib/sheets.js');

describe("sheets", function() {
    var sheets;

    before(function() {
        sheets = new Sheets('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04');
    });

    it("updates timeout", function() {
        assert.strictEqual(sheets.timeout, 10000);

        sheets.setTimeout(9000);

        assert.strictEqual(sheets.timeout, 9000);
    });

    it("doesn't get data when not ready", function() {
        var result = sheets.get('collection');

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

        var extracted = Sheets.extractKeyValue(raw);

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

        var extracted = Sheets.extractArray(raw);

        assert.deepEqual(extracted, [
            ['A', 'B', 'C'],
            ['D', 'E', 'F']
        ]);
    });

    describe("integration tests", function() {
        this.timeout(10 * 1000);

        it("loads data", function(done) {
            sheets.load(function(err, data) {
                assert.ifError(err);

                assert.deepEqual(sheets.get('people', 1), data.people['1']);
                assert.deepEqual(sheets.get('people', 2), data.people['2']);
                assert.deepEqual(sheets.get('people', 3), data.people['3']);
                assert.deepEqual(sheets.get('people', 4), data.people['4']);

                assert.strictEqual(sheets.get('keyvalue', 'title'), data.keyvalue.title);
                assert.strictEqual(sheets.get('keyvalue', 'author'), data.keyvalue.author);
                assert.strictEqual(sheets.get('keyvalue', 'seconds_in_minutes'), data.keyvalue.seconds_in_minutes);
                assert.strictEqual(sheets.get('keyvalue', 'hours_in_day'), data.keyvalue.hours_in_day);

                // TODO: These should be split on .'s
                assert.deepEqual(sheets.get('levels.0'), data['levels.0']);
                assert.deepEqual(sheets.get('levels.1'), data['levels.1']);
                assert.deepEqual(sheets.get('levels.secret'), data['levels.secret']);

                assert.deepEqual(sheets.toJSON(), data);

                done();
            });
        });

        it("doesn't callback twice when timeout occurs", function(done) {
            sheets.setTimeout(100);

            var callback = sinon.spy(function(err, data) {
                assert(err);
            });

            sheets.load(callback);

            setTimeout(function() {
                assert(callback.calledOnce);
                done();
            }, 6000);
        });
    });
});

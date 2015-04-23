'use strict';

var assert = require('assert');
var sinon = require('sinon');

var Spreadsheet = require('../lib/spreadsheet.js');

describe("Spreadsheet", function() {
    var spreadsheet;

    before(function() {
        spreadsheet = new Spreadsheet('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04');
    });

    it("updates timeout", function() {
        assert.strictEqual(spreadsheet.timeout, 5000);

        spreadsheet.setTimeout(10000);

        assert.strictEqual(spreadsheet.timeout, 10000);
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

    it("dotSet() simple", function() {
        var destination = {};
        var source = 'banana';
        var path = 'x';

        Spreadsheet.dotSet(destination, source, path);

        assert.deepEqual(destination, {
            x: 'banana'
        });
    });

    it("dotSet()", function() {
        var destination = {
            x: {
                b: 1
            },
            a: 2
        };
        var source = 'banana';
        var path = 'x.y.z';

        Spreadsheet.dotSet(destination, source, path);

        assert.deepEqual(destination, {
            x: {
                b: 1,
                y: {
                    z: 'banana'
                }
            },
            a: 2
        });
    });

    it("dotMerge() simple", function() {
        var destination = {};
        var source = {
            a: 1,
            b: 2
        };

        var path = 'x';

        Spreadsheet.dotMerge(destination, source, path);

        assert.deepEqual(destination, {
            x: {
                a: 1,
                b: 2
            }
        });
    });

    it("dotMerge()", function() {
        var destination = {
            x: {
                b: 1,
                keyval: {
                    dog: 1,
                    cat: 2,
                    fish: 3
                }
            },
            a: 2
        };
        var source = {
            fish: 4,
            frog: 5,
            horse: 6
        };

        var path = 'x.keyval';

        Spreadsheet.dotMerge(destination, source, path);

        assert.deepEqual(destination, {
            x: {
                b: 1,
                keyval: {
                    dog: 1,
                    cat: 2,
                    fish: 4,
                    frog: 5,
                    horse: 6
                }
            },
            a: 2
        });
    });

    describe("integration tests", function() {
        this.timeout(10 * 1000);

        it("loads data", function(done) {
            spreadsheet.load(function(err, data) {
                assert.ifError(err);

                assert.deepEqual(spreadsheet.content.people['1'], data.people['1']);
                assert.deepEqual(spreadsheet.content.people['2'], data.people['2']);
                assert.deepEqual(spreadsheet.content.people['3'], data.people['3']);
                assert.deepEqual(spreadsheet.content.people['4'], data.people['4']);

                assert.strictEqual(spreadsheet.content.keyvalue.title, data.keyvalue.title);
                assert.strictEqual(spreadsheet.content.keyvalue.author, data.keyvalue.author);
                assert.strictEqual(spreadsheet.content.keyvalue.seconds_in_minutes, data.keyvalue.seconds_in_minutes);
                assert.strictEqual(spreadsheet.content.keyvalue.hours_in_day, data.keyvalue.hours_in_day);

                assert.deepEqual(spreadsheet.content.levels[0], data.levels[0]);
                assert.deepEqual(spreadsheet.content.levels[1], data.levels[1]);
                assert.deepEqual(spreadsheet.content.levels.secret, data.levels.secret);

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

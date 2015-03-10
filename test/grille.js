'use strict';

var assert = require('assert');

var Grille = require('../lib/grille.js');
var RedisGrilleStorage = require('../lib/storage/redis.js');

describe("Grille", function() {
    var storage = new RedisGrilleStorage();
    var grille = new Grille('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04', storage);
    var version;

    before(function(done) {
        storage.clear(done);
    });

    after(function(done) {
        storage.clear(done);
    });

    it("fails loading an invalid version", function(done) {
        grille.loadVersion('asdf', function(err, data) {
            assert(err);

            assert.strictEqual(data, undefined);

            done();
        });
    });

    describe("integration tests", function() {
        this.timeout(10 * 1000);

        it("loads data from google spreadsheets when no default version is set", function(done) {

            assert.strictEqual(grille.version, null);

            grille.load(function(err, data) {
                assert.ifError(err);

                assert.equal(grille.version.length, 14);
                assert(grille.content.keyvalue);
                assert(grille.content.people);

                version = grille.version;

                done();
            });
        });

        it("loads data from storage when available", function(done) {
            this.timeout(100);

            assert.strictEqual(grille.version, version);

            grille.load(function(err, data) {
                assert.ifError(err);

                assert.equal(grille.version.length, 14);
                assert(grille.content.keyvalue);
                assert(grille.content.people);

                done();
            });
        });

        it("loads exact version of data", function(done) {
            this.timeout(100);

            grille.loadVersion(version, function(err, data) {
                assert.ifError(err);

                assert.equal(grille.version.length, 14);
                assert.strictEqual(version, grille.version);
                assert(grille.content.keyvalue);
                assert(grille.content.people);

                done();
            });
        });

        it("grabs new content from Google replacing the same version", function(done) {
            grille.update(function(err, data, version) {
                assert.ifError(err);

                assert.equal(grille.version.length, 14);

                // Unforunately we can't test the content being updated during the test
                // Version numbers are based on last modified time of sheet
                assert.strictEqual(version, grille.version);

                assert.deepEqual(grille.content.keyvalue, data.keyvalue);
                assert.deepEqual(grille.content.people, data.people);

                done();
            });
        });
    });
});

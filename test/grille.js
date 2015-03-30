'use strict';

var assert = require('assert');

var Grille = require('../lib/grille.js');

describe("Grille", function() {
    var storage = new Grille.RedisGrilleStorage({
        current: 'grille-test-current',
        collection: 'grille-test-collection'
    });

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

    it("fails to retrieve data when not present", function() {
        assert.equal(grille.get('people'), null);
        assert.equal(grille.get('people', 1), null);
    });

    it("generates sane version numbers", function() {
        var ver = Grille.versionFromDate();
        assert.equal(ver.length, 14);
    });

    describe("integration tests", function() {
        this.timeout(20 * 1000);

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

        it("retrieves data", function() {
            assert.equal(grille.get('people')['1'].name, 'Thomas Hunter II');
            assert.equal(grille.get('people', 1).name, 'Thomas Hunter II');
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

        it("JSON serializes data", function() {
            var unserialized = JSON.parse(JSON.stringify(grille));

            assert.deepEqual(grille.content, unserialized);
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

    describe("works with multiple sheets", function() {
        var grille_multi = new Grille(['1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04', '11_2RBdN37Q-LawzfFEJBlF3JfeDX5tC1Rp0QdAvAvoc'], storage);

        before(function(done) {
            storage.clear(done);
        });

        after(function(done) {
            storage.clear(done);
        });

        describe("integration tests", function() {
            this.timeout(20 * 1000);

            it("loads data from google spreadsheets when no default version is set", function(done) {
                assert.strictEqual(grille_multi.version, null);

                grille_multi.load(function(err, data) {
                    assert.ifError(err);

                    assert.equal(grille_multi.version.length, 14);
                    assert(grille_multi.content.keyvalue);
                    assert(grille_multi.content.people);
                    assert(grille_multi.content.puppies);

                    version = grille_multi.version;

                    done();
                });
            });

            it("retrieves data", function() {
                assert.equal(grille_multi.get('people')['1'].name, 'Thomas Hunter II');
                assert.equal(grille_multi.get('people', 1).name, 'Thomas Hunter II');

                assert.deepEqual(grille_multi.get('puppies'), {
                    '1': { id: '1', name: 'Fido' },
                    '2': { id: '2', name: 'Clifford' },
                    '3': { id: '3', name: 'Scruff McGruff' },
                    '4': { id: '4', name: 'Cerberus' },
                });

                assert.deepEqual(grille_multi.get('keyvalue'), {
                    title: 'Simple CMS Demo',
                    author: 'Thomas Hunter II',
                    seconds_in_minute: 60,
                    hours_in_day: 24,
                    days_in_week: 7
                });
            });
        });
    });
});

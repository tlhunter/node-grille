'use strict';

var assert = require('assert');

var Grille = require('../index.js');
var RedisGrilleStorage = require('../lib/storage/redis.js');

describe("grille", function() {
    var storage = new RedisGrilleStorage();
    var grille = new Grille('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04', storage);

    beforeEach(function(done) {
        storage.clear(done);
    });

    it("loads data from google spreadsheets when no current version is set", function(done) {
        this.timeout(10 * 1000);

        grille.load(function(err, data) {
            assert.ifError(err);

            assert.equal(grille.version.length, 14);
            assert(grille.content.keyvalue);
            assert(grille.content.people);

            done();
        });
    });

    it("loads data from redis when data is cached", function(done) {
        this.timeout(2 * 1000);

        grille.load(function(err, data) {
            assert.ifError(err);

            assert.equal(grille.version.length, 14);
            assert(grille.content.keyvalue);
            assert(grille.content.people);

            done();
        });
    });
});

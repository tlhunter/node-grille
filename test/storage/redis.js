'use strict';

var assert = require('assert');

var RedisGrilleStorage = require('../../lib/storage/redis.js');

describe("RedisGrilleStorage", function() {
    var storage = new RedisGrilleStorage();
    var content = {
        pages: [1, 2, 3],
        people: {
            thomas: 'hunter'
        }
    };

    before(function(done) {
        storage.clear(done);
    });

    after(function(done) {
        storage.clear(done);
    });

    it("sets default version", function(done) {
        storage.setDefaultVersion('20150301164200', function(err) {
            assert.ifError(err);

            done();
        });
    });

    it("gets default version", function(done) {
        storage.getDefaultVersion(function(err, version) {
            assert.ifError(err);

            assert.strictEqual(version, '20150301164200');

            done();
        });
    });

    it("saves a version", function(done) {
        storage.save('1', content, function(err) {
            assert.ifError(err);

            done();
        });
    });

    it("loads a version", function(done) {
        storage.load('1', function(err, data) {
            assert.ifError(err);

            assert.deepEqual(content, data);

            done();
        });
    });

    it("doesn't load an incorrect version", function(done) {
        storage.load('8', function(err, data) {
            assert(err);
            assert(!data);
            
            done();
        });
    });

    it("loads default version", function(done) {
        storage.save('2', content, function(err) {
            assert.ifError(err);

            storage.setDefaultVersion('2', function(err) {
                assert.ifError(err);

                storage.loadDefaultVersion(function(err, data) {
                    assert.deepEqual(content, data);

                    done();
                });
            });
        });
    });

    it("lists versions", function(done) {
        storage.list(function(err, versions) {
            assert.deepEqual(versions, [
                '1',
                '2'
            ]);

            done();
        });
    });
});

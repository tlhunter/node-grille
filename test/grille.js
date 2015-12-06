'use strict';

var assert = require('assert');
var sinon = require('sinon');

var Grille = require('../lib/grille.js');

describe("Grille", function() {
  var storage = new Grille.RedisGrilleStorage({
    current: 'grille-test-current',
    collection: 'grille-test-collection'
  });

  var transform = sinon.spy(function(data) {
    assert(data);
    data.has_transformed = true;
    return data;
  });

  var grille = new Grille('1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04', {
    storage: storage,
    transform: transform
  });

  var version;

  before(function(done) {
    transform.reset();
    storage.clear(done);
  });

  after(function(done) {
    storage.clear(done);
  });

  it("fails loading an invalid version", function(done) {
    grille.loadVersion('asdf', function(err, data) {
      assert(err);
      assert(transform.notCalled);

      assert.strictEqual(data, undefined);

      done();
    });
  });

  it("empty content is immutable", function() {
    assert.throws(function() {
      grille.content.x = true;
    }, TypeError);
  });

  it("fails to retrieve data when not present", function() {
    assert.equal(grille.content.people, undefined);
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

        assert(transform.calledOnce); // Initial load will trigger a transform
        assert.deepEqual(transform.args[0][0], data);
        assert(data.has_transformed);

        assert.equal(grille.version.length, 14);
        assert.strictEqual(grille.content.version, grille.version);
        assert(grille.content.keyvalue);
        assert(grille.content.people);

        assert.deepEqual(data, grille.content);

        assert.throws(function() {
          grille.content.people.xyz = 1;
        }, TypeError);
        assert.strictEqual(grille.content.people.xyz, undefined); // Fresh data should be immutable

        version = grille.version;

        done();
      });
    });

    it("retrieves data", function() {
      assert.equal(grille.content.people['1'].name, 'Thomas Hunter II');
    });

    it("loads data from storage when available", function(done) {
      this.timeout(100);

      assert.strictEqual(grille.version, version);
      assert.strictEqual(grille.content.version, version);

      grille.load(function(err) {
        assert.ifError(err);

        assert(transform.calledOnce); // load gets already-transformed data, don't call again

        assert.equal(grille.version.length, 14);
        assert.strictEqual(grille.version, grille.content.version);
        assert(grille.content.keyvalue);
        assert(grille.content.people);

        assert.throws(function() {
          grille.content.people.xyz = 1;
        }, TypeError);
        assert.strictEqual(grille.content.people.xyz, undefined); // Stored data should be immutable

        done();
      });
    });

    it("loads exact version of data", function(done) {
      this.timeout(100);

      grille.loadVersion(version, function(err) {
        assert.ifError(err);

        assert(transform.calledOnce); // loadVersion gets already-transformed data, don't call again

        assert.equal(grille.version.length, 14);
        assert.strictEqual(version, grille.version);
        assert.strictEqual(version, grille.content.version);
        assert(grille.content.keyvalue);
        assert(grille.content.people);

        assert.throws(function() {
          grille.content.people.xyz = 1;
        }, TypeError);
        assert.strictEqual(grille.content.people.xyz, undefined); // Stored data should be immutable

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

        assert(transform.calledTwice); // Does get called again for update
        assert.deepEqual(transform.args[1][0], data);
        assert(data.has_transformed);

        // Unforunately we can't test the content being updated during the test
        // Version numbers are based on last modified time of sheet
        assert.strictEqual(version, grille.version);
        assert.strictEqual(version, grille.content.version);

        assert.deepEqual(grille.content.keyvalue, data.keyvalue);
        assert.deepEqual(grille.content.people, data.people);

        assert.throws(function() {
          grille.content.people.xyz = 1;
        }, TypeError);
        assert.strictEqual(grille.content.people.xyz, undefined); // Replaced data should be immutable

        done();
      });
    });
  });

  describe("works with multiple sheets", function() {
    var grille_multi = new Grille([
      '1r2SaVhOH6exvevx_syqxCJFDARg-L4N1-uNL9SZAk04',
      '11_2RBdN37Q-LawzfFEJBlF3JfeDX5tC1Rp0QdAvAvoc'
    ], {
      storage: storage,
      transform: transform
    });

    before(function(done) {
      transform.reset();
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

          assert(transform.calledOnce);
          assert.deepEqual(transform.args[0][0], data);
          assert(data.has_transformed);

          assert.equal(grille_multi.version.length, 14);
          assert.equal(grille_multi.version, grille_multi.content.version);
          assert(grille_multi.content.keyvalue);
          assert(grille_multi.content.people);
          assert(grille_multi.content.puppies);

          assert.throws(function() {
            grille.content.people.xyz = 1;
          }, TypeError);
          assert.strictEqual(grille.content.people.xyz, undefined); // Multi sheet data should be immutable

          version = grille_multi.version;

          done();
        });
      });

      it("retrieves data", function() {
        assert.equal(grille_multi.content.people['1'].name, 'Thomas Hunter II');

        assert.deepEqual(grille_multi.content.puppies, {
          '1': { id: '1', name: 'Fido' },
          '2': { id: '2', name: 'Clifford' },
          '3': { id: '3', name: 'Scruff McGruff' },
          '4': { id: '4', name: 'Cerberus' },
        });

        assert.deepEqual(grille_multi.content.keyvalue, {
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

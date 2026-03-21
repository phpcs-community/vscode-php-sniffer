'use strict';

const assert = require('assert');
const { parseMajorVersion } = require('../../lib/version');

suite('parseMajorVersion()', function () {
  test('returns 3 for "3.7.2"', function () {
    assert.strictEqual(parseMajorVersion('3.7.2'), 3);
  });

  test('returns 4 for "4.0.0-alpha1"', function () {
    assert.strictEqual(parseMajorVersion('4.0.0-alpha1'), 4);
  });

  test('returns 0 for null', function () {
    assert.strictEqual(parseMajorVersion(null), 0);
  });

  test('returns 0 for "invalid"', function () {
    assert.strictEqual(parseMajorVersion('invalid'), 0);
  });
});

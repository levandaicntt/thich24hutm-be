const { test } = require('node:test');
const assert = require('node:assert/strict');

const { haversineMeters, isValidCoordinate } = require('../src/utils/geo');

test('same coordinate -> 0', () => {
  assert.equal(haversineMeters(10.8, 106.6, 10.8, 106.6), 0);
});

test('known coordinate pair (1 degree longitude at equator)', () => {
  const d = haversineMeters(0, 0, 0, 1);
  assert.ok(d !== null);
  assert.ok(Math.abs(d - 111194.9) < 500, `expected ~111194.9m, got ${d}`);
});

test('known coordinate pair (London -> Paris)', () => {
  const d = haversineMeters(51.5074, -0.1278, 48.8566, 2.3522);
  assert.ok(d !== null);
  assert.ok(Math.abs(d - 343500) < 10000, `expected ~343,500m, got ${d}`);
});

test('invalid latitude is rejected', () => {
  assert.equal(isValidCoordinate(91, 0), false);
  assert.equal(isValidCoordinate(-91, 0), false);
  assert.equal(haversineMeters(91, 0, 0, 0), null);
});

test('invalid longitude is rejected', () => {
  assert.equal(isValidCoordinate(0, 181), false);
  assert.equal(isValidCoordinate(0, -181), false);
  assert.equal(haversineMeters(0, 181, 0, 0), null);
});

test('NaN is rejected', () => {
  assert.equal(isValidCoordinate(NaN, 0), false);
  assert.equal(haversineMeters(NaN, 0, 0, 0), null);
  assert.equal(haversineMeters(0, 0, NaN, 0), null);
});

test('Infinity is rejected', () => {
  assert.equal(isValidCoordinate(Infinity, 0), false);
  assert.equal(haversineMeters(Infinity, 0, 0, 0), null);
});

test('non-number input is rejected', () => {
  assert.equal(isValidCoordinate('10.8', 106.6), false);
  assert.equal(haversineMeters('10.8', 106.6, 0, 0), null);
});

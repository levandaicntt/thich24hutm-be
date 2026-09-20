const { test } = require("node:test");
const assert = require("node:assert/strict");

const { normalizeCoordinates } = require("../src/services/zalo");

test("string latitude/longitude/accuracy -> numbers, keeps metadata", () => {
  const out = normalizeCoordinates({
    latitude: "13.753586",
    longitude: "109.2117371",
    accuracy: "20",
    provider: "network",
    timestamp: "1789532408440",
  });
  assert.equal(out.latitude, 13.753586);
  assert.equal(out.longitude, 109.2117371);
  assert.equal(out.accuracy, 20);
  assert.equal(out.provider, "network");
  assert.equal(out.timestamp, "1789532408440");
});

test("lat/lng keys are normalized and removed", () => {
  const out = normalizeCoordinates({ lat: "10.5", lng: "106.6", accuracy: "50" });
  assert.equal(out.latitude, 10.5);
  assert.equal(out.longitude, 106.6);
  assert.equal(out.accuracy, 50);
  assert.ok(!("lat" in out));
  assert.ok(!("lng" in out));
});

test("number inputs stay numbers", () => {
  const out = normalizeCoordinates({ latitude: 13.7, longitude: 109.2, accuracy: 25 });
  assert.equal(out.latitude, 13.7);
  assert.equal(out.longitude, 109.2);
  assert.equal(out.accuracy, 25);
});

test("null accuracy stays null; missing accuracy -> null", () => {
  assert.equal(normalizeCoordinates({}).accuracy, null);
  assert.equal(
    normalizeCoordinates({ latitude: 1, longitude: 2, accuracy: null }).accuracy,
    null
  );
});

test("invalid latitude/longitude -> rejected as null (not a number)", () => {
  const out = normalizeCoordinates({ latitude: "abc", longitude: "101deg", accuracy: "20" });
  assert.equal(out.latitude, null);
  assert.equal(out.longitude, null);
});
const { test } = require("node:test");
const assert = require("node:assert/strict");

const { DEFAULT_MAX_STORE_DISTANCE_METERS, getMaxStoreDistanceMeters } = require("../src/config/distance");

test("default threshold is 50", () => {
  const prev = process.env.MAX_STORE_DISTANCE_METERS;
  delete process.env.MAX_STORE_DISTANCE_METERS;
  try {
    assert.equal(DEFAULT_MAX_STORE_DISTANCE_METERS, 50);
    assert.equal(getMaxStoreDistanceMeters(), 50);
  } finally {
    if (prev !== undefined) process.env.MAX_STORE_DISTANCE_METERS = prev;
  }
});

test("environment variable overrides default", () => {
  const prev = process.env.MAX_STORE_DISTANCE_METERS;
  process.env.MAX_STORE_DISTANCE_METERS = "200";
  try {
    assert.equal(getMaxStoreDistanceMeters(), 200);
  } finally {
    if (prev === undefined) delete process.env.MAX_STORE_DISTANCE_METERS;
    else process.env.MAX_STORE_DISTANCE_METERS = prev;
  }
});

test("non-numeric value falls back to default", () => {
  const prev = process.env.MAX_STORE_DISTANCE_METERS;
  process.env.MAX_STORE_DISTANCE_METERS = "abc";
  try {
    assert.equal(getMaxStoreDistanceMeters(), 50);
  } finally {
    if (prev === undefined) delete process.env.MAX_STORE_DISTANCE_METERS;
    else process.env.MAX_STORE_DISTANCE_METERS = prev;
  }
});

test("negative value falls back to default", () => {
  const prev = process.env.MAX_STORE_DISTANCE_METERS;
  process.env.MAX_STORE_DISTANCE_METERS = "-5";
  try {
    assert.equal(getMaxStoreDistanceMeters(), 50);
  } finally {
    if (prev === undefined) delete process.env.MAX_STORE_DISTANCE_METERS;
    else process.env.MAX_STORE_DISTANCE_METERS = prev;
  }
});
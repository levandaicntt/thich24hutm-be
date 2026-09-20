const { test } = require("node:test");
const assert = require("node:assert/strict");

const { persistUserMatch } = require("../src/services/consent");

test("matched=true -> UPDATE zalo_users with match columns + customer_matched", async () => {
  const calls = [];
  const pool = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      return { rows: [{ id: 1 }] };
    },
  };
  const row = await persistUserMatch({
    pool,
    zaloUserId: "u1",
    match: { matched: true, pharmacy_id: 7, kiotviet_branch_id: 999001, distance_meters: 12.3 },
  });
  assert.equal(row.id, 1);
  const call = calls[0];
  assert.match(call.sql, /UPDATE zalo_users/i);
  assert.match(call.sql, /matched_pharmacy_id/);
  assert.match(call.sql, /matched_at/);
  assert.match(call.sql, /match_distance_meters/);
  assert.match(call.sql, /customer_matched/);
  assert.deepEqual(call.params, ["u1", 7, 12.3]);
});

test("matched=true with null distance persists null distance", async () => {
  const calls = [];
  const pool = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      return { rows: [{ id: 2 }] };
    },
  };
  await persistUserMatch({
    pool,
    zaloUserId: "u2",
    match: { matched: true, pharmacy_id: 8, distance_meters: null },
  });
  assert.deepEqual(calls[0].params, ["u2", 8, null]);
});

test("matched=false -> no query issued, returns null", async () => {
  let called = false;
  const pool = {
    query: async () => {
      called = true;
    },
  };
  const result = await persistUserMatch({
    pool,
    zaloUserId: "u1",
    match: { matched: false, pharmacy_id: null, distance_meters: null },
  });
  assert.equal(result, null);
  assert.equal(called, false);
});

test("match null -> no query issued, returns null", async () => {
  let called = false;
  const pool = {
    query: async () => {
      called = true;
    },
  };
  assert.equal(await persistUserMatch({ pool, zaloUserId: "u1", match: null }), null);
  assert.equal(called, false);
});
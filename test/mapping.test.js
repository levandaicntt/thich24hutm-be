const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/db/pool");
const { upsertUser } = require("../src/services/consent");

function mockQuery(t, calls) {
  return mock.method(pool, "query", async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [{ id: 1 }] };
  });
}

test("upsertUser persists oa_user_id when provided", async (t) => {
  const calls = [];
  mockQuery(t, calls);
  await upsertUser({ zaloUserId: "a-1", phone: null, oaUserId: "b-1" });
  const call = calls[0];
  assert.match(call.sql, /INSERT INTO miniapp_users/);
  assert.match(call.sql, /oa_user_id/);
  assert.deepEqual(call.params, ["a-1", null, null, "b-1"]);
});

test("fill-only: existing oa_user_id wins (COALESCE existing first)", async (t) => {
  const calls = [];
  mockQuery(t, calls);
  await upsertUser({ zaloUserId: "a-1", phone: null, oaUserId: "b-A" });
  await upsertUser({ zaloUserId: "a-1", phone: null, oaUserId: "b-B" });
  const sql = calls[1].sql;
  assert.match(
    sql,
    /oa_user_id\s*=\s*COALESCE\(miniapp_users\.oa_user_id,\s*EXCLUDED\.oa_user_id\)/i
  );
  assert.doesNotMatch(
    sql,
    /oa_user_id\s*=\s*EXCLUDED\.oa_user_id/i
  );
  assert.equal(calls[1].params[3], "b-B");
});

test("omitted oa_user_id -> NULL param (NULL + NULL stays NULL)", async (t) => {
  const calls = [];
  mockQuery(t, calls);
  await upsertUser({ zaloUserId: "a-2", phone: null });
  assert.deepEqual(calls[0].params, ["a-2", null, null, null]);
});

test("explicit null oa_user_id -> NULL param", async (t) => {
  const calls = [];
  mockQuery(t, calls);
  await upsertUser({ zaloUserId: "a-3", phone: null, oaUserId: null });
  assert.equal(calls[0].params[3], null);
});

test("legacy call with only zaloUserId still succeeds (backward compat)", async (t) => {
  const calls = [];
  mockQuery(t, calls);
  const row = await upsertUser({ zaloUserId: "a-4", phone: "0987000000" });
  assert.equal(row.id, 1);
  const call = calls[0];
  assert.match(call.sql, /phone/);
  assert.match(call.sql, /phone_linked/);
  assert.deepEqual(call.params, ["a-4", "0987000000", true, null]);
});
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { markOaFollowed } = require('../src/services/consent');

function capturePool(result) {
  const calls = [];
  return {
    calls,
    query: async (sql, params) => {
      calls.push({ sql, params });
      return { rows: result };
    },
  };
}

test('markOaFollowed upserts zalo_users with is_follow=TRUE', async () => {
  const pool = capturePool([{ id: 7 }]);
  const row = await markOaFollowed({ pool, oaUserId: 'oa-1' });
  assert.deepEqual(row, { id: 7 });
  const call = pool.calls[0];
  assert.match(call.sql, /INSERT INTO zalo_users/);
  assert.match(call.sql, /VALUES \(\$1, 'active', TRUE, NULL\)/);
  assert.match(call.sql, /ON CONFLICT \(zalo_oa_user_id\)/);
  assert.deepEqual(call.params, ['oa-1']);
});

test('markOaFollowed conflict only flips is_follow, never touches phone/status', async () => {
  const pool = capturePool([{ id: 7 }]);
  await markOaFollowed({ pool, oaUserId: 'oa-1' });
  const sql = pool.calls[0].sql;
  assert.match(sql, /DO UPDATE SET is_follow = TRUE, updated_at = NOW\(\)/);
  assert.doesNotMatch(sql, /phone\s*=\s*EXCLUDED\.phone/i);
  assert.doesNotMatch(sql, /status\s*=\s*EXCLUDED/i);
});

test('markOaFollowed null oaUserId -> no query, returns null', async () => {
  let called = false;
  const pool = {
    query: async () => {
      called = true;
    },
  };
  const result = await markOaFollowed({ pool, oaUserId: null });
  assert.equal(result, null);
  assert.equal(called, false);
});

test('markOaFollowed empty oaUserId -> no query, returns null', async () => {
  let called = false;
  const pool = {
    query: async () => {
      called = true;
    },
  };
  const result = await markOaFollowed({ pool, oaUserId: '' });
  assert.equal(result, null);
  assert.equal(called, false);
});

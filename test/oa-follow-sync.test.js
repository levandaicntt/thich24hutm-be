const { test } = require('node:test');
const assert = require('node:assert/strict');

const { markOaFollowed } = require('../src/services/consent');

const CONSENTED_AT = '2026-09-22T04:00:00.000+07:00';

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

test('markOaFollowed upserts zalo_users with is_follow=TRUE and followed_at=consented_at', async () => {
  const pool = capturePool([{ id: 7 }]);
  const row = await markOaFollowed({ pool, oaUserId: 'oa-1', consentedAt: CONSENTED_AT });
  assert.deepEqual(row, { id: 7 });
  const call = pool.calls[0];
  assert.match(call.sql, /INSERT INTO zalo_users/);
  assert.match(call.sql, /followed_at/);
  assert.match(call.sql, /VALUES \(\$1, 'active', TRUE, NULL, \$2\)/);
  assert.match(call.sql, /ON CONFLICT \(zalo_oa_user_id\)/);
  assert.deepEqual(call.params, ['oa-1', CONSENTED_AT]);
});

test('markOaFollowed only refreshes followed_at on false->true flip, never on repeat true', async () => {
  const pool = capturePool([{ id: 7 }]);
  await markOaFollowed({ pool, oaUserId: 'oa-1', consentedAt: CONSENTED_AT });
  const sql = pool.calls[0].sql;
  assert.match(sql, /followed_at = CASE/);
  assert.match(sql, /WHEN zalo_users\.is_follow IS FALSE THEN EXCLUDED\.followed_at/);
  assert.match(sql, /ELSE zalo_users\.followed_at/);
});

test('markOaFollowed conflict only flips is_follow, never touches phone/status', async () => {
  const pool = capturePool([{ id: 7 }]);
  await markOaFollowed({ pool, oaUserId: 'oa-1', consentedAt: CONSENTED_AT });
  const sql = pool.calls[0].sql;
  assert.match(sql, /DO UPDATE SET/);
  assert.match(sql, /is_follow\s*=\s*TRUE/);
  assert.match(sql, /updated_at\s*=\s*NOW\(\)/);
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
  const result = await markOaFollowed({ pool, oaUserId: null, consentedAt: CONSENTED_AT });
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
  const result = await markOaFollowed({ pool, oaUserId: '', consentedAt: CONSENTED_AT });
  assert.equal(result, null);
  assert.equal(called, false);
});

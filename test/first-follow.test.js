const { test } = require('node:test');
const assert = require('node:assert/strict');

const { insertFirstFollowLocation } = require('../src/services/consent');

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

const ARGS = {
  zaloUserId: 'user-1',
  latitude: 10.8,
  longitude: 106.6,
  accuracy: 20,
  capturedAt: '2026-09-16T08:00:00.000Z',
};

test('first valid follow/location inserts snapshot', async () => {
  const pool = capturePool([{ id: 1 }]);
  const inserted = await insertFirstFollowLocation({ pool, ...ARGS });
  assert.deepEqual(inserted, { id: 1 });
  const call = pool.calls[0];
  assert.match(call.sql, /INSERT INTO first_follow_locations/);
  assert.deepEqual(call.params, ['user-1', 10.8, 106.6, 20, '2026-09-16T08:00:00.000Z']);
});

test('SQL uses ON CONFLICT (zalo_user_id) DO NOTHING', async () => {
  const pool = capturePool([{ id: 1 }]);
  await insertFirstFollowLocation({ pool, ...ARGS });
  assert.match(pool.calls[0].sql, /ON CONFLICT \(zalo_user_id\) DO NOTHING/i);
});

test('duplicate zalo_user_id does not create a second row', async () => {
  const pool = capturePool([]);
  const inserted = await insertFirstFollowLocation({ pool, ...ARGS });
  assert.equal(inserted, null);
});

test('second location cannot overwrite first location', async () => {
  const first = capturePool([{ id: 1 }]);
  await insertFirstFollowLocation({ pool: first, ...ARGS });
  const second = capturePool([]);
  const secondResult = await insertFirstFollowLocation({
    pool: second,
    ...ARGS,
    latitude: 21.0,
    longitude: 105.8,
  });
  assert.equal(secondResult, null);
  assert.match(second.calls[0].sql, /DO NOTHING/i);
  assert.doesNotMatch(second.calls[0].sql, /UPDATE/i);
});

test('snapshot stores accuracy when payload provides one', async () => {
  const pool = capturePool([{ id: 1 }]);
  await insertFirstFollowLocation({ pool, ...ARGS });
  assert.equal(pool.calls[0].params[3], 20);
});

test('snapshot stores null accuracy when payload has none', async () => {
  const pool = capturePool([{ id: 1 }]);
  await insertFirstFollowLocation({ pool, ...ARGS, accuracy: null });
  assert.equal(pool.calls[0].params[3], null);
});

test('mocked concurrent inserts collapse to a single logical snapshot', async () => {
  const pool = capturePool([]);
  const [a, b] = await Promise.all([
    insertFirstFollowLocation({ pool, ...ARGS }),
    insertFirstFollowLocation({ pool, ...ARGS }),
  ]);
  assert.equal(a, null);
  assert.equal(b, null);
  for (const call of pool.calls) {
    assert.match(call.sql, /ON CONFLICT \(zalo_user_id\) DO NOTHING/i);
    assert.equal(call.params[0], 'user-1');
  }
});

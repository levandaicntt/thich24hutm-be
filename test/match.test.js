const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  findNearestPharmacy,
  resolveMatch,
  matchUserBySnapshot,
} = require('../src/services/pharmacy');

function mockPool(rows) {
  return {
    query: async (sql, params) => ({ rows, params }),
  };
}

function routingPool({ snapshots = [], pharmacies = [], rejectConsent = true } = {}) {
  return {
    query: async (sql, params) => {
      if (rejectConsent && sql.includes('zalo_user_consents')) {
        throw new Error('must not fall back to zalo_user_consents');
      }
      if (sql.includes('FROM first_follow_locations')) {
        return { rows: snapshots, params };
      }
      if (sql.includes('FROM pharmacy_locations')) {
        return { rows: pharmacies, params };
      }
      throw new Error(`unexpected sql: ${sql}`);
    },
  };
}

function nearest(pharmacyId, branchId, distanceMeters) {
  return { pharmacy_id: pharmacyId, kiotviet_branch_id: branchId, distance_meters: distanceMeters };
}

test('distance < 50m -> match', () => {
  const result = resolveMatch(nearest(1, 123, 32.54), null, 50);
  assert.equal(result.matched, true);
  assert.equal(result.pharmacy_id, 1);
  assert.equal(result.kiotviet_branch_id, 123);
  assert.equal(result.distance_meters, 32.5);
});

test('distance exactly 50m -> match (inclusive boundary)', () => {
  const result = resolveMatch(nearest(1, 123, 50), null, 50);
  assert.equal(result.matched, true);
  assert.equal(result.distance_meters, 50);
});

test('distance > 50m -> no match', () => {
  const result = resolveMatch(nearest(1, 123, 50.1), null, 50);
  assert.deepEqual(result, {
    matched: false,
    pharmacy_id: null,
    kiotviet_branch_id: null,
    distance_meters: null,
  });
});

test('accuracy <= 50m -> normal matching', () => {
  const result = resolveMatch(nearest(2, 456, 30), 50, 50);
  assert.equal(result.matched, true);
  assert.equal(result.pharmacy_id, 2);
});

test('accuracy > 50m -> no match with observability fields', () => {
  const result = resolveMatch(nearest(1, 123, 32.5), 80, 50);
  assert.equal(result.matched, false);
  assert.equal(result.pharmacy_id, 1);
  assert.equal(result.kiotviet_branch_id, 123);
  assert.equal(result.distance_meters, 32.5);
  assert.equal(result.accuracy_exceeds_threshold, true);
  assert.equal(result.accuracy_meters, 80);
});

test('no nearest pharmacy -> no match', () => {
  const result = resolveMatch(null, null, 50);
  assert.deepEqual(result, {
    matched: false,
    pharmacy_id: null,
    kiotviet_branch_id: null,
    distance_meters: null,
  });
});

test('threshold override is respected (200m)', () => {
  const under = resolveMatch(nearest(1, 123, 100.5), null, 200);
  assert.equal(under.matched, true);
  const over = resolveMatch(nearest(1, 123, 250), null, 200);
  assert.equal(over.matched, false);
});

test('findNearestPharmacy selects nearest active pharmacy', async () => {
  const pool = mockPool([
    { id: 1, kiotviet_branch_id: 101, latitude: 10.81, longitude: 106.6 },
    { id: 2, kiotviet_branch_id: 202, latitude: 10.82, longitude: 106.6 },
  ]);
  const nearestResult = await findNearestPharmacy(pool, { lat: 10.812, lng: 106.6 });
  assert.equal(nearestResult.pharmacy_id, 1);
  assert.equal(nearestResult.kiotviet_branch_id, 101);
});

test('findNearestPharmacy only queries active pharmacies', async () => {
  let sql = '';
  const pool = {
    query: async (q) => {
      sql = q;
      return { rows: [] };
    },
  };
  await findNearestPharmacy(pool, { lat: 10.8, lng: 106.6 });
  assert.match(sql, /FROM pharmacy_locations/);
  assert.match(sql, /is_active\s*=\s*TRUE/i);
});

test('no active pharmacy -> nearest is null -> no match', async () => {
  const pool = mockPool([]);
  const nearestResult = await findNearestPharmacy(pool, { lat: 10.8, lng: 106.6 });
  assert.equal(nearestResult, null);
  const result = resolveMatch(nearestResult, null, 50);
  assert.equal(result.matched, false);
});

test('invalid GPS -> no nearest -> no match', async () => {
  const pool = mockPool([{ id: 1, kiotviet_branch_id: 101, latitude: 10.81, longitude: 106.6 }]);
  const nearestResult = await findNearestPharmacy(pool, { lat: 999, lng: 106.6 });
  assert.equal(nearestResult, null);
});

test('null GPS -> no nearest -> no match', async () => {
  const nearestResult = await findNearestPharmacy(mockPool([]), { lat: null, lng: null });
  assert.equal(nearestResult, null);
});

test('match uses snapshot, not latest consent location', async () => {
  const pool = routingPool({
    snapshots: [{ latitude: 10.8, longitude: 106.6, accuracy: null }],
    pharmacies: [
      { id: 1, kiotviet_branch_id: 123, latitude: 10.8, longitude: 106.60001 },
      { id: 2, kiotviet_branch_id: 456, latitude: 10.8, longitude: 106.61 },
    ],
  });
  const result = await matchUserBySnapshot(pool, { zaloUserId: 'user-1' });
  assert.equal(result.matched, true);
  assert.equal(result.pharmacy_id, 1);
});

test('match never falls back to zalo_user_consents', async () => {
  const pool = routingPool({
    snapshots: [],
    pharmacies: [{ id: 1, kiotviet_branch_id: 123, latitude: 10.8, longitude: 106.6 }],
  });
  const result = await matchUserBySnapshot(pool, { zaloUserId: 'user-1' });
  assert.equal(result.matched, false);
});

test('no snapshot -> no match (null fields)', async () => {
  const pool = routingPool({ snapshots: [] });
  const result = await matchUserBySnapshot(pool, { zaloUserId: 'user-1' });
  assert.deepEqual(result, {
    matched: false,
    pharmacy_id: null,
    kiotviet_branch_id: null,
    distance_meters: null,
  });
});

test('invalid snapshot GPS -> no match', async () => {
  const pool = routingPool({ snapshots: [{ latitude: 999, longitude: 106.6, accuracy: null }] });
  const result = await matchUserBySnapshot(pool, { zaloUserId: 'user-1' });
  assert.equal(result.matched, false);
});

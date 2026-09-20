const { haversineMeters, isValidCoordinate } = require("../utils/geo");
const { getMaxStoreDistanceMeters } = require("../config/distance");

function roundMeters(value) {
  return Math.round(value * 10) / 10;
}

function noMatch() {
  return {
    matched: false,
    pharmacy_id: null,
    kiotviet_branch_id: null,
    distance_meters: null,
  };
}

async function findNearestPharmacy(pool, { lat, lng }) {
  if (!isValidCoordinate(lat, lng)) {
    return null;
  }
  const { rows } = await pool.query(
    `SELECT id, kiotviet_branch_id, latitude, longitude
     FROM pharmacy_locations
     WHERE is_active = TRUE`
  );

  let nearest = null;
  for (const row of rows) {
    const distance = haversineMeters(lat, lng, row.latitude, row.longitude);
    if (distance === null) {
      continue;
    }
    if (nearest === null || distance < nearest.distance_meters) {
      nearest = {
        pharmacy_id: row.id,
        kiotviet_branch_id: row.kiotviet_branch_id,
        distance_meters: distance,
      };
    }
  }
  return nearest;
}

function resolveMatch(nearest, accuracy, maxDistanceMeters) {
  if (!nearest) {
    return noMatch();
  }

  const distance = nearest.distance_meters;
  const accuracyExceeds =
    typeof accuracy === "number" &&
    Number.isFinite(accuracy) &&
    accuracy > maxDistanceMeters;

  if (accuracyExceeds) {
    return {
      matched: false,
      pharmacy_id: nearest.pharmacy_id,
      kiotviet_branch_id: nearest.kiotviet_branch_id,
      distance_meters: roundMeters(distance),
      accuracy_exceeds_threshold: true,
      accuracy_meters: accuracy,
    };
  }

  if (distance > maxDistanceMeters) {
    return noMatch();
  }

  return {
    matched: true,
    pharmacy_id: nearest.pharmacy_id,
    kiotviet_branch_id: nearest.kiotviet_branch_id,
    distance_meters: roundMeters(distance),
  };
}

async function matchUserBySnapshot(pool, { zaloUserId }) {
  const { rows } = await pool.query(
    `SELECT latitude, longitude, accuracy
     FROM first_follow_locations
     WHERE zalo_user_id = $1`,
    [zaloUserId]
  );
  const snapshot = rows[0] ?? null;
  if (!snapshot || !isValidCoordinate(snapshot.latitude, snapshot.longitude)) {
    return noMatch();
  }
  const nearest = await findNearestPharmacy(pool, {
    lat: snapshot.latitude,
    lng: snapshot.longitude,
  });
  return resolveMatch(nearest, snapshot.accuracy, getMaxStoreDistanceMeters());
}

module.exports = { findNearestPharmacy, resolveMatch, matchUserBySnapshot };
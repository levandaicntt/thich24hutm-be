const pool = require("../db/pool");

async function upsertUser({ zaloUserId, phone, oaUserId = null }) {
  const phoneLinked = phone != null ? true : null;
  const { rows } = await pool.query(
    `INSERT INTO miniapp_users (zalo_user_id, phone, phone_linked, oa_user_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (zalo_user_id)
     DO UPDATE SET
       phone        = COALESCE(EXCLUDED.phone, miniapp_users.phone),
       phone_linked = COALESCE(EXCLUDED.phone_linked, miniapp_users.phone_linked),
       oa_user_id   = COALESCE(miniapp_users.oa_user_id, EXCLUDED.oa_user_id),
       updated_at   = NOW()
     RETURNING *`,
    [zaloUserId, phone ?? null, phoneLinked, oaUserId ?? null]
  );
  return rows[0];
}

async function insertConsent({
  zaloUserId,
  location,
  networkType,
  oaFollowed,
  deviceInfo,
  consentedAt,
}) {
  const oaFollowedValue =
    oaFollowed === undefined || oaFollowed === null
      ? null
      : Boolean(oaFollowed);

  const networkTypeValue =
    networkType === undefined || networkType === null ? null : networkType;

  const deviceInfoValue =
    deviceInfo === undefined || deviceInfo === null
      ? null
      : JSON.stringify(deviceInfo);

  const { rows } = await pool.query(
    `INSERT INTO zalo_user_consents
       (zalo_user_id, location, network_type, oa_followed, device_info, consented_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (zalo_user_id)
     DO UPDATE SET
       location      = COALESCE(EXCLUDED.location, zalo_user_consents.location),
       network_type  = COALESCE(EXCLUDED.network_type, zalo_user_consents.network_type),
       oa_followed   = COALESCE(EXCLUDED.oa_followed, zalo_user_consents.oa_followed),
       device_info   = COALESCE(EXCLUDED.device_info, zalo_user_consents.device_info),
       consented_at  = EXCLUDED.consented_at
     RETURNING id`,
    [
      zaloUserId,
      location ? JSON.stringify(location) : null,
      networkTypeValue,
      oaFollowedValue,
      deviceInfoValue,
      consentedAt,
    ]
  );
  return rows[0];
}

async function insertFirstFollowLocation({
  pool,
  zaloUserId,
  latitude,
  longitude,
  accuracy,
  capturedAt,
}) {
  const { rows } = await pool.query(
    `INSERT INTO first_follow_locations
       (zalo_user_id, latitude, longitude, accuracy, captured_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (zalo_user_id) DO NOTHING
     RETURNING id`,
    [zaloUserId, latitude, longitude, accuracy ?? null, capturedAt]
  );
  return rows[0] ?? null;
}

async function persistUserMatch({ pool, zaloUserId, match }) {
  if (!match || match.matched !== true) {
    return null;
  }
  const { rows } = await pool.query(
    `UPDATE miniapp_users
     SET matched_pharmacy_id = $2,
         matched_at          = NOW(),
         match_distance_meters = $3,
         customer_matched    = TRUE,
         updated_at          = NOW()
     WHERE zalo_user_id = $1
     RETURNING *`,
    [zaloUserId, match.pharmacy_id ?? null, match.distance_meters ?? null]
  );
  return rows[0] ?? null;
}

module.exports = {
  upsertUser,
  insertConsent,
  insertFirstFollowLocation,
  persistUserMatch,
};

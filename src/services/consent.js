const pool = require("../db/pool");

async function upsertUser({ zaloUserId, phone }) {
  const phoneLinked = phone != null ? true : null;
  const { rows } = await pool.query(
    `INSERT INTO zalo_users (zalo_user_id, phone, phone_linked)
     VALUES ($1, $2, $3)
     ON CONFLICT (zalo_user_id)
     DO UPDATE SET
       phone        = COALESCE(EXCLUDED.phone, zalo_users.phone),
       phone_linked = COALESCE(EXCLUDED.phone_linked, zalo_users.phone_linked),
       updated_at   = NOW()
     RETURNING *`,
    [zaloUserId, phone ?? null, phoneLinked]
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

module.exports = { upsertUser, insertConsent };

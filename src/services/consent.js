const pool = require("../db/pool");

async function upsertUser({ zaloUserId, phone }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let user = (
      await client.query(
        `SELECT * FROM zalo_users WHERE zalo_user_id = $1 FOR UPDATE`,
        [zaloUserId]
      )
    ).rows[0];

    if (!user) {
      user = (
        await client.query(
          `INSERT INTO zalo_users (zalo_user_id, phone, phone_linked)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [zaloUserId, phone, Boolean(phone)]
        )
      ).rows[0];
    } else if (user.phone !== phone) {
      user = (
        await client.query(
          `UPDATE zalo_users
           SET phone = $2, phone_linked = $3, updated_at = NOW()
           WHERE zalo_user_id = $1
           RETURNING *`,
          [zaloUserId, phone, Boolean(phone)]
        )
      ).rows[0];
    }
    await client.query("COMMIT");
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function insertConsent({
  zaloUserId,
  location,
  networkType,
  oaFollowed,
  deviceInfo,
  consentedAt,
}) {
  const result = await pool.query(
    `INSERT INTO zalo_user_consents
       (zalo_user_id, location, network_type, oa_followed, device_info, consented_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      zaloUserId,
      location ? JSON.stringify(location) : null,
      networkType || "unknown",
      Boolean(oaFollowed),
      deviceInfo ? JSON.stringify(deviceInfo) : "{}",
      consentedAt,
    ]
  );
  return result.rows[0];
}

module.exports = { upsertUser, insertConsent };
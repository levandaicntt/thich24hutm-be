async function resolveOaUid({ pool, user_id_by_app }) {
  const { rows } = await pool.query(
    `SELECT oa_user_id
     FROM miniapp_users
     WHERE zalo_user_id = $1
     LIMIT 1`,
    [user_id_by_app]
  );
  return rows[0]?.oa_user_id ?? null;
}

module.exports = { resolveOaUid };

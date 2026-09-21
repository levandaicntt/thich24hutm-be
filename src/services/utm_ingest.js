const crypto = require("crypto");
const { toCanonicalPhone } = require("../utils/phone");
const { resolveOaUid } = require("./zalo_link");

const UTM_SOURCE = "utm_mini_app";

function toIsoUtcSeconds(occurredAt) {
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`invalid occurred_at: ${occurredAt}`);
  }
  return date.toISOString().slice(0, 19) + "+00:00";
}

function deriveUtmEventId({ uid, phone, occurredAt, source = UTM_SOURCE }) {
  const canonical = toCanonicalPhone(phone);
  const payload = [uid, canonical || "", toIsoUtcSeconds(occurredAt), source].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function ingestUtmEvent({ pool, uid, phone, occurredAt, source = UTM_SOURCE }) {
  const canonical = toCanonicalPhone(phone);
  const occurred = new Date(occurredAt);
  const eventId = deriveUtmEventId({ uid, phone: canonical, occurredAt: occurred, source });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const dup = await client.query(
      `SELECT event_id, applied, customer_id
       FROM utm_events
       WHERE event_id = $1`,
      [eventId]
    );
    if (dup.rows.length > 0) {
      const row = dup.rows[0];
      await client.query("COMMIT");
      return {
        eventId,
        duplicate: true,
        applied: false,
        stale: false,
        matched: row.customer_id != null,
      };
    }

    const latest = await client.query(
      `SELECT MAX(occurred_at) AS ts
       FROM utm_events
       WHERE oa_user_id = $1`,
      [uid]
    );
    const latestTs = latest.rows[0]?.ts ?? null;
    const stale = latestTs != null && occurred.getTime() < new Date(latestTs).getTime();
    if (stale) {
      await client.query(
        `INSERT INTO utm_events
           (event_id, oa_user_id, phone, source, occurred_at, customer_id, applied)
         VALUES ($1, $2, $3, $4, $5, NULL, FALSE)`,
        [eventId, uid, canonical, source, occurred]
      );
      await client.query("COMMIT");
      return { eventId, duplicate: false, stale: true, applied: false, matched: false };
    }

await client.query(
      `INSERT INTO zalo_users (zalo_oa_user_id, status, is_follow, phone)
       VALUES ($1, 'active', FALSE, $2)
       ON CONFLICT (zalo_oa_user_id)
       DO UPDATE SET phone = EXCLUDED.phone, updated_at = NOW()
       RETURNING id`,
      [uid, canonical]
    );

    await client.query(
      `INSERT INTO utm_events
         (event_id, oa_user_id, phone, source, occurred_at, customer_id, applied)
       VALUES ($1, $2, $3, $4, $5, NULL, TRUE)`,
      [eventId, uid, canonical, source, occurred]
    );

    await client.query("COMMIT");
    return { eventId, duplicate: false, stale: false, applied: true, matched: false };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function maybeIngestPhoneShared({ pool, user_id_by_app, phone, occurredAt, source = UTM_SOURCE }) {
  if (!phone) {
    return { skipped: true, reason: "phone-missing" };
  }
  const canonical = toCanonicalPhone(phone);
  if (!canonical) {
    return { skipped: true, reason: "phone-invalid" };
  }
  const oaUserId = await resolveOaUid({ pool, user_id_by_app });
  if (!oaUserId) {
    console.log(`[utm-ingest] skipped no-oa-link app=${user_id_by_app}`);
    return { skipped: true, reason: "no-oa-link" };
  }
  return ingestUtmEvent({ pool, uid: oaUserId, phone: canonical, occurredAt, source });
}

module.exports = { ingestUtmEvent, maybeIngestPhoneShared, deriveUtmEventId, toIsoUtcSeconds, UTM_SOURCE };
const env = require("../config/env");
const { resolveOaUid } = require("./zalo_link");

const NOTIFY_TIMEOUT_MS = 10000;
const UTM_SOURCE = "utm_mini_app";

async function pushUtmEvent({
  uid,
  phone,
  occurredAt,
  source = UTM_SOURCE,
  webhookUrl = env.NOTIFY_WEBHOOK_URL,
  webhookKey = env.NOTIFY_WEBHOOK_KEY,
  fetchImpl = globalThis.fetch,
}) {
  const payload = { uid, phone: phone || null, source, occurred_at: occurredAt };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS);
  try {
    const res = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-UTM-Key": webhookKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`UTM webhook rejected ${res.status}`);
      err.status = res.status;
      err.response = body;
      throw err;
    }
    console.log(
      `[utm-push] sent uid=${uid} status=${res.status} ` +
        `accepted=${body?.status} applied=${body?.applied} matched=${body?.matched}`
    );
    return { skipped: false, status: res.status, response: body };
  } finally {
    clearTimeout(timer);
  }
}

async function maybePushPhoneShared({
  pool,
  user_id_by_app,
  phone,
  occurredAt,
  webhookUrl = env.NOTIFY_WEBHOOK_URL,
  webhookKey = env.NOTIFY_WEBHOOK_KEY,
  pushImpl = pushUtmEvent,
}) {
  if (!webhookUrl || !webhookKey) {
    return { skipped: true, reason: "notify-disabled" };
  }
  if (!phone) {
    return { skipped: true, reason: "phone-missing" };
  }
  const oaUserId = await resolveOaUid({ pool, user_id_by_app });
  if (!oaUserId) {
    console.log(`[utm-push] skipped no-oa-link app=${user_id_by_app}`);
    return { skipped: true, reason: "no-oa-link" };
  }
  return pushImpl({ uid: oaUserId, phone, occurredAt });
}

module.exports = { pushUtmEvent, maybePushPhoneShared, UTM_SOURCE, NOTIFY_TIMEOUT_MS };

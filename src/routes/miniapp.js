const { z } = require("zod");
const { Router } = require("express");
const auth = require("../middleware/auth");
const { ok, fail } = require("../utils/response");
const { decodePhoneToken, decodeLocationToken } = require("../services/zalo");
const {
  upsertUser,
  insertConsent,
  insertFirstFollowLocation,
  persistUserMatch,
} = require("../services/consent");
const { maybeIngestPhoneShared } = require("../services/utm_ingest");
const { matchUserBySnapshot } = require("../services/pharmacy");
const { isValidCoordinate } = require("../utils/geo");
const pool = require("../db/pool");

const router = Router();

const phoneBody = z.object({
  phone_token: z.string().min(1),
});

const consentsBody = z.object({
  location_token: z.string().min(1).nullable().optional(),
  network_type: z.string().optional(),
  oa_followed: z.boolean().optional(),
  device_info: z.record(z.unknown()).nullable().optional(),
  consented_at: z.string().datetime({ offset: true }),
  user_id_by_app: z.string().nullable().optional(),
  oa_user_id: z.string().nullable().optional(),
});

function bearer(req) {
  return req.headers.authorization.replace(/^Bearer\s+/i, "");
}

router.post("/phone", auth, async (req, res, next) => {
  try {
    const parsed = phoneBody.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0]?.message || "Invalid body");
    }
    const { phone_token } = parsed.data;
    const data = await decodePhoneToken(bearer(req), phone_token);
    const phone = data?.number || null;
    const user = await upsertUser({ zaloUserId: req.zaloUserId, phone });
    await maybeIngestPhoneShared({
      pool,
      user_id_by_app: req.zaloUserId,
      phone,
      occurredAt: new Date().toISOString(),
    })
      .then((res) =>
        res?.skipped
          ? console.log(`[utm-ingest] skipped uid=${req.zaloUserId} reason=${res.reason}`)
          : console.log(
              `[utm-ingest] event=${res.eventId} uid=${req.zaloUserId} ` +
                `applied=${res.applied} duplicate=${res.duplicate} stale=${res.stale}`
            )
      )
      .catch((err) =>
        console.error(`[utm-ingest] failed uid=${req.zaloUserId}: ${err.message}`)
      );
    ok(res, {
      success: true,
      phone_linked: user.phone_linked,
      customer_matched: user.customer_matched,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/consents", auth, async (req, res, next) => {
  try {
    const parsed = consentsBody.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, parsed.error.issues[0]?.message || "Invalid body");
    }
    const {
      location_token,
      network_type,
      oa_followed,
      device_info,
      consented_at,
      user_id_by_app,
      oa_user_id,
    } = parsed.data;

    let location = null;
    if (location_token) {
      location = await decodeLocationToken(bearer(req), location_token);
    }

    console.log(
      `[consents] zaloUserId=${req.zaloUserId} user_id_by_app=${user_id_by_app ?? "NULL"} oa_user_id=${oa_user_id ?? "NULL"}`
    );

    if (user_id_by_app && user_id_by_app !== req.zaloUserId) {
      console.warn(
        `[consents] user_id_by_app mismatch client=${user_id_by_app} token=${req.zaloUserId}`
      );
    }

    await upsertUser({
      zaloUserId: req.zaloUserId,
      phone: null,
      oaUserId: oa_user_id || null,
    });
    await insertConsent({
      zaloUserId: req.zaloUserId,
      location,
      networkType: network_type,
      oaFollowed: oa_followed,
      deviceInfo: device_info,
      consentedAt: consented_at,
    });
    if (oa_followed === true && location) {
      const { latitude, longitude, accuracy } = location;
      if (isValidCoordinate(latitude, longitude)) {
        await insertFirstFollowLocation({
          pool,
          zaloUserId: req.zaloUserId,
          latitude,
          longitude,
          accuracy,
          capturedAt: consented_at,
        });
      }
    }
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/location/match", auth, async (req, res, next) => {
  try {
    const data = await matchUserBySnapshot(pool, { zaloUserId: req.zaloUserId });
    if (data.matched) {
      await persistUserMatch({
        pool,
        zaloUserId: req.zaloUserId,
        match: data,
      });
    }
    return ok(res, data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
const { z } = require("zod");
const { Router } = require("express");
const auth = require("../middleware/auth");
const { ok, fail } = require("../utils/response");
const { decodePhoneToken, decodeLocationToken } = require("../services/zalo");
const { upsertUser, insertConsent } = require("../services/consent");

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
    const { location_token, network_type, oa_followed, device_info, consented_at } =
      parsed.data;

    let location = null;
    if (location_token) {
      location = await decodeLocationToken(bearer(req), location_token);
    }

    await upsertUser({ zaloUserId: req.zaloUserId, phone: null });
    await insertConsent({
      zaloUserId: req.zaloUserId,
      location,
      networkType: network_type,
      oaFollowed: oa_followed,
      deviceInfo: device_info,
      consentedAt: consented_at,
    });
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
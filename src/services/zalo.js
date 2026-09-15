const crypto = require("crypto");
const env = require("../config/env");

const ZALO_TIMEOUT_MS = 10000;

async function zaloFetch(path, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ZALO_TIMEOUT_MS);
  try {
    const res = await fetch(`https://graph.zalo.me${path}`, { headers, signal: controller.signal });
    const body = await res.json().catch(() => null);
    console.log(`[zalo] ${path} status=${res.status} body=${JSON.stringify(body)?.slice(0, 200)}`);
    return { res, body };
  } finally {
    clearTimeout(timer);
  }
}

function computeAppsecretProof(accessToken) {
  return crypto
    .createHmac("sha256", env.ZALO_APP_SECRET)
    .update(accessToken)
    .digest("hex");
}

async function getZaloProfile(accessToken) {
  const appsecretProof = computeAppsecretProof(accessToken);
  const { res, body } = await zaloFetch("/v2.0/me?fields=id,name", {
    access_token: accessToken,
    appsecret_proof: appsecretProof,
  });
  if (!res.ok) {
    throw new Error(`Zalo profile request failed (${res.status})`);
  }
  if (typeof body.error === "number" && body.error !== 0) {
    throw new Error(`Zalo error ${body.error}: ${body.message}`);
  }
  return body;
}

async function decodePhoneToken(accessToken, phoneToken) {
  const { res, body } = await zaloFetch("/v2.0/me/info", {
    access_token: accessToken,
    code: phoneToken,
    secret_key: env.ZALO_APP_SECRET,
  });
  if (!res.ok) {
    throw new Error(`Zalo phone decode failed (${res.status})`);
  }
  if (typeof body.error === "number" && body.error !== 0) {
    const err = new Error(body.message || `Zalo phone error ${body.error}`);
    err.code = body.error;
    throw err;
  }
  return body.data;
}

async function decodeLocationToken(accessToken, locationToken) {
  const { res, body } = await zaloFetch("/v2.0/me/info", {
    access_token: accessToken,
    code: locationToken,
    secret_key: env.ZALO_APP_SECRET,
  });
  if (!res.ok) {
    throw new Error(`Zalo location decode failed (${res.status})`);
  }
  if (typeof body.error === "number" && body.error !== 0) {
    const err = new Error(body.message || `Zalo location error ${body.error}`);
    err.code = body.error;
    throw err;
  }
  return body.data;
}

module.exports = { getZaloProfile, decodePhoneToken, decodeLocationToken };
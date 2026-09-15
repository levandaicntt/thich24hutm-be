const crypto = require("crypto");
const env = require("../config/env");

function computeAppsecretProof(accessToken) {
  return crypto
    .createHmac("sha256", env.ZALO_APP_SECRET)
    .update(accessToken)
    .digest("hex");
}

async function getZaloProfile(accessToken) {
  const appsecretProof = computeAppsecretProof(accessToken);
  const res = await fetch("https://graph.zalo.me/v2.0/me?fields=id,name", {
    headers: {
      access_token: accessToken,
      appsecret_proof: appsecretProof,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zalo profile request failed (${res.status}): ${text}`);
  }
  const body = await res.json();
  if (typeof body.error === "number" && body.error !== 0) {
    throw new Error(`Zalo error ${body.error}: ${body.message}`);
  }
  return body;
}

async function decodePhoneToken(accessToken, phoneToken) {
  const res = await fetch("https://graph.zalo.me/v2.0/me/info", {
    method: "GET",
    headers: {
      access_token: accessToken,
      code: phoneToken,
      secret_key: env.ZALO_APP_SECRET,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zalo phone decode failed (${res.status}): ${text}`);
  }
  const body = await res.json();
  if (typeof body.error === "number" && body.error !== 0) {
    const err = new Error(body.message || `Zalo phone error ${body.error}`);
    err.code = body.error;
    throw err;
  }
  return body.data;
}

async function decodeLocationToken(accessToken, locationToken) {
  const res = await fetch("https://graph.zalo.me/v2.0/me/info", {
    method: "GET",
    headers: {
      access_token: accessToken,
      code: locationToken,
      secret_key: env.ZALO_APP_SECRET,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zalo location decode failed (${res.status}): ${text}`);
  }
  const body = await res.json();
  if (typeof body.error === "number" && body.error !== 0) {
    const err = new Error(body.message || `Zalo location error ${body.error}`);
    err.code = body.error;
    throw err;
  }
  return body.data;
}

module.exports = { getZaloProfile, decodePhoneToken, decodeLocationToken };
const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const {
  pushUtmEvent,
  maybePushPhoneShared,
  UTM_SOURCE,
  NOTIFY_TIMEOUT_MS,
} = require("../src/services/notify");

const WEBHOOK_URL = "https://notify.example.test/events";
const WEBHOOK_KEY = "test-key";

function okResponse(body = { status: "ok", applied: 1, matched: 1 }) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

function errResponse(status, body = {}) {
  return {
    ok: false,
    status,
    json: async () => body,
  };
}

function captureImpl(calls) {
  return async (url, opts) => {
    calls.push({ url, opts, body: JSON.parse(opts.body) });
    return okResponse();
  };
}

function capturePushImpl(calls) {
  return async (payload) => {
    calls.push(payload);
    return { skipped: false, status: 200, response: okResponse({ status: "ok" }) };
  };
}

function fakePool(rows) {
  return {
    query: async () => ({ rows }),
  };
}

test("UTM_SOURCE is utm_mini_app", () => {
  assert.equal(UTM_SOURCE, "utm_mini_app");
});

test("NOTIFY_TIMEOUT_MS is 10000", () => {
  assert.equal(NOTIFY_TIMEOUT_MS, 10000);
});

test("pushUtmEvent posts correct payload and headers", async () => {
  const calls = [];
  const occurredAt = "2026-09-20T10:00:00.000Z";
  const res = await pushUtmEvent({
    uid: "oa-user-1",
    phone: "84901234567",
    occurredAt,
    webhookUrl: WEBHOOK_URL,
    webhookKey: WEBHOOK_KEY,
    fetchImpl: captureImpl(calls),
  });

  assert.equal(calls.length, 1);
  const { url, opts, body } = calls[0];
  assert.equal(url, WEBHOOK_URL);
  assert.equal(opts.method, "POST");
  assert.equal(opts.headers["Content-Type"], "application/json");
  assert.equal(opts.headers["X-UTM-Key"], WEBHOOK_KEY);
  assert.deepEqual(body, {
    uid: "oa-user-1",
    phone: "84901234567",
    source: UTM_SOURCE,
    occurred_at: occurredAt,
  });
  assert.equal(res.skipped, false);
  assert.equal(res.status, 200);
});

test("pushUtmEvent sends null phone when absent", async () => {
  const calls = [];
  const occurredAt = "2026-09-20T10:00:00.000Z";
  await pushUtmEvent({
    uid: "oa-user-1",
    phone: null,
    occurredAt,
    webhookUrl: WEBHOOK_URL,
    webhookKey: WEBHOOK_KEY,
    fetchImpl: captureImpl(calls),
  });
  assert.equal(calls[0].body.phone, null);
});

test("pushUtmEvent throws on non-2xx", async () => {
  const caught = [];
  const impl = async () => errResponse(422, { error: "rejected" });
  await assert.rejects(
    pushUtmEvent({
      uid: "oa-user-1",
      phone: "84901234567",
      occurredAt: "2026-09-20T10:00:00.000Z",
      webhookUrl: WEBHOOK_URL,
      webhookKey: WEBHOOK_KEY,
      fetchImpl: impl,
    }),
    (err) => {
      caught.push(err);
      assert.equal(err.status, 422);
      return true;
    }
  );
  assert.equal(caught.length, 1);
});

test("pushUtmEvent propagates network failure", async () => {
  const impl = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(
    pushUtmEvent({
      uid: "oa-user-1",
      phone: "84901234567",
      occurredAt: "2026-09-20T10:00:00.000Z",
      webhookUrl: WEBHOOK_URL,
      webhookKey: WEBHOOK_KEY,
      fetchImpl: impl,
    }),
    /fetch failed/
  );
});

test("pushUtmEvent aborts after 10s timeout", async () => {
  mock.timers.enable({ apis: ["setTimeout"], now: 0 });
  try {
    const impl = async (_url, opts) => {
      await new Promise((resolve, reject) => {
        opts.signal.addEventListener("abort", () =>
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }))
        );
      });
    };
    const pending = pushUtmEvent({
      uid: "oa-user-1",
      phone: "84901234567",
      occurredAt: "2026-09-20T10:00:00.000Z",
      webhookUrl: WEBHOOK_URL,
      webhookKey: WEBHOOK_KEY,
      fetchImpl: impl,
    });
    await mock.timers.tick(NOTIFY_TIMEOUT_MS);
    await assert.rejects(pending, /Aborted/);
  } finally {
    mock.timers.reset();
  }
});

test("maybePushPhoneShared skips when notify disabled", async () => {
  const pushCalls = [];
  const res = await maybePushPhoneShared({
    pool: fakePool([{ oa_user_id: "oa-user-1" }]),
    user_id_by_app: "app-user-1",
    phone: "84901234567",
    occurredAt: "2026-09-20T10:00:00.000Z",
    webhookUrl: "",
    webhookKey: "",
    pushImpl: capturePushImpl(pushCalls),
  });
  assert.deepEqual(res, { skipped: true, reason: "notify-disabled" });
  assert.equal(pushCalls.length, 0);
});

test("maybePushPhoneShared skips when oa link missing", async () => {
  const pushCalls = [];
  const res = await maybePushPhoneShared({
    pool: fakePool([]),
    user_id_by_app: "app-user-1",
    phone: "84901234567",
    occurredAt: "2026-09-20T10:00:00.000Z",
    webhookUrl: WEBHOOK_URL,
    webhookKey: WEBHOOK_KEY,
    pushImpl: capturePushImpl(pushCalls),
  });
  assert.deepEqual(res, { skipped: true, reason: "no-oa-link" });
  assert.equal(pushCalls.length, 0);
});

test("maybePushPhoneShared pushes only when both phone and oa linked", async () => {
  const pushCalls = [];
  const occurredAt = "2026-09-20T10:00:00.000Z";
  const res = await maybePushPhoneShared({
    pool: fakePool([{ oa_user_id: "oa-user-1" }]),
    user_id_by_app: "app-user-1",
    phone: "84901234567",
    occurredAt,
    webhookUrl: WEBHOOK_URL,
    webhookKey: WEBHOOK_KEY,
    pushImpl: capturePushImpl(pushCalls),
  });
  assert.equal(res.skipped, false);
  assert.equal(pushCalls.length, 1);
  assert.equal(pushCalls[0].uid, "oa-user-1");
  assert.equal(pushCalls[0].phone, "84901234567");
});

test("maybePushPhoneShared does NOT push when phone missing", async () => {
  const pushCalls = [];
  const res = await maybePushPhoneShared({
    pool: fakePool([{ oa_user_id: "oa-user-1" }]),
    user_id_by_app: "app-user-1",
    phone: null,
    occurredAt: "2026-09-20T10:00:00.000Z",
    webhookUrl: WEBHOOK_URL,
    webhookKey: WEBHOOK_KEY,
    pushImpl: capturePushImpl(pushCalls),
  });
  assert.equal(res.skipped, true);
  assert.equal(pushCalls.length, 0);
});

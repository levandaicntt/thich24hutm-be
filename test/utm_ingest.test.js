const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  ingestUtmEvent,
  maybeIngestPhoneShared,
  deriveUtmEventId,
  UTM_SOURCE,
} = require("../src/services/utm_ingest");
const { toCanonicalPhone } = require("../src/utils/phone");

function makeFake({ dup = false, latestTs = null, oaRows = [{ oa_user_id: "oa-1" }] } = {}) {
  const calls = [];
  const pool = {
    query: async (sql, params) => {
      calls.push({ conn: false, sql, params });
      if (/FROM miniapp_users/.test(sql)) {
        return { rows: oaRows };
      }
      return { rows: [] };
    },
    connect: async () => {
      calls.push({ conn: true });
      return {
        rollback: async () => {},
        release: async () => {},
        query: async (sql, params) => {
          calls.push({ conn: true, sql, params });
          const s = sql.replace(/\s+/g, " ").trim();
          if (/SELECT event_id, applied, customer_id FROM utm_events WHERE event_id = \$1/.test(s)) {
            return dup
              ? { rows: [{ event_id: "dup", applied: false, customer_id: null }] }
              : { rows: [] };
          }
          if (/SELECT MAX\(occurred_at\) AS ts FROM utm_events WHERE oa_user_id = \$1/.test(s)) {
            return latestTs == null
              ? { rows: [] }
              : { rows: [{ ts: new Date(latestTs) }] };
          }
          if (/INSERT INTO zalo_users/.test(sql)) {
            return { rows: [{ id: 1 }] };
          }
          if (/INSERT INTO utm_events/.test(sql)) {
            return { rows: [{ id: 1 }] };
          }
          return { rows: [] };
        },
      };
    },
  };
  return { pool, calls };
}

const sqls = (calls) =>
  calls
    .filter((c) => c.conn && c.sql)
    .map((c) => c.sql.replace(/\s+/g, " ").trim());

test("toCanonicalPhone: shapes", () => {
  assert.equal(toCanonicalPhone("0901234567"), "0901234567");
  assert.equal(toCanonicalPhone("84901234567"), "0901234567");
  assert.equal(toCanonicalPhone("+84901234567"), "0901234567");
  assert.equal(toCanonicalPhone("090 123 4567"), "0901234567");
  assert.equal(toCanonicalPhone("090-123-4567"), "0901234567");
  assert.equal(toCanonicalPhone("84385953xxx"), null);
  assert.equal(toCanonicalPhone("098AB12345"), null);
  assert.equal(toCanonicalPhone(""), null);
  assert.equal(toCanonicalPhone(null), null);
});

test("deriveUtmEventId is deterministic and phone-shape insensitive", () => {
  const occurredAt = "2026-09-21T09:00:00.000Z";
  const a = deriveUtmEventId({ uid: "oa-1", phone: "0987.000.000", occurredAt });
  const b = deriveUtmEventId({ uid: "oa-1", phone: "+84987000000", occurredAt });
  assert.equal(a, b);
  const later = deriveUtmEventId({ uid: "oa-1", phone: "0987000000", occurredAt: "2026-09-21T10:00:00.000Z" });
  assert.notEqual(a, later);
});

test("ingest success: canonical phone upserted + utm_events applied, never sets customer_id", async () => {
  const { pool, calls } = makeFake();
  const out = await ingestUtmEvent({
    pool,
    uid: "oa-1",
    phone: "84901234567",
    occurredAt: "2026-09-21T09:00:00.000Z",
  });
  assert.equal(out.applied, true);
  assert.equal(out.duplicate, false);
  assert.equal(out.stale, false);
  assert.ok(out.eventId);
  const queries = sqls(calls);
  const upsert = queries.find((q) => q.includes("INSERT INTO zalo_users"));
  assert.ok(upsert, "zalo_users upsert ran");
  assert.match(upsert, /VALUES \(\$1, 'active', FALSE, \$2\)/);
  assert.match(upsert, /ON CONFLICT \(zalo_oa_user_id\)/);
  assert.doesNotMatch(upsert, /customer_id/, "BE must never write customer_id");
  const event = queries.find((q) => q.includes("INSERT INTO utm_events"));
  assert.match(event, /VALUES \(\$1, \$2, \$3, \$4, \$5, NULL, TRUE\)/);
  const upsertParams = calls.find((c) => c.conn && c.sql?.includes("INSERT INTO zalo_users")).params;
  assert.deepEqual(upsertParams, ["oa-1", "0901234567"]);
});

test("ingest duplicate: same event_id is answered without touching zalo_users", async () => {
  const { pool, calls } = makeFake({ dup: true });
  const out = await ingestUtmEvent({
    pool,
    uid: "oa-1",
    phone: "84901234567",
    occurredAt: "2026-09-21T09:00:00.000Z",
  });
  assert.equal(out.duplicate, true);
  assert.equal(out.applied, false);
  const queries = sqls(calls);
  assert.equal(queries.filter((q) => q.includes("INSERT INTO zalo_users")).length, 0);
  assert.equal(queries.filter((q) => q.includes("INSERT INTO utm_events")).length, 0);
});

test("ingest stale: older event is audited applied=false, zalo_users untouched", async () => {
  const { pool, calls } = makeFake({ latestTs: "2026-09-21T10:00:00.000Z" });
  const out = await ingestUtmEvent({
    pool,
    uid: "oa-1",
    phone: "84901234567",
    occurredAt: "2026-09-21T09:00:00.000Z",
  });
  assert.equal(out.stale, true);
  assert.equal(out.applied, false);
  const queries = sqls(calls);
  assert.equal(queries.filter((q) => q.includes("INSERT INTO zalo_users")).length, 0);
  const event = queries.find((q) => q.includes("INSERT INTO utm_events"));
  assert.match(event, /FALSE\)/);
});

test("maybeIngestPhoneShared skips phone-missing", async () => {
  const { pool, calls } = makeFake();
  const res = await maybeIngestPhoneShared({ pool, user_id_by_app: "app-1", phone: null, occurredAt: "x" });
  assert.deepEqual(res, { skipped: true, reason: "phone-missing" });
  assert.equal(calls.filter((c) => c.conn).length, 0);
});

test("maybeIngestPhoneShared skips phone-invalid (masked/landline)", async () => {
  const { pool, calls } = makeFake();
  const res = await maybeIngestPhoneShared({ pool, user_id_by_app: "app-1", phone: "84385953xxx", occurredAt: "x" });
  assert.deepEqual(res, { skipped: true, reason: "phone-invalid" });
  assert.equal(calls.filter((c) => c.conn).length, 0);
});

test("maybeIngestPhoneShared skips no-oa-link before touching the writer", async () => {
  const { pool, calls } = makeFake({ oaRows: [] });
  const res = await maybeIngestPhoneShared({ pool, user_id_by_app: "app-1", phone: "0901234567", occurredAt: "x" });
  assert.deepEqual(res, { skipped: true, reason: "no-oa-link" });
  assert.equal(calls.filter((c) => c.conn).length, 0);
});

test("maybeIngestPhoneShared writes ingest for linked user with canonical phone + UTM_SOURCE", async () => {
  const { pool } = makeFake();
  const res = await maybeIngestPhoneShared({ pool, user_id_by_app: "app-1", phone: "+84901234567", occurredAt: "2026-09-21T09:00:00.000Z" });
  assert.equal(res.skipped, undefined);
  assert.equal(res.applied, true);
  assert.equal(res.eventId, deriveUtmEventId({ uid: "oa-1", phone: "0901234567", occurredAt: "2026-09-21T09:00:00.000Z" }));
});

test("UTM_SOURCE is utm_mini_app", () => {
  assert.equal(UTM_SOURCE, "utm_mini_app");
});
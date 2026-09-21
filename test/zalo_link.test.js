const { test } = require("node:test");
const assert = require("node:assert/strict");

const { resolveOaUid } = require("../src/services/zalo_link");

let traces = [];
const pool = {
  query: async (text, params) => {
    traces.push({ text, params });
    return { rows: [{ oa_user_id: "oa-user-1" }] };
  },
};

test("resolveOaUid returns oa_user_id when link found", async () => {
  const oa = await resolveOaUid({ pool, user_id_by_app: "app-user-1" });
  assert.equal(oa, "oa-user-1");
  assert.equal(traces.length, 1);
  assert.equal(traces[0].text.includes("FROM zalo_users"), true);
  assert.equal(traces[0].text.includes("WHERE zalo_user_id = $1"), true);
  assert.deepEqual(traces[0].params, ["app-user-1"]);
});

test("resolveOaUid returns null when no row", async () => {
  const ntraces = [];
  const npool = {
    query: async (text, params) => {
      ntraces.push({ text, params });
      return { rows: [] };
    },
  };
  const oa = await resolveOaUid({ pool: npool, user_id_by_app: "app-user-1" });
  assert.equal(oa, null);
  assert.equal(ntraces.length, 1);
  assert.equal(ntraces[0].params[0], "app-user-1");
});

test("resolveOaUid returns null when oa_user_id missing", async () => {
  const npool = {
    query: async () => ({ rows: [{ oa_user_id: null }] }),
  };
  const oa = await resolveOaUid({ pool: npool, user_id_by_app: "app-user-1" });
  assert.equal(oa, null);
});

test("resolveOaUid propagates pool failure", async () => {
  const npool = {
    query: async () => {
      throw new Error("db offline");
    },
  };
  await assert.rejects(resolveOaUid({ pool: npool, user_id_by_app: "app-user-1" }), /db offline/);
});

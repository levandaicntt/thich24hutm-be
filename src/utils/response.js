function ok(res, data = null) {
  return res.json({ error: 0, message: "Successful", data });
}

function fail(res, status, message) {
  return res.status(status).json({ error: -1, message, data: null });
}

module.exports = { ok, fail };

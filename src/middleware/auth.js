const { getZaloProfile } = require('../services/zalo');

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res
        .status(401)
        .json({ error: -1, message: 'Missing or invalid Authorization header', data: null });
    }
    const accessToken = match[1];
    const profile = await getZaloProfile(accessToken);
    if (!profile?.id) {
      return res
        .status(401)
        .json({ error: -1, message: 'Could not resolve Zalo user from token', data: null });
    }
    req.zaloUserId = profile.id;
    req.zaloProfile = profile;
    next();
  } catch (err) {
    console.error(`[auth-fail] ${err.message}`, { code: err.code, status: err.status });
    return res.status(401).json({ error: -1, message: err.message || 'Auth failed', data: null });
  }
}

module.exports = auth;

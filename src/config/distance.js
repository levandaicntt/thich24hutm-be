const DEFAULT_MAX_STORE_DISTANCE_METERS = 50;

function getMaxStoreDistanceMeters() {
  const raw = process.env.MAX_STORE_DISTANCE_METERS;
  if (raw === undefined || raw === null || raw.trim() === "") {
    return DEFAULT_MAX_STORE_DISTANCE_METERS;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_MAX_STORE_DISTANCE_METERS;
  }
  return value;
}

module.exports = {
  DEFAULT_MAX_STORE_DISTANCE_METERS,
  getMaxStoreDistanceMeters,
};
function radians(degrees) {
  return (degrees * Math.PI) / 180;
}

function isValidCoordinate(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const EARTH_RADIUS_METERS = 6371000;

function haversineMeters(lat1, lng1, lat2, lng2) {
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    return null;
  }
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

module.exports = { haversineMeters, isValidCoordinate };
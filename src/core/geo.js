// Geo maths. Pure functions, no DOM or Three.js.
// Convention: lon east-positive, prime meridian on +X.
//   x = r cos(lat) cos(lon), y = r sin(lat), z = -r cos(lat) sin(lon)

export const BODY_RADIUS_KM = Object.freeze({ moon: 1737.4, mars: 3389.5 });

const DEG = Math.PI / 180;

/** Converts latitude/longitude in degrees to a point on a sphere of the given radius. */
export function latLonToVector3(latDeg, lonDeg, radius) {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const cosLat = Math.cos(lat);
  return {
    x: radius * cosLat * Math.cos(lon),
    y: radius * Math.sin(lat),
    z: -radius * cosLat * Math.sin(lon),
  };
}

/** Inverse of latLonToVector3. Returns degrees; lon in (-180, 180]. Radius is taken from the vector length. */
export function vector3ToLatLon(v) {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len === 0) return { lat: 0, lon: 0 };
  const lat = Math.asin(Math.max(-1, Math.min(1, v.y / len))) / DEG;
  let lon = Math.atan2(-v.z, v.x) / DEG;
  if (lon === 0) lon = 0; // normalise -0
  return { lat, lon };
}

/** Haversine great-circle distance in km between {lat, lon} points (degrees). */
export function greatCircleKm(a, b, radiusKm) {
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const dLat = lat2 - lat1;
  const dLon = (b.lon - a.lon) * DEG;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const h = Math.min(1, Math.max(0, s));
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

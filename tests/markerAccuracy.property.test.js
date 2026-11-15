import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import missions from '../src/data/missions.json';
import { BODY_RADIUS_KM, greatCircleKm, latLonToVector3, vector3ToLatLon } from '../src/core/geo.js';

// Feature: nasa-space-apps-2026, Property 8: Markers within 100 km of published coordinates
// **Validates: Requirements 3.1, 3.2, 9.3**

const LIMIT_KM = 100;

const markerOf = (m) => {
  // Place the marker on the globe, then read it back, as the renderer does.
  const r = BODY_RADIUS_KM[m.body];
  return vector3ToLatLon(latLonToVector3(m.landing.lat, m.landing.lon, r));
};
const distKm = (m, marker) => greatCircleKm(marker, m.referenceLanding, BODY_RADIUS_KM[m.body]);

describe('Property 8: Markers within 100 km of published coordinates', () => {
  it('has three Moon markers and three Mars markers', () => {
    expect(missions.filter((m) => m.body === 'moon')).toHaveLength(3);
    expect(missions.filter((m) => m.body === 'mars')).toHaveLength(3);
  });

  it('every real mission marker is within 100 km of its reference landing', () => {
    fc.assert(
      fc.property(fc.constantFrom(...missions), (m) => {
        expect(BODY_RADIUS_KM[m.body]).toBeGreaterThan(0);
        expect(distKm(m, markerOf(m))).toBeLessThanOrEqual(LIMIT_KM);
      }),
      { numRuns: 100 },
    );
  });

  it('mutated copies moved beyond 100 km are detected, and small moves are accepted', () => {
    const arb = fc.record({
      m: fc.constantFrom(...missions),
      bearing: fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
      km: fc.double({ min: 0, max: 1000, noNaN: true }),
    });
    fc.assert(
      fc.property(arb, ({ m, bearing, km }) => {
        const R = BODY_RADIUS_KM[m.body];
        const D = Math.PI / 180;
        const ang = km / R;
        const lat1 = m.referenceLanding.lat * D;
        const lon1 = m.referenceLanding.lon * D;
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(ang) + Math.cos(lat1) * Math.sin(ang) * Math.cos(bearing));
        const lon2 =
          lon1 +
          Math.atan2(Math.sin(bearing) * Math.sin(ang) * Math.cos(lat1), Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2));
        const mutated = { ...m, landing: { lat: lat2 / D, lon: lon2 / D } };
        const d = distKm(mutated, markerOf(mutated));
        expect(Math.abs(d - km)).toBeLessThan(0.01);
        if (km > LIMIT_KM + 0.1) expect(d).toBeGreaterThan(LIMIT_KM);
        if (km < LIMIT_KM - 0.1) expect(d).toBeLessThanOrEqual(LIMIT_KM);
      }),
      { numRuns: 200 },
    );
  });
});

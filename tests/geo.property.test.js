import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { latLonToVector3, vector3ToLatLon } from '../src/core/geo.js';

// Feature: nasa-space-apps-2026, Property 6: Latitude/longitude round trip
// **Validates: Requirements 3.1, 3.2, 4.2, 9.3**

const TOL_DEG = 1e-6;
const radiusArb = fc.double({ min: 1e-3, max: 1e5, noNaN: true });
const latArb = fc.double({ min: -90, max: 90, noNaN: true });
const lonArb = fc.double({ min: -180, max: 180, noNaN: true }).filter((l) => l > -180);

describe('Property 6: Latitude/longitude round trip', () => {
  it('returns the original coordinates and preserves the radius', () => {
    fc.assert(
      fc.property(latArb, lonArb, radiusArb, (lat, lon, r) => {
        const v = latLonToVector3(lat, lon, r);
        expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(r, 6);
        const back = vector3ToLatLon(v);
        // Latitude is well-conditioned except where acos/asin flatten near the poles.
        expect(Math.abs(back.lat - lat)).toBeLessThan(1e-5);
        // Longitude is undefined at the poles, and ill-conditioned right next to them.
        if (Math.abs(lat) < 89.99) {
          const d = Math.abs(back.lon - lon);
          expect(Math.min(d, 360 - d)).toBeLessThan(TOL_DEG);
          expect(back.lon).toBeGreaterThan(-180);
          expect(back.lon).toBeLessThanOrEqual(180);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('handles known points', () => {
    expect(vector3ToLatLon(latLonToVector3(0, 180, 1)).lon).toBe(180);
    expect(vector3ToLatLon(latLonToVector3(90, 0, 5)).lat).toBeCloseTo(90, 9);
    expect(vector3ToLatLon(latLonToVector3(0, 0, 1))).toEqual({ lat: 0, lon: 0 });
  });
});

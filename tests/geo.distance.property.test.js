import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { greatCircleKm, BODY_RADIUS_KM } from '../src/core/geo.js';

// Feature: nasa-space-apps-2026, Property 7: Great-circle distance is a metric
// **Validates: Requirements 9.3**

const pointArb = fc.record({
  lat: fc.double({ min: -90, max: 90, noNaN: true }),
  lon: fc.double({ min: -180, max: 180, noNaN: true }),
});
const radiusArb = fc.oneof(
  fc.constantFrom(BODY_RADIUS_KM.moon, BODY_RADIUS_KM.mars),
  fc.double({ min: 1, max: 1e5, noNaN: true }),
);

describe('Property 7: Great-circle distance is a metric', () => {
  it('is non-negative, symmetric and at most half the circumference', () => {
    fc.assert(
      fc.property(pointArb, pointArb, radiusArb, (a, b, r) => {
        const d = greatCircleKm(a, b, r);
        expect(Number.isFinite(d)).toBe(true);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(Math.PI * r * (1 + 1e-12));
        expect(Math.abs(d - greatCircleKm(b, a, r))).toBeLessThanOrEqual(1e-9 * r);
      }),
      { numRuns: 200 },
    );
  });

  it('is zero for identical points', () => {
    fc.assert(
      fc.property(pointArb, radiusArb, (a, r) => {
        expect(greatCircleKm(a, { ...a }, r)).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

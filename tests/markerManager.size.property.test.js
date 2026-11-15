// Feature: nasa-space-apps-2026, Property 5: Marker screen size bound
// **Validates: Requirements 3.3**
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { markerScreenRadius, MAX_MARKER_SCREEN_FRACTION } from '../src/engine/markerManager.js';

describe('Property 5: Marker screen size bound', () => {
  it('screen radius never exceeds 2% of the smaller viewport dimension', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1e-4, max: 1e-1, noNaN: true }),
        fc.double({ min: 0, max: 1e6, noNaN: true }),
        fc.double({ min: 10, max: 120, noNaN: true }),
        fc.integer({ min: 100, max: 8000 }),
        fc.integer({ min: 100, max: 8000 }),
        (worldRadius, distance, fov, vh, vw) => {
          const r = markerScreenRadius(worldRadius, distance, fov, vh, vw);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(MAX_MARKER_SCREEN_FRACTION * Math.min(vw, vh) + 1e-9);
        },
      ),
      { numRuns: 200 },
    );
  });
});

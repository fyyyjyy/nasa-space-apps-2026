import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { clampZoom, MIN_ZOOM_FACTOR } from '../src/engine/cameraRig.js';

// Feature: nasa-space-apps-2026, Property 3: Zoom clamp keeps bodies visible and unpenetrated
describe('clampZoom (Property 3)', () => {
  it('returns a distance in [radius*1.15, max], never inside the body', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        (radius, extra, requested) => {
          const min = radius * MIN_ZOOM_FACTOR;
          const max = min + extra;
          const d = clampZoom(requested, min, max);
          expect(d).toBeGreaterThan(radius);
          expect(d).toBeGreaterThanOrEqual(min);
          expect(d).toBeLessThanOrEqual(max);
          if (requested >= min && requested <= max) expect(d).toBe(requested);
        },
      ),
      { numRuns: 200 },
    );
  });
});

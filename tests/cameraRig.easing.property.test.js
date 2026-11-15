import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { easeInOutCubic } from '../src/engine/cameraRig.js';

// Feature: nasa-space-apps-2026, Property 4: Easing is a smooth monotonic ease-in-out
// **Validates: Requirements 4.4**
describe('Property 4: easeInOutCubic', () => {
  const unit = fc.double({ min: 0, max: 1, noNaN: true });

  it('endpoints are exactly 0 and 1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('stays within [0, 1]', () => {
    fc.assert(
      fc.property(unit, (t) => {
        const v = easeInOutCubic(t);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }),
      { numRuns: 200 },
    );
  });

  it('is non-decreasing', () => {
    fc.assert(
      fc.property(unit, unit, (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(easeInOutCubic(lo)).toBeLessThanOrEqual(easeInOutCubic(hi));
      }),
      { numRuns: 200 },
    );
  });

  it('is symmetric: ease(t) + ease(1 - t) = 1', () => {
    fc.assert(
      fc.property(unit, (t) => {
        expect(easeInOutCubic(t) + easeInOutCubic(1 - t)).toBeCloseTo(1, 9);
      }),
      { numRuns: 200 },
    );
  });
});

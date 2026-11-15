import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { nextQualityLevel, MAX_LEVEL } from '../src/engine/qualityController.js';

const clamp = (n) => Math.min(MAX_LEVEL, Math.max(0, n));

describe('Property 35: quality controller range and sustained-fps stepping', () => {
  it('stays in range, moves at most 1, and steps only under the stated conditions', () => {
    // **Validates: Requirements 13.9**
    fc.assert(
      fc.property(
        fc.integer({ min: -20, max: 20 }),
        fc.double({ min: 0, max: 400, noNaN: true }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        (level, fps, below, above) => {
          const out = nextQualityLevel(level, fps, below, above);
          const base = clamp(level);
          expect(Number.isInteger(out)).toBe(true);
          expect(out).toBeGreaterThanOrEqual(0);
          expect(out).toBeLessThanOrEqual(MAX_LEVEL);
          expect(Math.abs(out - base)).toBeLessThanOrEqual(1);
          if (out > base) {
            expect(fps < 30 && below > 3).toBe(true);
          }
          if (out < base) {
            expect(fps >= 55 && above >= 10).toBe(true);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('defaults secondsAtOrAbove55 to 0 and never steps up', () => {
    expect(nextQualityLevel(2, 60, 0)).toBe(2);
    expect(nextQualityLevel(0, 10, 3.5)).toBe(1);
    expect(nextQualityLevel(MAX_LEVEL, 10, 50)).toBe(MAX_LEVEL);
  });
});

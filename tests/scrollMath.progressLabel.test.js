import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { overallProgress, chapterLabel } from '../src/core/scrollMath.js';

// Feature: nasa-space-apps-2026, Property 14: Overall progress and chapter label
// **Validates: Requirements 6.15**

const pos = fc.double({ min: -1e6, max: 1e6, noNaN: true });

// Contiguous, non-empty chapter ranges.
const ranges = fc
  .tuple(
    fc.double({ min: 0, max: 1000, noNaN: true }),
    fc.array(fc.double({ min: 1, max: 2000, noNaN: true }), { minLength: 1, maxLength: 8 }),
  )
  .map(([start, lens]) => {
    let s = start;
    return lens.map((len) => {
      const r = { start: s, end: s + len };
      s += len;
      return r;
    });
  });

describe('Property 14: Overall progress and chapter label', () => {
  it('overallProgress lies in [0, 1]', () => {
    fc.assert(
      fc.property(pos, ranges, (s, r) => {
        const p = overallProgress(s, r);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  it('overallProgress is non-decreasing in scrollTop', () => {
    fc.assert(
      fc.property(pos, pos, ranges, (a, b, r) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(overallProgress(lo, r)).toBeLessThanOrEqual(overallProgress(hi, r));
      }),
      { numRuns: 100 },
    );
  });

  it('chapterLabel total equals chapter count and current is within 1..total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: -5, max: 40 }),
        (n, idx) => {
          const { current, total } = chapterLabel(idx, n);
          expect(total).toBe(n);
          expect(current).toBeGreaterThanOrEqual(1);
          expect(current).toBeLessThanOrEqual(n);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('handles empty chapters', () => {
    expect(overallProgress(50, [])).toBe(0);
    expect(chapterLabel(0, 0)).toEqual({ current: 0, total: 0 });
  });
});

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { activeChapterIndex } from '../src/core/scrollMath.js';

// Ordered, non-overlapping ranges (gaps allowed).
const rangesArb = fc
  .array(fc.tuple(fc.integer({ min: 0, max: 500 }), fc.integer({ min: 1, max: 500 })), {
    minLength: 0,
    maxLength: 12,
  })
  .map((pairs) => {
    let cursor = 0;
    return pairs.map(([gap, len]) => {
      const start = cursor + gap;
      const end = start + len;
      cursor = end;
      return { start, end };
    });
  });

const scrollArb = fc.integer({ min: -100, max: 8000 });

describe('Property 13: Active chapter selection is consistent', () => {
  /** **Validates: Requirements 6.5, 6.13** */
  it('returns -1 or an index whose range contains scrollTop, below the chapter count', () => {
    fc.assert(
      fc.property(rangesArb, scrollArb, (ranges, top) => {
        const i = activeChapterIndex(top, ranges);
        expect(i).toBeLessThan(ranges.length);
        expect(i).toBeGreaterThanOrEqual(-1);
        if (i >= 0) {
          expect(top).toBeGreaterThanOrEqual(ranges[i].start);
          expect(top).toBeLessThan(ranges[i].end);
        } else {
          expect(ranges.some((r) => top >= r.start && top < r.end)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });

  /** **Validates: Requirements 6.5, 6.13** */
  it('is non-decreasing as scrollTop increases (ignoring gaps)', () => {
    fc.assert(
      fc.property(rangesArb, scrollArb, scrollArb, (ranges, a, b) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const iLo = activeChapterIndex(lo, ranges);
        const iHi = activeChapterIndex(hi, ranges);
        if (iLo >= 0 && iHi >= 0) expect(iHi).toBeGreaterThanOrEqual(iLo);
      }),
      { numRuns: 200 },
    );
  });
});

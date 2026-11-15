import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeProgress } from '../src/core/scrollMath.js';

// Feature: nasa-space-apps-2026, Property 12: Scroll progress normalisation
// **Validates: Requirements 6.5, 6.15**

const pos = fc.double({ min: -1e6, max: 1e6, noNaN: true });
const range = fc.tuple(pos, pos); // any pair, including end <= start

describe('Property 12: Scroll progress normalisation', () => {
  it('always returns a number in [0, 1]', () => {
    fc.assert(
      fc.property(pos, range, (s, [a, b]) => {
        const p = normalizeProgress(s, a, b);
        return typeof p === 'number' && p >= 0 && p <= 1;
      }),
      { numRuns: 100 },
    );
  });

  it('is non-decreasing in scrollTop', () => {
    fc.assert(
      fc.property(pos, pos, range, (s1, s2, [a, b]) => {
        const lo = Math.min(s1, s2);
        const hi = Math.max(s1, s2);
        return normalizeProgress(lo, a, b) <= normalizeProgress(hi, a, b);
      }),
      { numRuns: 100 },
    );
  });

  it('returns 0 at or before start', () => {
    fc.assert(
      fc.property(pos, range, (s, [a, b]) => {
        fc.pre(s <= a);
        return normalizeProgress(s, a, b) === 0;
      }),
      { numRuns: 100 },
    );
  });

  it('returns 1 at or after end for non-degenerate ranges', () => {
    fc.assert(
      fc.property(pos, range, (s, [a, b]) => {
        fc.pre(b > a && s >= b);
        return normalizeProgress(s, a, b) === 1;
      }),
      { numRuns: 100 },
    );
  });

  it('handles degenerate ranges without NaN', () => {
    expect(normalizeProgress(5, 10, 10)).toBe(0);
    expect(normalizeProgress(10, 10, 10)).toBe(0);
    expect(normalizeProgress(11, 10, 10)).toBe(1);
    expect(normalizeProgress(11, 10, 5)).toBe(1);
  });
});

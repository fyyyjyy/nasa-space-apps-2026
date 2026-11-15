import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { selectLayout, STACKED_BREAKPOINT_PX } from '../src/core/layoutSelector.js';

describe('layoutSelector', () => {
  // Feature: nasa-space-apps-2026, Property 36: Layout selector matches the breakpoint
  // **Validates: Requirements 13.3**
  it('returns stacked iff width < 768, otherwise split', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: 0, max: 5000, noNaN: true }),
          fc.integer({ min: 0, max: 5000 }),
          fc.constantFrom(0, 319, 320, 767, 767.99, 768, 768.01, 1280)
        ),
        (w) => {
          expect(selectLayout(w)).toBe(w < 768 ? 'stacked' : 'split');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('breakpoint constant is 768 and boundary behaves correctly', () => {
    expect(STACKED_BREAKPOINT_PX).toBe(768);
    expect(selectLayout(767)).toBe('stacked');
    expect(selectLayout(768)).toBe('split');
  });
});

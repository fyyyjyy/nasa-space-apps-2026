import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { JOURNEY_ORDER, journeyProgressLabel } from '../src/core/journeyPlan.js';

// Feature: nasa-space-apps-2026, Property 27: Journey progress label
// **Validates: Requirements 10.7**
describe('Property 27: Journey progress label', () => {
  it('shows "Mission N of 6 · name" for every journey index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: JOURNEY_ORDER.length - 1 }),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
          minLength: JOURNEY_ORDER.length,
          maxLength: JOURNEY_ORDER.length,
        }),
        (index, names) => {
          const missions = JOURNEY_ORDER.map((id, i) => ({ id, name: names[i] }));
          const label = journeyProgressLabel(index, missions);
          expect(label).toBe(`Mission ${index + 1} of 6 · ${names[index]}`);
        },
      ),
      { numRuns: 100 },
    );
  });
});

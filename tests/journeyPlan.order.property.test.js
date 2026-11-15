import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  JOURNEY_ORDER,
  CONTINUE_LABEL,
  FINISH_LABEL,
  deriveJourneyOrder,
  matchesJourneyOrder,
  nextMission,
  continueLabel,
} from '../src/core/journeyPlan.js';
import missionsData from '../src/data/missions.json';

// Feature: nasa-space-apps-2026, Property 26: Journey order and continue labels
// **Validates: Requirements 10.3, 10.5, 10.6**
describe('Property 26: Journey order and continue labels', () => {
  const expected = ['surveyor3', 'apollo11', 'apollo17', 'viking1', 'opportunity', 'insight'];

  it('JOURNEY_ORDER is the fixed six-mission sequence', () => {
    expect([...JOURNEY_ORDER]).toEqual(expected);
  });

  it('order derived from real mission data matches JOURNEY_ORDER', () => {
    const missions = Array.isArray(missionsData) ? missionsData : missionsData.missions;
    expect(matchesJourneyOrder(missions)).toBe(true);
  });

  it('derived order is independent of input permutation', () => {
    const missions = expected.map((id, i) => ({ id, journeyOrder: i + 1, year: 1960 + i }));
    fc.assert(
      fc.property(fc.shuffledSubarray(missions, { minLength: 6, maxLength: 6 }), (shuffled) => {
        expect(deriveJourneyOrder(shuffled)).toEqual(expected);
        expect(matchesJourneyOrder(shuffled)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('nextMission and continueLabel are correct for every index', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (i) => {
        if (i < 5) {
          expect(nextMission(i)).toEqual({ index: i + 1, missionId: expected[i + 1] });
          expect(continueLabel(i)).toBe(CONTINUE_LABEL);
          expect(continueLabel(i)).toBe('Continue to Next Mission');
        } else {
          expect(nextMission(i)).toBeNull();
          expect(continueLabel(i)).toBe(FINISH_LABEL);
          expect(continueLabel(i)).toBe('Finish the Journey');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('nextMission returns null for out-of-range or non-integer indexes', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: -1 }), fc.integer({ min: 6 }), fc.double({ noInteger: true })),
        (i) => {
          expect(nextMission(i)).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});

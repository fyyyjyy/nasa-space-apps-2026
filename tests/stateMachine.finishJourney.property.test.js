import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { transition, createInitialState, JOURNEY_MISSIONS } from '../src/core/stateMachine.js';

const SCREENS = [
  'LOADING', 'FALLBACK', 'OPENING', 'ORBIT', 'FLY_IN', 'STORY', 'SUMMARY', 'QUIZ',
  'FLY_OUT', 'JOURNEY_INTRO', 'JOURNEY_TRANSITION', 'JOURNEY_CARD', 'CLOSING',
];

const stateArb = fc.record({
  mode: fc.constantFrom('EXPLORE', 'JOURNEY'),
  screen: fc.constantFrom(...SCREENS),
  journeyIndex: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
});

const build = (s) => ({
  ...createInitialState(),
  ...s,
  missionId: s.journeyIndex === null ? null : JOURNEY_MISSIONS[s.journeyIndex].id,
  body: s.journeyIndex === null ? null : JOURNEY_MISSIONS[s.journeyIndex].body,
});

describe('Property 28: Finish the Journey ends at the closing screen', () => {
  /** **Validates: Requirements 10.8** */
  it('FINISH_JOURNEY is accepted only on the summary of mission index 5 in Journey mode', () => {
    fc.assert(
      fc.property(stateArb, (s) => {
        const st = build(s);
        const next = transition(st, { type: 'FINISH_JOURNEY' });
        const allowed = s.mode === 'JOURNEY' && s.screen === 'SUMMARY' && s.journeyIndex === 5;
        if (allowed) {
          expect(next.screen).toBe('FLY_OUT');
        } else {
          expect(next).toBe(st);
        }
      }),
    );
  });

  /** **Validates: Requirements 10.8** */
  it('FINISH_JOURNEY then FLY_COMPLETE reaches CLOSING, and EXPLORE_ON_OWN returns to OPENING in EXPLORE with null journeyIndex', () => {
    const summary = build({ mode: 'JOURNEY', screen: 'SUMMARY', journeyIndex: 5 });
    const flying = transition(summary, { type: 'FINISH_JOURNEY' });
    const closing = transition(flying, { type: 'FLY_COMPLETE' });
    expect(closing.screen).toBe('CLOSING');
    const opening = transition(closing, { type: 'EXPLORE_ON_OWN' });
    expect(opening.screen).toBe('OPENING');
    expect(opening.mode).toBe('EXPLORE');
    expect(opening.journeyIndex).toBeNull();
  });

  /** **Validates: Requirements 10.8** */
  it('EXPLORE_ON_OWN from CLOSING always yields OPENING in EXPLORE mode with null journeyIndex', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (i) => {
        const st = build({ mode: 'JOURNEY', screen: 'CLOSING', journeyIndex: i });
        const next = transition(st, { type: 'EXPLORE_ON_OWN' });
        expect(next.screen).toBe('OPENING');
        expect(next.mode).toBe('EXPLORE');
        expect(next.journeyIndex).toBeNull();
      }),
    );
  });
});

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createInitialState, transition, JOURNEY_MISSIONS } from '../src/core/stateMachine.js';

// Feature: nasa-space-apps-2026, Property 29: Exit Journey and restart
// **Validates: Requirements 10.9, 10.10**

const JOURNEY_EVENTS = [
  'JOURNEY_INTRO_DONE', 'FLY_COMPLETE', 'STORY_END', 'OPEN_QUIZ', 'CLOSE_QUIZ', 'CONTINUE',
  'TRANSITION_COMPLETE', 'CARD_DONE', 'FINISH_JOURNEY',
];

const run = (state, events) => events.reduce((s, ev) => transition(s, ev), state);

const started = () =>
  transition(run(createInitialState(), ['ASSETS_READY']), 'START_JOURNEY');

// Weighted toward forward progress so deep journey states are reached.
const walkArb = fc.array(fc.constantFrom(...JOURNEY_EVENTS, 'FLY_COMPLETE', 'STORY_END', 'CONTINUE', 'CARD_DONE'), {
  maxLength: 80,
});

describe('Property 29: Exit Journey and restart', () => {
  it('EXIT_JOURNEY from any non-CLOSING journey state yields EXPLORE with orbit target of the active body', () => {
    fc.assert(
      fc.property(walkArb, (events) => {
        const s = run(started(), events);
        fc.pre(s.mode === 'JOURNEY' && s.screen !== 'CLOSING');
        const activeBody = JOURNEY_MISSIONS[s.journeyIndex].body;
        const out = transition(s, 'EXIT_JOURNEY');
        expect(out.mode).toBe('EXPLORE');
        expect(out.journeyIndex).toBeNull();
        expect(out.returnTarget).toBe('orbit');
        expect(out.body).toBe(activeBody);
        // Completing the fly-out lands in orbit of that body.
        const landed = transition(out, 'FLY_COMPLETE');
        expect(landed.mode).toBe('EXPLORE');
        expect(landed.screen).toBe('ORBIT');
        expect(landed.body).toBe(activeBody);
      }),
      { numRuns: 200 },
    );
  });

  it('a later START_JOURNEY begins at index 0 regardless of the exit point', () => {
    fc.assert(
      fc.property(walkArb, (events) => {
        const s = run(started(), events);
        fc.pre(s.mode === 'JOURNEY' && s.screen !== 'CLOSING');
        const out = transition(s, 'EXIT_JOURNEY');
        // Return to the opening view, then restart.
        const orbit = transition(out, 'FLY_COMPLETE');
        const opening = transition(orbit, 'ORBIT_BACK');
        const restarted = transition(opening, 'START_JOURNEY');
        expect(restarted.mode).toBe('JOURNEY');
        expect(restarted.journeyIndex).toBe(0);
        expect(restarted.missionId).toBe(JOURNEY_MISSIONS[0].id);
      }),
      { numRuns: 200 },
    );
  });
});

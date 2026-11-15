import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createInitialState, transition, JOURNEY_MISSIONS } from '../src/core/stateMachine.js';

// Feature: nasa-space-apps-2026, Property 23: Mission selection and retargeting
// **Validates: Requirements 4.3, 4.5**

const missionArb = fc.constantFrom(...JOURNEY_MISSIONS);

function toOrbit(body) {
  let s = createInitialState();
  s = transition(s, 'ASSETS_READY');
  return transition(s, { type: 'SELECT_BODY', body });
}

describe('Property 23: Mission selection and retargeting', () => {
  it('select a from ORBIT, retarget to b in FLY_IN, then FLY_COMPLETE gives STORY for b', () => {
    fc.assert(
      fc.property(missionArb, missionArb, (a, b) => {
        let s = toOrbit(a.body);
        expect(s.screen).toBe('ORBIT');

        s = transition(s, { type: 'SELECT_MISSION', missionId: a.id, body: a.body });
        expect(s.screen).toBe('FLY_IN');
        expect(s.missionId).toBe(a.id);

        s = transition(s, { type: 'SELECT_MISSION', missionId: b.id, body: b.body });
        expect(s.screen).toBe('FLY_IN');
        expect(s.missionId).toBe(b.id);
        expect(s.mode).toBe('EXPLORE');

        s = transition(s, 'FLY_COMPLETE');
        expect(s.screen).toBe('STORY');
        expect(s.missionId).toBe(b.id);
      }),
      { numRuns: 100 },
    );
  });
});

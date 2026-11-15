import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createInitialState, transition, JOURNEY_MISSIONS } from '../src/core/stateMachine.js';

// Feature: nasa-space-apps-2026, Property 24: Return to Space
// **Validates: Requirements 6.14, 6.19**

const stateArb = fc
  .record({
    screen: fc.constantFrom('FLY_IN', 'STORY', 'SUMMARY'),
    mission: fc.constantFrom(...JOURNEY_MISSIONS),
  })
  .map(({ screen, mission }) => ({
    ...createInitialState(),
    mode: 'EXPLORE',
    screen,
    body: mission.body,
    missionId: mission.id,
  }));

describe('Property 24: Return to Space', () => {
  it('target opening leads to OPENING with no mission (model unloaded)', () => {
    fc.assert(
      fc.property(stateArb, (s) => {
        const out = transition(s, { type: 'RETURN_TO_SPACE', target: 'opening' });
        expect(out.screen).toBe('FLY_OUT');
        const end = transition(out, { type: 'FLY_COMPLETE' });
        expect(end.screen).toBe('OPENING');
        expect(end.missionId).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('target orbit leads to ORBIT of the mission body with no mission (model unloaded)', () => {
    fc.assert(
      fc.property(stateArb, (s) => {
        const out = transition(s, { type: 'RETURN_TO_SPACE', target: 'orbit' });
        expect(out.screen).toBe('FLY_OUT');
        const end = transition(out, { type: 'FLY_COMPLETE' });
        expect(end.screen).toBe('ORBIT');
        expect(end.body).toBe(s.body);
        expect(end.missionId).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

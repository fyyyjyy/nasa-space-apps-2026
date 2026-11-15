import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createInitialState, transition, JOURNEY_MISSIONS } from '../src/core/stateMachine.js';

// Feature: nasa-space-apps-2026, Property 25: Quiz open and close round trip
// **Validates: Requirements 7.7**

const run = (state, events) => events.reduce((s, e) => transition(s, e), state);

const missionIds = JOURNEY_MISSIONS.map((m) => m.id);

// Reach a SUMMARY state in Explore mode.
const exploreSummaryArb = fc
  .record({
    body: fc.constantFrom('moon', 'mars'),
    missionId: fc.constantFrom(...missionIds),
  })
  .map(({ body, missionId }) =>
    run(createInitialState(), [
      'ASSETS_READY',
      { type: 'SELECT_BODY', body },
      { type: 'SELECT_MISSION', missionId, body },
      'FLY_COMPLETE',
      'STORY_END',
    ]),
  );

// Reach a SUMMARY state in Journey mode at any journey index.
const journeySummaryArb = fc.integer({ min: 0, max: JOURNEY_MISSIONS.length - 1 }).map((n) => {
  let s = run(createInitialState(), [
    'ASSETS_READY', 'START_JOURNEY', 'JOURNEY_INTRO_DONE', 'FLY_COMPLETE', 'STORY_END',
  ]);
  for (let i = 0; i < n; i += 1) {
    s = run(s, ['CONTINUE', 'TRANSITION_COMPLETE', 'CARD_DONE', 'FLY_COMPLETE', 'STORY_END']);
  }
  return s;
});

const summaryArb = fc.oneof(exploreSummaryArb, journeySummaryArb);

describe('Property 25: Quiz open and close round trip', () => {
  it('generators produce SUMMARY states', () => {
    fc.assert(
      fc.property(summaryArb, (s) => {
        expect(s.screen).toBe('SUMMARY');
      }),
    );
  });

  it('OPEN_QUIZ then CLOSE_QUIZ from SUMMARY restores the original state', () => {
    fc.assert(
      fc.property(summaryArb, (s) => {
        const opened = transition(s, 'OPEN_QUIZ');
        expect(opened.screen).toBe('QUIZ');
        const closed = transition(opened, 'CLOSE_QUIZ');
        expect(closed.screen).toBe(s.screen);
        expect(closed.missionId).toBe(s.missionId);
        expect(closed.journeyIndex).toBe(s.journeyIndex);
        expect(closed.mode).toBe(s.mode);
        expect(closed).toEqual(s);
      }),
    );
  });

  it('OPEN_QUIZ is rejected (same state object) from any non-SUMMARY screen', () => {
    const walkArb = fc.array(
      fc.constantFrom(
        'ASSETS_READY', 'ORBIT_BACK', 'FLY_COMPLETE', 'STORY_END', 'OPEN_QUIZ', 'CLOSE_QUIZ',
        'START_JOURNEY', 'JOURNEY_INTRO_DONE', 'CONTINUE', 'TRANSITION_COMPLETE', 'CARD_DONE',
        'FINISH_JOURNEY', 'EXIT_JOURNEY', 'EXPLORE_ON_OWN',
        { type: 'SELECT_BODY', body: 'moon' },
        { type: 'SELECT_MISSION', missionId: 'apollo11' },
        { type: 'RETURN_TO_SPACE', target: 'orbit' },
      ),
      { maxLength: 40 },
    );
    fc.assert(
      fc.property(walkArb, (events) => {
        const s = run(createInitialState(), events);
        fc.pre(s.screen !== 'SUMMARY');
        expect(transition(s, 'OPEN_QUIZ')).toBe(s);
      }),
    );
  });
});

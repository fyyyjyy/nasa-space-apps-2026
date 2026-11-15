import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createInitialState, transition, JOURNEY_MISSIONS } from '../src/core/stateMachine.js';

// Feature: nasa-space-apps-2026, Property 22: State machine totality and invariants
// **Validates: Requirements 2.5, 4.3, 4.5**

const SCREENS = [
  'LOADING', 'FALLBACK', 'OPENING', 'ORBIT', 'FLY_IN', 'STORY', 'SUMMARY', 'QUIZ',
  'FLY_OUT', 'JOURNEY_INTRO', 'JOURNEY_TRANSITION', 'JOURNEY_CARD', 'CLOSING',
];

const missionIds = JOURNEY_MISSIONS.map((m) => m.id);

// Events include valid payloads, bad payloads, bare strings and unknown types.
const eventArb = fc.oneof(
  fc.constantFrom(
    'ASSETS_READY', 'WEBGL_UNAVAILABLE', 'ORBIT_BACK', 'FLY_COMPLETE', 'STORY_END',
    'OPEN_QUIZ', 'CLOSE_QUIZ', 'START_JOURNEY', 'JOURNEY_INTRO_DONE', 'CONTINUE',
    'TRANSITION_COMPLETE', 'CARD_DONE', 'FINISH_JOURNEY', 'EXIT_JOURNEY', 'EXPLORE_ON_OWN',
  ).chain((type) => fc.constantFrom(type, { type })),
  fc.record({ type: fc.constant('SELECT_BODY'), body: fc.constantFrom('moon', 'mars', 'venus', undefined) }),
  fc.record({
    type: fc.constant('SELECT_MISSION'),
    missionId: fc.oneof(fc.constantFrom(...missionIds), fc.string(), fc.constant(undefined)),
    body: fc.constantFrom('moon', 'mars', undefined),
  }),
  fc.record({
    type: fc.constant('RETURN_TO_SPACE'),
    target: fc.constantFrom('orbit', 'opening', undefined, 'elsewhere'),
  }),
  fc.record({ type: fc.string() }),
  fc.constantFrom(null, undefined, {}, { type: 42 }, 'NOT_AN_EVENT'),
);

const eventsArb = fc.array(eventArb, { maxLength: 60 });

function reach(events) {
  const states = [createInitialState()];
  for (const ev of events) states.push(transition(states[states.length - 1], ev));
  return states;
}

function assertInvariants(s) {
  expect(SCREENS).toContain(s.screen);
  expect(['EXPLORE', 'JOURNEY']).toContain(s.mode);
  if (s.mode === 'EXPLORE') {
    expect(s.journeyIndex).toBeNull();
  } else {
    expect(Number.isInteger(s.journeyIndex)).toBe(true);
    expect(s.journeyIndex).toBeGreaterThanOrEqual(0);
    expect(s.journeyIndex).toBeLessThanOrEqual(5);
  }
  if (['FLY_IN', 'STORY', 'SUMMARY', 'QUIZ'].includes(s.screen)) {
    expect(s.missionId).not.toBeNull();
    expect(typeof s.missionId).toBe('string');
  }
}

// Independent oracle: which event types may change a state at all.
function accepts(s, type) {
  const explore = s.mode === 'EXPLORE';
  const journey = s.mode === 'JOURNEY';
  switch (type) {
    case 'ASSETS_READY':
    case 'WEBGL_UNAVAILABLE': return s.screen === 'LOADING';
    case 'SELECT_BODY':
    case 'START_JOURNEY': return explore && s.screen === 'OPENING';
    case 'ORBIT_BACK': return explore && s.screen === 'ORBIT';
    case 'SELECT_MISSION': return explore && (s.screen === 'ORBIT' || s.screen === 'FLY_IN');
    case 'FLY_COMPLETE': return s.screen === 'FLY_IN' || s.screen === 'FLY_OUT';
    case 'STORY_END': return s.screen === 'STORY';
    case 'OPEN_QUIZ': return s.screen === 'SUMMARY';
    case 'CLOSE_QUIZ': return s.screen === 'QUIZ';
    case 'RETURN_TO_SPACE': return explore && ['STORY', 'SUMMARY', 'FLY_IN'].includes(s.screen);
    case 'JOURNEY_INTRO_DONE': return journey && s.screen === 'JOURNEY_INTRO';
    case 'CONTINUE':
    case 'FINISH_JOURNEY': return journey && s.screen === 'SUMMARY';
    case 'TRANSITION_COMPLETE': return journey && s.screen === 'JOURNEY_TRANSITION';
    case 'CARD_DONE': return journey && s.screen === 'JOURNEY_CARD';
    case 'EXIT_JOURNEY': return journey && s.screen !== 'CLOSING';
    case 'EXPLORE_ON_OWN': return s.screen === 'CLOSING';
    default: return false;
  }
}

describe('Property 22: state machine totality and invariants', () => {
  it('keeps invariants in every state reachable by any event sequence', () => {
    fc.assert(
      fc.property(eventsArb, (events) => {
        for (const s of reach(events)) assertInvariants(s);
      }),
      { numRuns: 300 },
    );
  });

  it('returns the identical state object for events invalid in the current state', () => {
    fc.assert(
      fc.property(eventsArb, eventArb, (events, ev) => {
        const s = reach(events).at(-1);
        const type = typeof ev === 'string' ? ev : ev && typeof ev.type === 'string' ? ev.type : null;
        const next = transition(s, ev);
        if (type === null || !accepts(s, type)) {
          expect(next).toBe(s);
        }
        assertInvariants(next);
      }),
      { numRuns: 500 },
    );
  });

  it('never mutates the input state', () => {
    fc.assert(
      fc.property(eventsArb, eventArb, (events, ev) => {
        const s = reach(events).at(-1);
        const snapshot = JSON.stringify(s);
        transition(s, ev);
        expect(JSON.stringify(s)).toBe(snapshot);
      }),
      { numRuns: 200 },
    );
  });

  it('does not throw on non-state or non-event inputs', () => {
    expect(transition(createInitialState(), null)).toEqual(createInitialState());
    expect(transition(null, 'ASSETS_READY')).toBeNull();
  });
});

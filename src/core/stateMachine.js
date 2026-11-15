// Application state machine. Pure transition function plus a small store.
// Events are plain objects: { type, ...payload } (a bare string is also accepted).
// Invalid events return the SAME state object.

export const JOURNEY_MISSIONS = [
  { id: 'surveyor3', body: 'moon' },
  { id: 'apollo11', body: 'moon' },
  { id: 'apollo17', body: 'moon' },
  { id: 'viking1', body: 'mars' },
  { id: 'opportunity', body: 'mars' },
  { id: 'insight', body: 'mars' },
];

const LAST_JOURNEY_INDEX = JOURNEY_MISSIONS.length - 1;
const BODIES = ['moon', 'mars'];

export function createInitialState() {
  return {
    mode: 'EXPLORE',
    screen: 'LOADING',
    body: null,
    missionId: null,
    journeyIndex: null,
    resumeScreen: null,
    // Where FLY_OUT lands in Explore mode: 'orbit' | 'opening' (null otherwise).
    returnTarget: null,
  };
}

function bodyForMission(missionId, hint) {
  if (BODIES.includes(hint)) return hint;
  const m = JOURNEY_MISSIONS.find((x) => x.id === missionId);
  return m ? m.body : null;
}

const JOURNEY_SCREENS = [
  'JOURNEY_INTRO', 'FLY_IN', 'STORY', 'SUMMARY', 'QUIZ',
  'FLY_OUT', 'JOURNEY_TRANSITION', 'JOURNEY_CARD',
];

export function transition(state, event) {
  const e = typeof event === 'string' ? { type: event } : event;
  if (!state || !e || typeof e.type !== 'string') return state;
  const { mode, screen } = state;
  const explore = mode === 'EXPLORE';
  const journey = mode === 'JOURNEY';

  switch (e.type) {
    case 'ASSETS_READY':
      return screen === 'LOADING' ? { ...state, screen: 'OPENING' } : state;

    case 'WEBGL_UNAVAILABLE':
      return screen === 'LOADING' ? { ...state, screen: 'FALLBACK' } : state;

    case 'SELECT_BODY':
      if (explore && screen === 'OPENING' && BODIES.includes(e.body)) {
        return { ...state, screen: 'ORBIT', body: e.body };
      }
      return state;

    case 'ORBIT_BACK':
      if (explore && screen === 'ORBIT') {
        return { ...state, screen: 'OPENING', body: null, missionId: null, returnTarget: null };
      }
      return state;

    case 'SELECT_MISSION': {
      if (!explore || (screen !== 'ORBIT' && screen !== 'FLY_IN')) return state;
      if (typeof e.missionId !== 'string' || e.missionId === '') return state;
      if (screen === 'FLY_IN' && e.missionId === state.missionId) return state;
      const body = bodyForMission(e.missionId, e.body) ?? state.body;
      return { ...state, screen: 'FLY_IN', body, missionId: e.missionId };
    }

    case 'FLY_COMPLETE':
      if (screen === 'FLY_IN') return { ...state, screen: 'STORY' };
      if (screen === 'FLY_OUT') {
        if (journey) return { ...state, screen: 'CLOSING', returnTarget: null };
        if (state.returnTarget === 'orbit' && state.body) {
          return { ...state, screen: 'ORBIT', missionId: null, returnTarget: null };
        }
        return {
          ...state, screen: 'OPENING', body: null, missionId: null, returnTarget: null,
        };
      }
      return state;

    case 'STORY_END':
      return screen === 'STORY' ? { ...state, screen: 'SUMMARY' } : state;

    case 'OPEN_QUIZ':
      return screen === 'SUMMARY' ? { ...state, screen: 'QUIZ', resumeScreen: 'SUMMARY' } : state;

    case 'CLOSE_QUIZ':
      return screen === 'QUIZ'
        ? { ...state, screen: state.resumeScreen || 'SUMMARY', resumeScreen: null }
        : state;

    case 'RETURN_TO_SPACE': {
      if (!explore || !['STORY', 'SUMMARY', 'FLY_IN'].includes(screen)) return state;
      const target = e.target === undefined ? 'opening' : e.target;
      if (target !== 'orbit' && target !== 'opening') return state;
      return { ...state, screen: 'FLY_OUT', returnTarget: target };
    }

    case 'START_JOURNEY':
      if (explore && screen === 'OPENING') {
        return {
          ...state,
          mode: 'JOURNEY',
          screen: 'JOURNEY_INTRO',
          journeyIndex: 0,
          missionId: JOURNEY_MISSIONS[0].id,
          body: JOURNEY_MISSIONS[0].body,
          resumeScreen: null,
          returnTarget: null,
        };
      }
      return state;

    case 'JOURNEY_INTRO_DONE':
      return journey && screen === 'JOURNEY_INTRO' ? { ...state, screen: 'FLY_IN' } : state;

    case 'CONTINUE': {
      if (!journey || screen !== 'SUMMARY') return state;
      const i = state.journeyIndex;
      if (typeof i !== 'number' || i >= LAST_JOURNEY_INDEX) return state;
      const next = JOURNEY_MISSIONS[i + 1];
      return {
        ...state,
        screen: 'JOURNEY_TRANSITION',
        journeyIndex: i + 1,
        missionId: next.id,
        body: next.body,
      };
    }

    case 'TRANSITION_COMPLETE':
      return journey && screen === 'JOURNEY_TRANSITION' ? { ...state, screen: 'JOURNEY_CARD' } : state;

    case 'CARD_DONE':
      return journey && screen === 'JOURNEY_CARD' ? { ...state, screen: 'FLY_IN' } : state;

    case 'FINISH_JOURNEY':
      return journey && screen === 'SUMMARY' && state.journeyIndex === LAST_JOURNEY_INDEX
        ? { ...state, screen: 'FLY_OUT' }
        : state;

    case 'EXIT_JOURNEY':
      if (!journey || !JOURNEY_SCREENS.includes(screen)) return state;
      // Story scroll state is not kept in the machine; leaving Explore-mode
      // fields reset so re-entry starts from the beginning.
      return {
        ...state,
        mode: 'EXPLORE',
        screen: 'FLY_OUT',
        journeyIndex: null,
        resumeScreen: null,
        returnTarget: state.body ? 'orbit' : 'opening',
      };

    case 'EXPLORE_ON_OWN':
      if (screen === 'CLOSING') {
        return {
          ...createInitialState(),
          screen: 'OPENING',
        };
      }
      return state;

    default:
      return state;
  }
}

export function createStore(initial = createInitialState()) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    dispatch(event) {
      const prev = state;
      const next = transition(prev, event);
      if (next !== prev) {
        state = next;
        for (const fn of [...listeners]) fn(state, prev, event);
      }
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

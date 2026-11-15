// Pure helpers for the Full Journey scene wiring. No DOM, no Three.js.
// Requirements 10.1 to 10.10.
import { JOURNEY_ORDER } from './journeyPlan.js';

/** Screens during which the Journey indicator and "Exit Journey" control are shown. */
export const JOURNEY_UI_SCREENS = Object.freeze([
  'JOURNEY_INTRO',
  'FLY_IN',
  'STORY',
  'SUMMARY',
  'QUIZ',
  'JOURNEY_TRANSITION',
  'JOURNEY_CARD',
]);

/** True when the Journey indicator and "Exit Journey" control belong on screen. */
export function journeyUiVisible(state) {
  return !!state && state.mode === 'JOURNEY' && JOURNEY_UI_SCREENS.includes(state.screen);
}

/**
 * Which camera pose a Journey screen needs.
 * 'opening': hold the opening view. 'orbit': fly to orbit of state.body.
 * 'site': fly to the landing site of state.missionId. 'hold': keep the camera where it is.
 * null: the screen is not driven by this helper (STORY, SUMMARY, QUIZ, FLY_OUT, CLOSING).
 */
export function journeyPoseKind(state) {
  if (!state || state.mode !== 'JOURNEY') return null;
  switch (state.screen) {
    case 'JOURNEY_INTRO':
      return 'opening';
    case 'JOURNEY_TRANSITION':
      return 'orbit';
    case 'JOURNEY_CARD':
      return 'hold';
    case 'FLY_IN':
      return 'site';
    default:
      return null;
  }
}

/** Mission objects in Journey order. Missing ids are skipped. */
export function orderedJourneyMissions(missions) {
  const list = Array.isArray(missions) ? missions : [];
  return JOURNEY_ORDER.map((id) => list.find((m) => m.id === id)).filter(Boolean);
}

/** The mission object for a zero-based journey index, or null. */
export function journeyMissionAt(index, missions) {
  const id = JOURNEY_ORDER[index];
  if (id === undefined) return null;
  return (Array.isArray(missions) ? missions : []).find((m) => m.id === id) ?? null;
}

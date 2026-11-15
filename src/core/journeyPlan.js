// Pure journey ordering helpers. No DOM, no Three.js.
// Requirements 10.3, 10.5, 10.7.

export const JOURNEY_ORDER = Object.freeze([
  'surveyor3',
  'apollo11',
  'apollo17',
  'viking1',
  'opportunity',
  'insight',
]);

export const CONTINUE_LABEL = 'Continue to Next Mission';
export const FINISH_LABEL = 'Finish the Journey';

const LAST_INDEX = JOURNEY_ORDER.length - 1;

function isValidIndex(i) {
  return Number.isInteger(i) && i >= 0 && i <= LAST_INDEX;
}

/**
 * Derives the journey order from mission data: sorted by journeyOrder, then year.
 * Returns an array of mission ids. Compare with JOURNEY_ORDER to validate.
 */
export function deriveJourneyOrder(missions) {
  return [...missions]
    .sort((a, b) => a.journeyOrder - b.journeyOrder || a.year - b.year)
    .map((m) => m.id);
}

/** True when the derived order from data equals JOURNEY_ORDER. */
export function matchesJourneyOrder(missions) {
  const derived = deriveJourneyOrder(missions);
  return (
    derived.length === JOURNEY_ORDER.length &&
    derived.every((id, i) => id === JOURNEY_ORDER[i])
  );
}

/** Next mission after journeyIndex, or null after the last mission / invalid index. */
export function nextMission(journeyIndex) {
  if (!isValidIndex(journeyIndex) || journeyIndex >= LAST_INDEX) return null;
  const index = journeyIndex + 1;
  return { index, missionId: JOURNEY_ORDER[index] };
}

/** 'Continue to Next Mission' for indexes 0 to 4, 'Finish the Journey' for index 5. */
export function continueLabel(journeyIndex) {
  return journeyIndex === LAST_INDEX ? FINISH_LABEL : CONTINUE_LABEL;
}

/** e.g. 'Mission 2 of 6 · Apollo 11' (index is zero-based). */
export function journeyProgressLabel(index, missions) {
  const id = JOURNEY_ORDER[index];
  const mission = (missions || []).find((m) => m.id === id);
  const name = mission ? mission.name : id;
  return `Mission ${index + 1} of ${JOURNEY_ORDER.length} · ${name}`;
}

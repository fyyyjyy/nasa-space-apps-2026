// Pure helpers for wiring audio into the app (task 25.11). No DOM, no engine.

/**
 * Build the `config` argument for resolveTrack / the audio controller.
 * Each mission entry carries its audio ids from audio.json plus the real chapter count,
 * so the last chapter can pick the variation track.
 * @param {{ missions?: Record<string, {audio?: object}> }} audioData audio.json
 * @param {Array<{ id: string, chapters?: any[] }>} missions content missions
 */
export function buildTrackConfig(audioData, missions) {
  const out = {};
  const byId = (audioData && audioData.missions) || {};
  for (const m of missions || []) {
    const a = byId[m.id] && byId[m.id].audio;
    if (!a) continue;
    out[m.id] = {
      id: m.id,
      audio: { ...a },
      chapterCount: Array.isArray(m.chapters) ? m.chapters.length : 0,
    };
  }
  return { missions: out };
}

const NAVIGATED_TARGETS = new Set(['FLY_OUT', 'JOURNEY_TRANSITION']);

/**
 * True when a screen change came from CONTINUE (SUMMARY -> JOURNEY_TRANSITION), or from
 * FINISH_JOURNEY / RETURN_TO_SPACE / EXIT_JOURNEY (anything -> FLY_OUT).
 * Closing a quiz (QUIZ -> SUMMARY) is not navigation.
 */
export function isNavigatedTransition(prev, next) {
  if (!prev || !next || prev.screen === next.screen) return false;
  return NAVIGATED_TARGETS.has(next.screen);
}

/** Chapter index to use for track resolution: the last chapter on SUMMARY, else the active one. */
export function audioChapterIndex(screen, activeIndex, chapterCount) {
  if (screen === 'SUMMARY') return Math.max(0, (chapterCount || 1) - 1);
  return Number.isInteger(activeIndex) && activeIndex >= 0 ? activeIndex : 0;
}

/** Track id of a mission's base track, or null. */
export function missionTrackId(audioData, missionId) {
  const a = audioData && audioData.missions && audioData.missions[missionId];
  return (a && a.audio && a.audio.trackId) || null;
}

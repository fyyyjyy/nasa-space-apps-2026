// Adaptive quality levels (Requirement 13.9). Pure module: the render loop
// measures fps and keeps the counters; this maps them to a level.
// Index 0 is the best quality. starShare is the fraction of the base star count
// (base 2000, so the minimum level keeps 1000 stars).

export const QUALITY_LEVELS = Object.freeze([
  Object.freeze({ pixelRatio: 2, starShare: 1 }),
  Object.freeze({ pixelRatio: 1.5, starShare: 1 }),
  Object.freeze({ pixelRatio: 1, starShare: 1 }),
  Object.freeze({ pixelRatio: 1, starShare: 0.75 }),
  Object.freeze({ pixelRatio: 1, starShare: 0.5 }),
]);

export const MAX_LEVEL = QUALITY_LEVELS.length - 1;

const LOW_FPS = 30;
const LOW_SECONDS = 3; // step down when strictly more than this
const HIGH_FPS = 55;
const HIGH_SECONDS = 10; // step up when at least this

function clampLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_LEVEL, Math.max(0, Math.round(n)));
}

export function nextQualityLevel(currentLevel, recentFps, secondsBelow30, secondsAtOrAbove55 = 0) {
  const level = clampLevel(currentLevel);
  if (recentFps < LOW_FPS && secondsBelow30 > LOW_SECONDS && level < MAX_LEVEL) {
    return level + 1;
  }
  if (recentFps >= HIGH_FPS && secondsAtOrAbove55 >= HIGH_SECONDS && level > 0) {
    return level - 1;
  }
  return level;
}

/**
 * Rolling fps tracker for the render loop. Feed it one `frame(nowMs)` call per
 * rendered frame. Each full second it computes fps, updates the below-30 and
 * at-or-above-55 counters, and asks `nextQualityLevel` for the level.
 * Counters reset whenever the level changes.
 * @param {{startLevel?: number, windowMs?: number}} [options]
 */
export function createQualityTracker({ startLevel = 0, windowMs = 1000 } = {}) {
  let level = clampLevel(startLevel);
  let windowStart = null;
  let frames = 0;
  let secondsBelow30 = 0;
  let secondsAtOrAbove55 = 0;
  let lastFps = 0;

  function resetCounters() {
    secondsBelow30 = 0;
    secondsAtOrAbove55 = 0;
  }

  return {
    /** @returns {number|null} the new level if it changed on this call, else null */
    frame(nowMs) {
      if (windowStart === null) {
        windowStart = nowMs;
        frames = 0;
        return null;
      }
      frames++;
      const elapsed = nowMs - windowStart;
      if (elapsed < windowMs) return null;
      const seconds = elapsed / 1000;
      lastFps = frames / seconds;
      windowStart = nowMs;
      frames = 0;
      if (lastFps < LOW_FPS) {
        secondsBelow30 += seconds;
        secondsAtOrAbove55 = 0;
      } else if (lastFps >= HIGH_FPS) {
        secondsAtOrAbove55 += seconds;
        secondsBelow30 = 0;
      } else {
        resetCounters();
      }
      const next = nextQualityLevel(level, lastFps, secondsBelow30, secondsAtOrAbove55);
      if (next === level) return null;
      level = next;
      resetCounters();
      return level;
    },
    /** Discard the current window (e.g. after the tab was hidden). */
    reset() {
      windowStart = null;
      frames = 0;
      resetCounters();
    },
    getLevel: () => level,
    getFps: () => lastFps,
  };
}

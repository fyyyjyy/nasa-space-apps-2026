// Frame pacing: caps rendering at maxFps regardless of display refresh rate.
//
// Two layers:
//  1. A spacing check with ~1 ms tolerance, so timestamp jitter on a 60 Hz display
//     (a frame arriving at 16.6 ms) is not skipped and the rate does not fall to 30 fps.
//  2. A rolling one-second window: at most `maxFps` renders may happen in any
//     1000 ms window. This is the hard cap (Requirement 1.4) that the tolerance cannot break.

/** Jitter tolerance (ms) for the spacing check. */
export const JITTER_TOLERANCE_MS = 1;
const WINDOW_MS = 1000;

/**
 * Pure spacing check: has at least one frame interval (minus jitter tolerance)
 * passed since the last render? Does NOT enforce the rolling-window hard cap;
 * use createFrameLimiter for that.
 * @param {number} nowMs timestamp of the current animation frame
 * @param {number|null|undefined} lastRenderMs timestamp of the last rendered frame
 * @param {number} [maxFps=60]
 * @returns {boolean}
 */
export function shouldRenderFrame(nowMs, lastRenderMs, maxFps = 60) {
  if (!Number.isFinite(nowMs)) return false;
  if (!Number.isFinite(lastRenderMs)) return true; // first frame
  if (!(maxFps > 0)) return false;
  const minIntervalMs = 1000 / maxFps;
  const tolerance = Math.min(JITTER_TOLERANCE_MS, minIntervalMs / 2);
  const elapsed = nowMs - lastRenderMs;
  if (elapsed < 0) return true; // clock reset (e.g. timeline restarted)
  return elapsed + tolerance >= minIntervalMs;
}

/**
 * Stateful limiter. `shouldRender(nowMs)` returns true and records the render
 * when the frame is allowed; returns false (recording nothing) otherwise.
 * Guarantees: never more than `maxFps` approved frames in any 1000 ms window,
 * and a steady 60 Hz source with small jitter is approved at about 60 fps.
 * @param {number} [maxFps=60]
 * @returns {{ shouldRender: (nowMs: number) => boolean, reset: () => void }}
 */
export function createFrameLimiter(maxFps = 60) {
  const capacity = Math.max(1, Math.floor(maxFps));
  let times = []; // timestamps of the most recent approved renders (oldest first)

  return {
    shouldRender(nowMs) {
      if (!Number.isFinite(nowMs)) return false;
      const last = times.length ? times[times.length - 1] : null;
      if (last !== null && nowMs < last) times = []; // clock reset
      const lastRender = times.length ? times[times.length - 1] : null;
      if (!shouldRenderFrame(nowMs, lastRender, maxFps)) return false;
      if (times.length >= capacity && nowMs - times[times.length - capacity] < WINDOW_MS) {
        return false; // hard cap: `capacity` renders already within the last second
      }
      times.push(nowMs);
      if (times.length > capacity) times.shift();
      return true;
    },
    reset() {
      times = [];
    },
  };
}

// Pure scroll maths for the story column. No DOM, no Three.js.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Normalises scrollTop within [rangeStart, rangeEnd] to [0, 1]. */
export function normalizeProgress(scrollTop, rangeStart, rangeEnd) {
  if (!Number.isFinite(scrollTop)) return 0;
  if (!(rangeEnd > rangeStart)) return scrollTop <= rangeStart ? 0 : 1;
  return clamp01((scrollTop - rangeStart) / (rangeEnd - rangeStart));
}

/** Index of the chapter whose [start, end) contains scrollTop, or -1. */
export function activeChapterIndex(scrollTop, chapterRanges) {
  if (!Array.isArray(chapterRanges) || !Number.isFinite(scrollTop)) return -1;
  let found = -1;
  for (let i = 0; i < chapterRanges.length; i++) {
    const { start, end } = chapterRanges[i];
    if (scrollTop >= start && scrollTop < end) found = i;
    else if (scrollTop < start) break;
  }
  return found;
}

/** Narrative progress across all chapters (summary excluded), 0..1. */
export function overallProgress(scrollTop, chapterRanges) {
  if (!Array.isArray(chapterRanges) || chapterRanges.length === 0) return 0;
  const start = chapterRanges[0].start;
  const end = chapterRanges[chapterRanges.length - 1].end;
  return normalizeProgress(scrollTop, start, end);
}

/** "Chapter n of N" values; current is clamped to 1..total. */
export function chapterLabel(activeIndex, chapterCount) {
  const total = Math.max(0, Math.floor(chapterCount) || 0);
  const idx = Number.isFinite(activeIndex) ? Math.floor(activeIndex) : -1;
  const current = total === 0 ? 0 : Math.min(total, Math.max(1, idx + 1));
  return { current, total };
}

const lerp = (a, b, t) => a + (b - a) * t;

// Shortest-path angle interpolation (radians).
function lerpAngle(a, b, t) {
  const TAU = Math.PI * 2;
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d < -Math.PI) d += TAU;
  return a + d * t;
}

// Shortest-path angle interpolation (degrees).
function lerpDegrees(a, b, t) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  else if (d < -180) d += 360;
  return a + d * t;
}

const lerpVec = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

/** Interpolates two keyframes for t in [0, 1]. Rotations take the shortest path. */
export function interpolateKeyframe(a, b, t) {
  const k = clamp01(Number.isFinite(t) ? t : 0);
  return {
    cameraOffset: lerpVec(a.cameraOffset, b.cameraOffset, k),
    lookAt: lerpVec(a.lookAt, b.lookAt, k),
    modelRotation: a.modelRotation.map((v, i) => lerpAngle(v, b.modelRotation[i], k)),
    modelZoom: lerp(a.modelZoom, b.modelZoom, k),
    lightAzimuthDeg: lerpDegrees(a.lightAzimuthDeg, b.lightAzimuthDeg, k),
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity, k),
  };
}

/** True once scrollTop is at or beyond the end of the last chapter. */
export function isPastLastChapter(scrollTop, chapterRanges) {
  if (!Array.isArray(chapterRanges) || chapterRanges.length === 0) return false;
  return scrollTop >= chapterRanges[chapterRanges.length - 1].end;
}

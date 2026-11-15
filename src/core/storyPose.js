// Pure helpers for the story camera and keyframe wiring (Requirements 5.2, 6.5, 6.13).
// No Three.js here: vectors are plain [x, y, z] arrays so these can be unit tested.

/** Length of a typical keyframe cameraOffset; the fly-in end distance corresponds to it. */
export const REFERENCE_OFFSET_LENGTH = 3.2;
export const MAX_KEYFRAME_MS = 800;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const normalize = (a) => {
  const l = len(a);
  return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0];
};

/**
 * Local frame at the site: x = east, y = up (surface normal), z = south (the camera sits
 * south of the site looking north, as the fly-in pose does).
 * @param {number[]} normal outward surface normal
 * @param {number[]} [northHint] world direction used as "north" (default +Y)
 * @returns {{ x: number[], y: number[], z: number[] }}
 */
export function siteBasis(normal, northHint = [0, 1, 0]) {
  const y = normalize(normal);
  let north = sub(northHint, y.map((v) => v * dot(northHint, y)));
  if (len(north) < 1e-8) {
    // The site is at a pole: pick any tangent direction.
    const alt = Math.abs(y[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    north = sub(alt, y.map((v) => v * dot(alt, y)));
  }
  north = normalize(north);
  const z = north.map((v) => -v);
  const x = cross(y, z);
  return { x, y, z };
}

/** Scale that maps keyframe units to world units, from the camera distance used at fly-in end. */
export function storyUnit(flyInDistance) {
  return Number.isFinite(flyInDistance) && flyInDistance > 0
    ? flyInDistance / REFERENCE_OFFSET_LENGTH
    : 1;
}

/**
 * Camera pose for a keyframe, relative to the site anchor and expressed in the site basis.
 * @returns {{ position: number[], target: number[] } | null}
 */
export function cameraPoseForKeyframe({ anchor, basis, unit }, keyframe) {
  if (!keyframe || !Array.isArray(keyframe.cameraOffset) || !Array.isArray(keyframe.lookAt)) {
    return null;
  }
  const toWorld = (v) => [
    anchor[0] + (basis.x[0] * v[0] + basis.y[0] * v[1] + basis.z[0] * v[2]) * unit,
    anchor[1] + (basis.x[1] * v[0] + basis.y[1] * v[1] + basis.z[1] * v[2]) * unit,
    anchor[2] + (basis.x[2] * v[0] + basis.y[2] * v[1] + basis.z[2] * v[2]) * unit,
  ];
  return { position: toWorld(keyframe.cameraOffset), target: toWorld(keyframe.lookAt) };
}

/** Model keyframe tween length: instant with reduced motion, otherwise the 800 ms maximum. */
export function keyframeDurationMs(reducedMotion) {
  return reducedMotion ? 0 : MAX_KEYFRAME_MS;
}

/** Returns a function that calls `fn` the first time only. */
export function once(fn) {
  let called = false;
  return (...args) => {
    if (called) return undefined;
    called = true;
    return fn(...args);
  };
}

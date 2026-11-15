// Pure camera pose for the opening view (Moon at x -0.45, Mars at x 0.7).
export const OPENING_DISTANCE = 6;
// Horizontal extent of both bodies: Moon left edge to Mars right edge, in scene units.
export const OPENING_MIN_X = -0.45 - 0.28;
export const OPENING_MAX_X = 0.7 + 0.55;
const MARGIN = 1.15;

/**
 * Opening camera pose. Landscape (aspect >= 1) keeps the original pose. In portrait the
 * camera is centred on the pair of bodies and, if needed, pulled back so both fit.
 * @param {number} aspect width / height
 * @param {number} [fovDeg] vertical field of view
 * @returns {{target:[number,number,number], position:[number,number,number]}}
 */
export function openingPose(aspect, fovDeg = 45) {
  if (!(aspect > 0) || aspect >= 1) {
    return { target: [0, 0, 0], position: [0, 0, OPENING_DISTANCE] };
  }
  const cx = (OPENING_MIN_X + OPENING_MAX_X) / 2;
  const halfW = ((OPENING_MAX_X - OPENING_MIN_X) / 2) * MARGIN;
  const tanV = Math.tan((fovDeg * Math.PI) / 360);
  const dist = Math.max(OPENING_DISTANCE, halfW / (tanV * aspect));
  return { target: [cx, 0, 0], position: [cx, 0, dist] };
}

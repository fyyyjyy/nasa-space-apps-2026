// Starfield: seeded, stratified star positions rendered as a single THREE.Points.
import { BufferAttribute, BufferGeometry, Points, PointsMaterial, Vector3 } from 'three';

export const DEFAULT_STAR_COUNT = 4500;
export const DEFAULT_SEED = 20260;
const MIN_RADIUS = 200;
const MAX_RADIUS = 400;
// Share of stars placed in the forward view (around the -z viewing axis).
const FORWARD_SHARE = 0.7;
// Tangent-plane half extents of the forward region (covers portrait up to ultrawide: at fov 45 a 21:9 screen needs about 0.97).
const FORWARD_HALF_U = 1.1;
const FORWARD_HALF_V = 0.4;

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate star positions on a large sphere around the origin.
 * About 70% of the stars are stratified evenly over the four screen quadrants
 * in front of the initial camera, the rest are spread over the whole sphere.
 * Star order is shuffled so any prefix keeps the distribution (used by setStarShare).
 * @param {number} count
 * @param {number} seed
 * @returns {Float32Array} xyz triples
 */
export function generateStarPositions(count, seed = DEFAULT_SEED) {
  const n = Math.max(0, Math.floor(count));
  const rand = mulberry32(seed);
  const dirs = [];

  const perQuadrant = Math.floor((n * FORWARD_SHARE) / 4);
  const grid = Math.max(1, Math.ceil(Math.sqrt(perQuadrant)));
  for (let q = 0; q < 4; q++) {
    const sx = q % 2 === 0 ? -1 : 1;
    const sy = q < 2 ? 1 : -1;
    for (let i = 0; i < perQuadrant; i++) {
      const cx = i % grid;
      const cy = Math.floor(i / grid) % grid;
      const fx = (cx + rand()) / grid; // 0..1 within quadrant
      const fy = (cy + rand()) / grid;
      const u = sx * Math.max(fx, 1e-4) * FORWARD_HALF_U;
      const v = sy * Math.max(fy, 1e-4) * FORWARD_HALF_V;
      dirs.push(new Vector3(u, v, -1).normalize());
    }
  }

  // Remaining stars: uniform over the sphere, stratified by height.
  const rest = n - dirs.length;
  for (let i = 0; i < rest; i++) {
    const z = 1 - 2 * ((i + rand()) / rest);
    const phi = rand() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    dirs.push(new Vector3(r * Math.cos(phi), r * Math.sin(phi), z));
  }

  // Seeded Fisher-Yates shuffle so prefixes stay balanced.
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }

  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const radius = MIN_RADIUS + rand() * (MAX_RADIUS - MIN_RADIUS);
    out[i * 3] = dirs[i].x * radius;
    out[i * 3 + 1] = dirs[i].y * radius;
    out[i * 3 + 2] = dirs[i].z * radius;
  }
  return out;
}

/**
 * Count stars visible in each screen quadrant for a camera.
 * @param {Float32Array} positions
 * @param {import('three').Camera} camera
 * @returns {[number, number, number, number]} [top-left, top-right, bottom-left, bottom-right]
 */
export function countStarsPerQuadrant(positions, camera) {
  camera.updateMatrixWorld();
  const counts = [0, 0, 0, 0];
  const p = new Vector3();
  for (let i = 0; i + 2 < positions.length; i += 3) {
    p.set(positions[i], positions[i + 1], positions[i + 2]).project(camera);
    if (p.z < -1 || p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;
    const col = p.x < 0 ? 0 : 1;
    const row = p.y >= 0 ? 0 : 1;
    counts[row * 2 + col]++;
  }
  return counts;
}

/**
 * Build the starfield.
 * @param {{count?: number, seed?: number}} [options]
 * @returns {{points: Points, setStarShare: (share: number) => void, getStarCount: () => number, dispose: () => void}}
 */
export function createStarfield({ count = DEFAULT_STAR_COUNT, seed = DEFAULT_SEED } = {}) {
  const total = Math.max(2000, Math.floor(count));
  const positions = generateStarPositions(total, seed);

  // Slight brightness variation per star.
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const colors = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    const b = 0.45 + rand() * 0.55;
    const tint = (rand() - 0.5) * 0.12;
    colors[i * 3] = Math.min(1, b + tint);
    colors[i * 3 + 1] = b;
    colors[i * 3 + 2] = Math.min(1, b - tint);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  const material = new PointsMaterial({
    size: 1.6,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.name = 'starfield';
  points.frustumCulled = false;
  points.renderOrder = -1;

  function setStarShare(share) {
    const s = Math.min(1, Math.max(0, Number.isFinite(share) ? share : 1));
    geometry.setDrawRange(0, Math.round(total * s));
  }

  return {
    points,
    setStarShare,
    getStarCount: () => total,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

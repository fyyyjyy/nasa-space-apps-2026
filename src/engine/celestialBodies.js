// Moon and Mars spheres shown in the opening scene.
import { Mesh, MeshStandardMaterial, SphereGeometry, SRGBColorSpace, TextureLoader } from 'three';

// Scene radius = km * SCALE, so Mars is 0.55 units and the Moon about 0.28.
// At the initial camera (z = 6, fov 45) the visible width is about 4.97 * aspect, so
// both bodies are fully in view down to about 0.5 aspect (portrait) and each is
// well above 5% of the viewport width.
const SCALE = 0.55 / 3389.5;
const SEGMENTS = 64;
const ROTATION_RAD_PER_SEC = 0.04;

const BODY_CONFIG = {
  moon: { x: -0.45, fallbackColor: 0x8a8a8a },
  mars: { x: 0.7, fallbackColor: 0xb7552e },
};

const meshes = new Map();
const radii = new Map();
const spinPaused = new Set();

/** Pauses or resumes the idle spin of one body (markers stay on the near side while paused). */
export function setSpinPaused(bodyId, paused) {
  if (paused) spinPaused.add(bodyId);
  else spinPaused.delete(bodyId);
}

function textureUrl(path) {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base.endsWith('/') ? base : `${base}/`}${String(path).replace(/^\/+/, '')}`;
}

/**
 * Create the Moon and Mars meshes.
 * @param {{bodies: Record<string, {texture: string, radiusKm: number}>}} site site.json contents
 * @param {{addUpdateCallback?: (cb: (nowMs: number) => void) => unknown}} [sceneManager]
 * @returns {{moon: Mesh, mars: Mesh, group: Mesh[]}}
 */
export function createCelestialBodies(site, sceneManager) {
  const loader = new TextureLoader();
  meshes.clear();
  radii.clear();

  for (const [id, cfg] of Object.entries(BODY_CONFIG)) {
    const info = site.bodies[id];
    const radius = info.radiusKm * SCALE;
    const material = new MeshStandardMaterial({ color: cfg.fallbackColor, roughness: 1, metalness: 0 });
    const mesh = new Mesh(new SphereGeometry(radius, SEGMENTS, SEGMENTS), material);
    mesh.name = id;
    mesh.position.set(cfg.x, 0, 0);

    loader.load(
      textureUrl(info.texture),
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      },
      undefined,
      (err) => {
        // Keep the flat-colour fallback material.
        console.error(`Failed to load texture for ${id}`, err);
      },
    );

    meshes.set(id, mesh);
    radii.set(id, radius);
  }

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && sceneManager?.addUpdateCallback) {
    let last = null;
    sceneManager.addUpdateCallback((nowMs) => {
      const dt = last === null ? 0 : Math.min((nowMs - last) / 1000, 0.1);
      last = nowMs;
      for (const [id, mesh] of meshes) {
        if (!spinPaused.has(id)) mesh.rotation.y += ROTATION_RAD_PER_SEC * dt;
      }
    });
  }

  return { moon: meshes.get('moon'), mars: meshes.get('mars'), group: [...meshes.values()] };
}

/** @param {'moon'|'mars'} bodyId */
export function getMesh(bodyId) {
  return meshes.get(bodyId) ?? null;
}

/** Scene-unit radius of the body (for use with geo.js latLonToVector3). */
export function getRadius(bodyId) {
  return radii.get(bodyId) ?? null;
}

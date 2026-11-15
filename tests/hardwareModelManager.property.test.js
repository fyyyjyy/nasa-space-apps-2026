import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene } from 'three';
import {
  clampModelZoom,
  computeFitScale,
  createHardwareModelManager,
  loaderKindForPath,
} from '../src/engine/hardwareModelManager.js';
import { STRINGS } from '../src/ui/strings.js';

const dim = fc.double({ min: 0.01, max: 1000, noNaN: true });

// Feature: nasa-space-apps-2026, Property 9: Model fits in view
// **Validates: Requirements 5.2**
describe('Property 9: Model fits in view', () => {
  it('scaled bounding box fits the left half (wide) or top 40% (narrow) of the view', () => {
    fc.assert(
      fc.property(
        dim, dim, dim,
        fc.double({ min: 10, max: 120, noNaN: true }),
        fc.double({ min: 0.3, max: 4, noNaN: true }),
        fc.double({ min: 0.5, max: 500, noNaN: true }),
        fc.constantFrom('wide', 'narrow'),
        (x, y, z, fov, aspect, dist, layout) => {
          const s = computeFitScale({ x, y, z }, fov, aspect, dist, layout);
          const viewH = 2 * dist * Math.tan((fov * Math.PI) / 360);
          const viewW = viewH * aspect;
          const regionW = layout === 'narrow' ? viewW : viewW / 2;
          const regionH = layout === 'narrow' ? viewH * 0.4 : viewH;
          const tol = 1 + 1e-9;
          // Any rotation of the box stays within its bounding sphere, so extents are bounded by the diagonal.
          const diag = Math.hypot(x, y, z) * s;
          return s > 0 && diag <= regionW * tol && diag <= regionH * tol;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('fitToView scales a real mesh to fit', () => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 16 / 9, 0.1, 1000);
    camera.position.set(0, 0, 6);
    const mgr = createHardwareModelManager({ scene, camera, getMission: () => ({ name: 'M' }) });
    const mesh = new Mesh(new BoxGeometry(40, 10, 5), new MeshBasicMaterial());
    const s = mgr.fitToView(mesh, camera);
    const half = (2 * 6 * Math.tan((45 * Math.PI) / 360) * (16 / 9)) / 2;
    expect(40 * s).toBeLessThanOrEqual(half);
  });
});

// Feature: nasa-space-apps-2026, Property 10: Model zoom clamp
// **Validates: Requirements 5.4**
describe('Property 10: Model zoom clamp', () => {
  it('always returns a value in [0.5, 5]', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: false }), (z) => {
        const r = clampModelZoom(z);
        return r >= 0.5 && r <= 5;
      }),
    );
  });
  it('returns in-range values unchanged', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.5, max: 5, noNaN: true }), (z) => clampModelZoom(z) === z),
    );
  });
});

function makeObj() {
  return new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
}

function setup(loadGltf) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 16 / 9, 0.1, 1000);
  camera.position.set(0, 0, 6);
  const notify = vi.fn();
  const mgr = createHardwareModelManager({
    scene,
    camera,
    getMission: (id) => ({ id, name: `Mission ${id}`, model: { path: `/models/${id}.glb` } }),
    loadGltf,
    notify,
    timeoutMs: 10000,
  });
  return { scene, mgr, notify };
}

// Feature: nasa-space-apps-2026, Property 11: Unload removes the model
// **Validates: Requirements 5.7**
describe('Property 11: Unload removes the model', () => {
  it('leaves no model objects in the scene, real or placeholder', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 8 }), fc.boolean(), async (id, fail) => {
        const { scene, mgr } = setup(() => (fail ? Promise.reject(new Error('x')) : Promise.resolve(makeObj())));
        const baseline = scene.children.length;
        const obj = await mgr.load(id);
        mgr.show(id, { position: { x: 1, y: 2, z: 3 }, normal: { x: 0, y: 1, z: 0 } });
        expect(scene.children.length).toBeGreaterThan(baseline);
        mgr.unload();
        let found = false;
        scene.traverse((o) => {
          if (o === obj) found = true;
        });
        return !found && scene.children.length === baseline && mgr.getRoot() === null;
      }),
      { numRuns: 30 },
    );
  });
});

describe('hardwareModelManager unit tests', () => {
  afterEach(() => vi.useRealTimers());

  it('selects loader by extension', () => {
    expect(loaderKindForPath('a/b.GLB')).toBe('gltf');
    expect(loaderKindForPath('a/b.obj')).toBe('obj');
    expect(loaderKindForPath('a/b.fbx')).toBeNull();
  });

  it('load failure gives a labelled placeholder and a notification (Req 4.6, 5.6)', async () => {
    const { mgr, notify } = setup(() => Promise.reject(new Error('404')));
    const obj = await mgr.load('s3');
    expect(obj.userData.placeholder).toBe(true);
    const label = obj.children.find((c) => c.name === 'model-label');
    expect(label.userData.label).toBe(STRINGS.modelUnavailable('Mission s3'));
    expect(notify).toHaveBeenCalledWith(STRINGS.toast.modelLoadFailed);
  });

  it('times out after 10 s with a placeholder', async () => {
    vi.useFakeTimers();
    const { mgr, notify } = setup(() => new Promise(() => {}));
    const p = mgr.load('s3');
    await vi.advanceTimersByTimeAsync(10000);
    const obj = await p;
    expect(obj.userData.placeholder).toBe(true);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('keeps ambient light above the minimum and caps keyframe duration at 800 ms', async () => {
    const { mgr } = setup(() => Promise.resolve(makeObj()));
    await mgr.load('a');
    mgr.show('a', { position: { x: 0, y: 0, z: 0 } });
    mgr.applyKeyframe(
      { modelRotation: [0, 1, 0], modelZoom: 99, lightAzimuthDeg: 30, lightIntensity: 0 },
      5000,
      1,
    );
    mgr.update(1);
    mgr.update(801);
    expect(mgr.getRoot().rotation.y).toBeCloseTo(1);
    expect(mgr.lights[0].intensity).toBeGreaterThanOrEqual(0.25);
    expect(clampModelZoom(99)).toBe(5);
  });
});

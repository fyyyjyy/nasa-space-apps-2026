import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Group, Object3D, PerspectiveCamera } from 'three';
import {
  clampZoomOffset,
  createModelInspector,
  rotateByDrag,
  zoomByPinch,
  zoomByWheel,
} from '../src/engine/modelInspector.js';
import { createHardwareModelManager } from '../src/engine/hardwareModelManager.js';

function setup() {
  const scene = new Group();
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  const manager = createHardwareModelManager({
    scene,
    camera,
    getMission: () => ({ name: 'M', model: { path: 'a.glb' } }),
    loadGltf: async () => new Object3D(),
    notify: () => {},
  });
  return manager;
}

async function shown() {
  const manager = setup();
  await manager.load('m');
  manager.show('m', { position: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } });
  const el = document.createElement('div');
  const inspector = createModelInspector({ element: el, manager });
  return { manager, el, inspector };
}

function ptr(el, type, id, x, y, extra = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(e, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', button: 0, ...extra });
  el.dispatchEvent(e);
  return e;
}

describe('pure logic', () => {
  it('rotates on both axes in the drag direction', () => {
    const r = rotateByDrag({ yaw: 0, pitch: 0 }, 10, -5);
    expect(r.yaw).toBeGreaterThan(0);
    expect(r.pitch).toBeLessThan(0);
  });

  it('keeps chapterZoom * offset within 0.5..5 for any input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        fc.double({ min: 0.5, max: 5, noNaN: true }),
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        (off, chapter, dy) => {
          for (const z of [clampZoomOffset(off, chapter), zoomByWheel(off, dy, 0, chapter), zoomByPinch(off, 10, Math.abs(dy), chapter)]) {
            const total = z * chapter;
            expect(total).toBeGreaterThanOrEqual(0.5 - 1e-9);
            expect(total).toBeLessThanOrEqual(5 + 1e-9);
          }
        },
      ),
    );
  });

  it('wheel up zooms in, pinch apart zooms in, degenerate pinch is a no-op', () => {
    expect(zoomByWheel(1, -100)).toBeGreaterThan(1);
    expect(zoomByWheel(1, 100)).toBeLessThan(1);
    expect(zoomByPinch(1, 100, 200)).toBeCloseTo(2);
    expect(zoomByPinch(1, 0, 200)).toBe(1);
  });
});

describe('pointer events', () => {
  it('one pointer rotates the content, not the chapter keyframe rotation', async () => {
    const { manager, el } = await shown();
    manager.applyKeyframe({ modelRotation: [0, 1, 0], modelZoom: 1 }, 0);
    ptr(el, 'pointerdown', 1, 0, 0);
    ptr(el, 'pointermove', 1, 50, 20);
    const o = manager.getInspectionOffset();
    expect(o.yaw).toBeGreaterThan(0);
    expect(o.pitch).toBeGreaterThan(0);
    expect(manager.getContent().rotation.y).toBeCloseTo(o.yaw);
    expect(manager.getRoot().rotation.y).toBeCloseTo(1);
    ptr(el, 'pointerup', 1, 50, 20);
    ptr(el, 'pointermove', 1, 200, 200);
    expect(manager.getInspectionOffset().yaw).toBeCloseTo(o.yaw);
  });

  it('two pointers pinch to zoom, clamped to 5x, and offset survives a keyframe', async () => {
    const { manager, el } = await shown();
    const base = manager.getRoot().scale.x;
    ptr(el, 'pointerdown', 1, 0, 0);
    ptr(el, 'pointerdown', 2, 10, 0);
    ptr(el, 'pointermove', 2, 1000, 0);
    expect(manager.getInspectionOffset().zoom).toBe(5);
    expect(manager.getRoot().scale.x).toBeCloseTo(base * 5);
    manager.applyKeyframe({ modelZoom: 2 }, 0);
    expect(manager.getRoot().scale.x).toBeCloseTo(base * 5); // 2 * 5 clamped to 5
    expect(manager.getInspectionOffset().yaw).toBe(0); // pinch does not rotate
  });

  it('wheel zooms, clamps at 0.5, and prevents page scroll', async () => {
    const { manager, el } = await shown();
    const e = new Event('wheel', { bubbles: true, cancelable: true });
    Object.assign(e, { deltaY: 1e5, deltaMode: 0 });
    el.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(manager.getInspectionOffset().zoom).toBe(0.5);
  });

  it('sets touch-action none, ignores non-primary mouse buttons, and ignores events outside the element', async () => {
    const { manager, el } = await shown();
    expect(el.style.touchAction).toBe('none');
    ptr(el, 'pointerdown', 1, 0, 0, { pointerType: 'mouse', button: 2 });
    ptr(el, 'pointermove', 1, 50, 50, { pointerType: 'mouse' });
    expect(manager.getInspectionOffset().yaw).toBe(0);
    const story = document.createElement('div');
    document.body.append(story);
    ptr(story, 'pointerdown', 3, 0, 0);
    ptr(story, 'pointermove', 3, 50, 50);
    expect(manager.getInspectionOffset().yaw).toBe(0);
  });

  it('does nothing without a model, resets, and stops after destroy', async () => {
    const manager = setup();
    const el = document.createElement('div');
    const insp = createModelInspector({ element: el, manager });
    ptr(el, 'pointerdown', 1, 0, 0);
    ptr(el, 'pointermove', 1, 50, 50);
    expect(manager.getInspectionOffset().yaw).toBe(0);

    const s = await shown();
    ptr(s.el, 'pointerdown', 1, 0, 0);
    ptr(s.el, 'pointermove', 1, 50, 50);
    s.inspector.reset();
    expect(s.manager.getInspectionOffset()).toEqual({ yaw: 0, pitch: 0, zoom: 1 });
    s.inspector.destroy();
    ptr(s.el, 'pointerdown', 1, 0, 0);
    ptr(s.el, 'pointermove', 1, 90, 90);
    expect(s.manager.getInspectionOffset().yaw).toBe(0);
    insp.destroy();
  });
});

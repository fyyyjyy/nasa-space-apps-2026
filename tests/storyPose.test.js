import { describe, it, expect, vi } from 'vitest';
import {
  siteBasis,
  storyUnit,
  cameraPoseForKeyframe,
  keyframeDurationMs,
  once,
} from '../src/core/storyPose.js';

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

describe('siteBasis', () => {
  it('gives east, up, south for a site on +Y', () => {
    const b = siteBasis([0, 1, 0], [0, 0, -1]);
    expect(close(b.y, [0, 1, 0])).toBe(true);
    expect(close(b.z, [0, 0, 1])).toBe(true);
    expect(close(b.x, [1, 0, 0])).toBe(true);
  });

  it('stays orthonormal at a pole', () => {
    const b = siteBasis([0, 1, 0]);
    expect(Math.hypot(...b.x)).toBeCloseTo(1);
    expect(Math.hypot(...b.z)).toBeCloseTo(1);
    expect(b.x[0] * b.z[0] + b.x[1] * b.z[1] + b.x[2] * b.z[2]).toBeCloseTo(0);
  });
});

describe('cameraPoseForKeyframe', () => {
  const basis = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  it('places the camera relative to the anchor, scaled by unit', () => {
    const p = cameraPoseForKeyframe(
      { anchor: [10, 0, 0], basis, unit: 2 },
      { cameraOffset: [0, 0.4, 3.2], lookAt: [0, 0.2, 0] },
    );
    expect(close(p.position, [10, 0.8, 6.4])).toBe(true);
    expect(close(p.target, [10, 0.4, 0])).toBe(true);
  });
  it('returns null without a usable keyframe', () => {
    expect(cameraPoseForKeyframe({ anchor: [0, 0, 0], basis, unit: 1 }, null)).toBeNull();
  });
});

describe('storyUnit, keyframeDurationMs, once', () => {
  it('maps the fly-in distance to the reference offset', () => {
    expect(storyUnit(3.2)).toBeCloseTo(1);
    expect(storyUnit(0)).toBe(1);
  });
  it('is instant with reduced motion and at most 800 ms otherwise', () => {
    expect(keyframeDurationMs(true)).toBe(0);
    expect(keyframeDurationMs(false)).toBeLessThanOrEqual(800);
  });
  it('calls once only', () => {
    const fn = vi.fn();
    const g = once(fn);
    g();
    g();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

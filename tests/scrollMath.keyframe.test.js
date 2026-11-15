import { describe, it, expect } from 'vitest';
import { interpolateKeyframe, isPastLastChapter } from '../src/core/scrollMath.js';

const kf = (o = {}) => ({
  cameraOffset: [0, 0, 10],
  lookAt: [0, 0, 0],
  modelRotation: [0, 0, 0],
  modelZoom: 1,
  lightAzimuthDeg: 0,
  lightIntensity: 1,
  ...o,
});

describe('interpolateKeyframe', () => {
  const a = kf();
  const b = kf({
    cameraOffset: [10, 20, 30],
    lookAt: [2, 4, 6],
    modelRotation: [1, 0.5, 0.25],
    modelZoom: 3,
    lightAzimuthDeg: 90,
    lightIntensity: 2,
  });

  it('returns a at t=0 and b at t=1', () => {
    expect(interpolateKeyframe(a, b, 0)).toEqual(a);
    expect(interpolateKeyframe(a, b, 1)).toEqual(b);
  });

  it('returns the midpoint at t=0.5', () => {
    const m = interpolateKeyframe(a, b, 0.5);
    expect(m.cameraOffset).toEqual([5, 10, 20]);
    expect(m.lookAt).toEqual([1, 2, 3]);
    expect(m.modelRotation).toEqual([0.5, 0.25, 0.125]);
    expect(m.modelZoom).toBe(2);
    expect(m.lightAzimuthDeg).toBe(45);
    expect(m.lightIntensity).toBe(1.5);
  });

  it('clamps t outside [0, 1]', () => {
    expect(interpolateKeyframe(a, b, -5)).toEqual(a);
    expect(interpolateKeyframe(a, b, 5)).toEqual(b);
  });

  it('wraps light azimuth over the shortest path', () => {
    const r = interpolateKeyframe(kf({ lightAzimuthDeg: 350 }), kf({ lightAzimuthDeg: 10 }), 0.5);
    expect(((r.lightAzimuthDeg % 360) + 360) % 360).toBeCloseTo(0, 9);
  });

  it('wraps model rotation over the shortest path', () => {
    const r = interpolateKeyframe(
      kf({ modelRotation: [Math.PI * 0.9, 0, 0] }),
      kf({ modelRotation: [-Math.PI * 0.9, 0, 0] }),
      0.5,
    );
    expect(Math.cos(r.modelRotation[0])).toBeCloseTo(-1, 9);
  });
});

describe('isPastLastChapter', () => {
  const ranges = [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
  ];

  it('is false before the end of the last chapter', () => {
    expect(isPastLastChapter(0, ranges)).toBe(false);
    expect(isPastLastChapter(199.9, ranges)).toBe(false);
  });

  it('is true at and after the boundary', () => {
    expect(isPastLastChapter(200, ranges)).toBe(true);
    expect(isPastLastChapter(500, ranges)).toBe(true);
  });

  it('is false for empty or invalid ranges', () => {
    expect(isPastLastChapter(100, [])).toBe(false);
    expect(isPastLastChapter(100, undefined)).toBe(false);
  });
});

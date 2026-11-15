import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createFrameLimiter } from '../src/engine/frameLimiter.js';

// Feature: nasa-space-apps-2026, Property 2: Frame cap
// **Validates: Requirements 1.4**

function approvedTimes(timestamps) {
  const limiter = createFrameLimiter(60);
  return timestamps.filter((t) => limiter.shouldRender(t));
}

function maxInAnyWindow(times, windowMs = 1000) {
  let max = 0;
  let lo = 0;
  for (let hi = 0; hi < times.length; hi++) {
    while (times[hi] - times[lo] >= windowMs) lo++;
    max = Math.max(max, hi - lo + 1);
  }
  return max;
}

function steadyFrames(hz, seconds, jitterMs = 0, jitters = []) {
  const step = 1000 / hz;
  const n = Math.floor(seconds * hz);
  const out = [];
  let prev = -Infinity;
  for (let i = 0; i < n; i++) {
    const j = jitterMs ? (jitters[i % jitters.length] ?? 0) * jitterMs : 0;
    const t = Math.max(prev, 1000 + i * step + j); // keep non-decreasing
    out.push(t);
    prev = t;
  }
  return out;
}

describe('Property 2: Frame cap', () => {
  it('never approves more than 60 frames in any rolling 1 s window (arbitrary non-decreasing timestamps)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 20, noNaN: true }), { minLength: 1, maxLength: 1500 }),
        fc.double({ min: 0, max: 10000, noNaN: true }),
        (gaps, start) => {
          let t = start;
          const ts = gaps.map((g) => (t += g));
          expect(maxInAnyWindow(approvedTimes(ts))).toBeLessThanOrEqual(60);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('never exceeds 60 per window for 60/90/120/144/240 Hz sources with jitter', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(60, 90, 120, 144, 240),
        fc.array(fc.double({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 50 }),
        (hz, jitters) => {
          const ts = steadyFrames(hz, 5, 0.4, jitters);
          expect(maxInAnyWindow(approvedTimes(ts))).toBeLessThanOrEqual(60);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('60 Hz with sub-millisecond jitter renders about 60 fps', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 50 }),
        (jitters) => {
          const ts = steadyFrames(60, 10, 0.4, jitters);
          const fps = approvedTimes(ts).length / 10;
          expect(fps).toBeGreaterThanOrEqual(57);
          expect(fps).toBeLessThanOrEqual(60);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('120 Hz renders exactly 60 fps', () => {
    const fps = approvedTimes(steadyFrames(120, 10)).length / 10;
    expect(fps).toBe(60);
  });

  it('144 Hz renders about 48 fps', () => {
    const fps = approvedTimes(steadyFrames(144, 10)).length / 10;
    expect(fps).toBeGreaterThanOrEqual(47);
    expect(fps).toBeLessThanOrEqual(49);
  });
});

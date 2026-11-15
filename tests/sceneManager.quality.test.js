import { describe, it, expect, vi } from 'vitest';
import { createQualityTracker } from '../src/engine/qualityController.js';
import * as sceneManager from '../src/engine/sceneManager.js';

// Feed frames at a constant fps for `seconds`; returns [lastTime, levelChanges].
function run(tracker, startMs, seconds, fps) {
  const step = 1000 / fps;
  const changes = [];
  let t = startMs;
  const end = startMs + seconds * 1000;
  while (t < end) {
    t += step;
    const r = tracker.frame(t);
    if (r !== null) changes.push({ t: t - startMs, level: r });
  }
  return { t, changes };
}

describe('quality tracker (Req 13.9)', () => {
  it('steps down only after more than 3 s below 30 fps', () => {
    const tr = createQualityTracker();
    const { changes } = run(tr, 0, 6, 20);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].level).toBe(1);
    expect(changes[0].t).toBeGreaterThan(3000);
  });

  it('does not step down for a short dip', () => {
    const tr = createQualityTracker();
    const all = [];
    let r = run(tr, 0, 2, 20);
    all.push(...r.changes);
    r = run(tr, r.t, 5, 45); // between 30 and 55 resets the counter
    all.push(...r.changes);
    r = run(tr, r.t, 2, 20);
    all.push(...r.changes);
    expect(all).toEqual([]);
    expect(tr.getLevel()).toBe(0);
  });

  it('steps back up after 10 s at >= 55 fps and resets counters on change', () => {
    const tr = createQualityTracker({ startLevel: 3 });
    let r = run(tr, 0, 9, 60);
    expect(r.changes).toEqual([]);
    r = run(tr, r.t, 3, 60);
    expect(r.changes[0].level).toBe(2);
    // counters reset: another step needs a further 10 s
    r = run(tr, r.t, 8, 60);
    expect(r.changes).toEqual([]);
  });

  it('reset discards the current window', () => {
    const tr = createQualityTracker();
    run(tr, 0, 2, 20);
    tr.reset();
    const { changes } = run(tr, 100000, 2, 20);
    expect(changes).toEqual([]);
  });
});

describe('sceneManager quality application', () => {
  it('passes the star share of the level to the handler', () => {
    const handler = vi.fn();
    sceneManager.setStarShareHandler(handler);
    expect(handler).toHaveBeenLastCalledWith(1);
    sceneManager.applyQualityLevel(3);
    expect(handler).toHaveBeenLastCalledWith(0.75);
    sceneManager.applyQualityLevel(4);
    expect(handler).toHaveBeenLastCalledWith(0.5);
    expect(sceneManager.getQualityLevel()).toBe(4);
    sceneManager.applyQualityLevel(0);
    sceneManager.setStarShareHandler(null);
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '../src/ui/storyColumn.js';

const kf = (n) => ({
  cameraOffset: [n, 0, 0],
  lookAt: [0, 0, 0],
  modelRotation: [0, 0, 0],
  modelZoom: 1 + n,
  lightAzimuthDeg: 0,
  lightIntensity: 1
});

const mission = {
  chapters: [0, 1, 2].map((n) => ({
    title: `T${n}`,
    narrative: `N${n}`,
    images: [],
    keyframe: kf(n * 10)
  }))
};

const VIEWPORT = 500; // trigger line at 200
const CHAPTER_H = 1000;

let rafQueue;
let handle;
let parent;

function flush() {
  const q = rafQueue;
  rafQueue = [];
  q.forEach((cb) => cb());
}

function layout(column) {
  const rect = (top, height) => () => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0 });
  column.getBoundingClientRect = () => rect(0, VIEWPORT)();
  Object.defineProperty(column, 'clientHeight', { configurable: true, value: VIEWPORT });
  column.querySelectorAll('.story-chapter').forEach((s, i) => {
    s.getBoundingClientRect = () => rect(i * CHAPTER_H - column.scrollTop, CHAPTER_H)();
  });
  const slot = column.querySelector('[data-story-summary]');
  slot.getBoundingClientRect = () => rect(3 * CHAPTER_H - column.scrollTop, 400)();
}

function scrollTo(y) {
  handle.el.scrollTop = y;
  handle.el.dispatchEvent(new Event('scroll'));
}

beforeEach(() => {
  rafQueue = [];
  vi.stubGlobal('requestAnimationFrame', (cb) => rafQueue.push(cb));
  window.requestAnimationFrame = (cb) => rafQueue.push(cb);
  window.cancelAnimationFrame = () => {};
  delete window.ResizeObserver;
  parent = document.createElement('div');
  document.body.appendChild(parent);
});

afterEach(() => {
  handle && handle.destroy();
  parent.remove();
  vi.unstubAllGlobals();
});

function setup(extra = {}) {
  const calls = { change: [], progress: [], end: 0 };
  handle = mount(parent, {
    mission,
    onChapterChange: (i, k) => calls.change.push([i, k]),
    onProgress: (s) => calls.progress.push(s),
    onStoryEnd: () => calls.end++,
    ...extra
  });
  layout(handle.el);
  handle.refresh();
  flush();
  return calls;
}

describe('storyColumn scroll handling', () => {
  it('activates chapter 0 initially with its keyframe', () => {
    const calls = setup();
    expect(calls.change).toHaveLength(1);
    expect(calls.change[0][0]).toBe(0);
    expect(calls.change[0][1]).toEqual(kf(0));
  });

  it('uses the 40% trigger line to activate the next chapter', () => {
    const calls = setup();
    scrollTo(790); // 790 + 200 = 990 < 1000
    flush();
    expect(calls.change.map((c) => c[0])).toEqual([0]);
    scrollTo(800); // 1000 reaches chapter 1
    flush();
    expect(calls.change.map((c) => c[0])).toEqual([0, 1]);
  });

  it('interpolates the keyframe between the active and next chapter', () => {
    const calls = setup();
    scrollTo(300); // pos 500 => t = 0.5 in chapter 0
    flush();
    const last = calls.progress[calls.progress.length - 1];
    expect(last.chapterIndex).toBe(0);
    expect(last.t).toBeCloseTo(0.5);
    expect(last.keyframe.cameraOffset[0]).toBeCloseTo(5);
    expect(last.overall).toBeCloseTo(500 / 3000);
  });

  it('throttles many scroll events into one update per frame', () => {
    const calls = setup();
    const before = calls.progress.length;
    for (let y = 10; y < 100; y += 10) scrollTo(y);
    expect(rafQueue).toHaveLength(1);
    flush();
    expect(calls.progress.length).toBe(before + 1);
  });

  it('signals story end once past the last chapter and re-arms when scrolling back', () => {
    const calls = setup();
    scrollTo(2700); // pos 2900, still in last chapter
    flush();
    expect(calls.end).toBe(0);
    scrollTo(2800); // pos 3000 = end
    flush();
    expect(calls.end).toBe(1);
    const last = calls.progress[calls.progress.length - 1];
    expect(last.chapterIndex).toBe(2);
    expect(last.keyframe).toEqual(kf(20));
    scrollTo(2900);
    flush();
    expect(calls.end).toBe(1);
    scrollTo(1000);
    flush();
    scrollTo(2800);
    flush();
    expect(calls.end).toBe(2);
  });

  it('recomputes ranges via ResizeObserver', () => {
    let roCb;
    window.ResizeObserver = class {
      constructor(cb) { roCb = cb; }
      observe() {}
      disconnect() {}
    };
    setup();
    const before = handle.getState().ranges[1].start;
    handle.el.querySelectorAll('.story-chapter')[0].getBoundingClientRect = () => ({
      top: 0, height: 1500, bottom: 1500
    });
    handle.el.querySelectorAll('.story-chapter')[1].getBoundingClientRect = () => ({
      top: 1500, height: 1000, bottom: 2500
    });
    roCb();
    flush();
    expect(before).toBe(1000);
    expect(handle.getState().ranges[1].start).toBe(1500);
  });

  it('stops handling scroll after destroy', () => {
    const calls = setup();
    const n = calls.progress.length;
    const el = handle.el;
    handle.destroy();
    el.scrollTop = 900;
    el.dispatchEvent(new Event('scroll'));
    flush();
    expect(calls.progress.length).toBe(n);
    handle = null;
  });
});

import { describe, it, expect } from 'vitest';
import { shouldResize, rafDebounce, HEIGHT_JITTER_PX } from '../src/core/resizePolicy.js';
import { defaultAudioBase } from '../src/audio/audioEngine.js';

const S = (width, height, layout = 'split') => ({ width, height, layout });

describe('shouldResize', () => {
  it('resizes on first call', () => expect(shouldResize(null, S(390, 700))).toBe(true));
  it('ignores URL-bar height jitter', () => {
    expect(shouldResize(S(390, 700, 'stacked'), S(390, 760, 'stacked'))).toBe(false);
  });
  it('resizes on a large height change', () => {
    expect(shouldResize(S(390, 700), S(390, 700 + HEIGHT_JITTER_PX + 1))).toBe(true);
  });
  it('resizes on any width change or layout change', () => {
    expect(shouldResize(S(1280, 720), S(1279, 720))).toBe(true);
    expect(shouldResize(S(768, 720, 'split'), S(768, 720, 'stacked'))).toBe(true);
  });
});

describe('rafDebounce', () => {
  it('runs once per frame and can be cancelled', () => {
    const queue = [];
    let runs = 0;
    const d = rafDebounce(() => runs++, (cb) => queue.push(cb), () => queue.pop());
    d();
    d();
    d();
    expect(queue.length).toBe(1);
    queue.shift()();
    expect(runs).toBe(1);
    d();
    d.cancel();
    expect(queue.length).toBe(0);
  });
});

describe('defaultAudioBase', () => {
  it('follows the Vite base', () => {
    expect(defaultAudioBase('/')).toBe('/audio/');
    expect(defaultAudioBase('./')).toBe('./audio/');
    expect(defaultAudioBase('/site')).toBe('/site/audio/');
  });
});

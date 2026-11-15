import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '../src/ui/storyColumn.js';

const mission = {
  chapters: [
    {
      title: 'T',
      narrative: 'N',
      images: [{ src: 'x.webp', alt: 'Alt text', caption: 'Cap' }],
      callout: { text: 'c', citation: { label: 'L', url: 'https://www.nasa.gov/x' } }
    }
  ]
};

let observers;
class FakeIO {
  constructor(cb, opts) {
    this.cb = cb;
    this.opts = opts;
    this.targets = new Set();
    observers.push(this);
  }
  observe(t) { this.targets.add(t); }
  unobserve(t) { this.targets.delete(t); }
  disconnect() { this.targets.clear(); }
  fire(t) { this.cb([{ target: t, isIntersecting: true }]); }
}

describe('storyColumn reveal and image fallback', () => {
  beforeEach(() => {
    observers = [];
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete window.IntersectionObserver;
  });

  it('reveals everything when IntersectionObserver is missing', () => {
    const { el } = mount(document.body, { mission });
    expect(el.querySelectorAll('.is-visible').length).toBe(4);
  });

  it('observes with threshold 0.2 and adds is-visible on intersect', () => {
    window.IntersectionObserver = FakeIO;
    const { el } = mount(document.body, { mission });
    const io = observers[0];
    expect(io.opts.threshold).toBe(0.2);
    const title = el.querySelector('.story-chapter__title');
    expect(title.classList.contains('is-visible')).toBe(false);
    io.fire(title);
    expect(title.classList.contains('is-visible')).toBe(true);
  });

  it('shows images after their paragraph, within 400 ms', () => {
    vi.useFakeTimers();
    window.IntersectionObserver = FakeIO;
    const { el } = mount(document.body, { mission });
    const fig = el.querySelector('.story-figure');
    observers[0].fire(fig);
    expect(el.querySelector('.story-chapter__narrative').classList.contains('is-visible')).toBe(true);
    expect(fig.classList.contains('is-visible')).toBe(false);
    vi.advanceTimersByTime(400);
    expect(fig.classList.contains('is-visible')).toBe(true);
  });

  it('swaps a failed image for a bordered placeholder with alt text and caption', () => {
    const { el } = mount(document.body, { mission });
    el.querySelector('img').dispatchEvent(new Event('error'));
    expect(el.querySelector('img')).toBeNull();
    const ph = el.querySelector('.story-figure__placeholder');
    expect(ph.textContent).toBe('Alt text');
    expect(el.querySelector('.story-figure__caption').textContent).toBe('Cap');
  });

  it('disconnects the observer on destroy', () => {
    window.IntersectionObserver = FakeIO;
    const m = mount(document.body, { mission });
    m.destroy();
    expect(observers[0].targets.size).toBe(0);
  });
});

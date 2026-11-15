// Touch press feedback (Requirements 13.5, 13.6).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { installPressFeedback, PRESS_SCALE } from '../src/ui/pressFeedback.js';

const setHover = (noHover) => {
  window.matchMedia = vi.fn((q) => ({ matches: noHover && q === '(hover: none)', media: q }));
};
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

let detach;
afterEach(() => {
  detach?.();
  document.body.innerHTML = '';
});

function setup(noHover) {
  setHover(noHover);
  document.body.innerHTML = '<button class="btn-text">Go</button><button class="other">x</button>';
  const onPress = vi.fn();
  detach = installPressFeedback(document, { onPress });
  return { btn: document.querySelector('.btn-text'), other: document.querySelector('.other'), onPress };
}

describe('installPressFeedback', () => {
  it('scales and plays the sound on pointerdown when hover is unavailable', () => {
    const { btn, onPress } = setup(true);
    fire(btn, 'pointerdown');
    expect(btn.style.transform).toBe(`scale(${PRESS_SCALE})`);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['pointerup', 'pointercancel', 'pointerleave'])('removes the scale on %s', (type) => {
    const { btn } = setup(true);
    fire(btn, 'pointerdown');
    fire(btn, type);
    expect(btn.style.transform).toBe('');
  });

  it('does nothing on devices with hover', () => {
    const { btn, onPress } = setup(false);
    fire(btn, 'pointerdown');
    expect(btn.style.transform).toBe('');
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ignores elements outside the selector', () => {
    const { other, onPress } = setup(true);
    fire(other, 'pointerdown');
    expect(other.style.transform).toBe('');
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stops responding after detach', () => {
    const { btn, onPress } = setup(true);
    detach();
    fire(btn, 'pointerdown');
    expect(onPress).not.toHaveBeenCalled();
  });
});

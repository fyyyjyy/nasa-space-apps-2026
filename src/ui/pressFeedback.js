// Touch press feedback for text buttons (Requirements 13.5, 13.6).
// On devices without hover, the 120% scale and hover sound apply on pointerdown and end on
// pointerup, pointercancel and pointerleave. Delegated, so buttons mounted later are covered.
export const PRESS_SELECTOR = '.btn-text';
export const PRESS_SCALE = 1.2;

const noHover = (win) =>
  typeof win.matchMedia === 'function' && win.matchMedia('(hover: none)').matches;

/**
 * @param {Document} doc
 * @param {{ onPress?: () => void, selector?: string }} [opts]
 * @returns {() => void} detach function
 */
export function installPressFeedback(doc, { onPress, selector = PRESS_SELECTOR } = {}) {
  const win = doc.defaultView;
  const pressed = new Set();
  const release = (btn) => {
    if (!pressed.delete(btn)) return;
    btn.style.transform = '';
  };
  const target = (e) => (e.target instanceof Element ? e.target.closest(selector) : null);

  const onDown = (e) => {
    if (!win || !noHover(win)) return;
    const btn = target(e);
    if (!btn || pressed.has(btn)) return;
    pressed.add(btn);
    btn.style.transform = `scale(${PRESS_SCALE})`;
    if (typeof onPress === 'function') onPress();
  };
  const onEnd = (e) => {
    const btn = target(e);
    if (btn) release(btn);
  };
  const onLeave = (e) => {
    if (e.target instanceof Element && e.target.matches(selector)) release(e.target);
  };

  doc.addEventListener('pointerdown', onDown, true);
  doc.addEventListener('pointerup', onEnd, true);
  doc.addEventListener('pointercancel', onEnd, true);
  doc.addEventListener('pointerleave', onLeave, true);
  return () => {
    doc.removeEventListener('pointerdown', onDown, true);
    doc.removeEventListener('pointerup', onEnd, true);
    doc.removeEventListener('pointercancel', onEnd, true);
    doc.removeEventListener('pointerleave', onLeave, true);
    for (const b of pressed) b.style.transform = '';
    pressed.clear();
  };
}

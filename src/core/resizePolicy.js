// Pure helper for canvas resizing. Mobile browsers change innerHeight by a few dozen pixels
// as the URL bar shows or hides; resizing the WebGL buffer for that causes jitter and cost.

export const HEIGHT_JITTER_PX = 120;

/**
 * Decide whether the canvas must be resized.
 * Always true on the first call (prev null), when the width changes, or when the layout
 * (split or stacked at the 768px breakpoint) changes. A height-only change resizes only
 * when it exceeds `threshold`.
 * @param {{width:number,height:number,layout?:string}|null} prev size last applied
 * @param {{width:number,height:number,layout?:string}} next current size
 * @param {number} [threshold]
 */
export function shouldResize(prev, next, threshold = HEIGHT_JITTER_PX) {
  if (!prev) return true;
  if (prev.width !== next.width) return true;
  if (prev.layout !== next.layout) return true;
  return Math.abs(prev.height - next.height) > threshold;
}

/**
 * Coalesce calls into one `fn` run per animation frame.
 * @param {() => void} fn
 * @param {(cb: () => void) => any} [raf]
 * @param {(id: any) => void} [caf]
 */
export function rafDebounce(fn, raf = (cb) => requestAnimationFrame(cb), caf = (id) => cancelAnimationFrame(id)) {
  let id = null;
  const run = () => {
    id = null;
    fn();
  };
  const wrapped = () => {
    if (id !== null) return;
    id = raf(run);
  };
  wrapped.cancel = () => {
    if (id !== null) caf(id);
    id = null;
  };
  return wrapped;
}

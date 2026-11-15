// Model inspection controls: drag to rotate, wheel / pinch to zoom the Hardware_Model.
// Requirements 5.3, 5.4, 13.7. The manual rotation and zoom live in the hardware model manager
// as an offset on top of the chapter keyframe (see setInspectionOffset).
import { MODEL_ZOOM_MAX, MODEL_ZOOM_MIN, clampModelZoom } from './hardwareModelManager.js';

export const ROTATE_RADIANS_PER_PX = 0.008;
export const WHEEL_ZOOM_PER_UNIT = 0.0015;
const LINE_HEIGHT_PX = 16;
const PAGE_HEIGHT_PX = 400;

/** Pure. New yaw/pitch after a drag of (dx, dy) pixels. Drag right turns the model right, drag down tilts it toward the viewer. */
export function rotateByDrag(offset, dx, dy, radiansPerPx = ROTATE_RADIANS_PER_PX) {
  const x = Number.isFinite(dx) ? dx : 0;
  const y = Number.isFinite(dy) ? dy : 0;
  return { yaw: offset.yaw + x * radiansPerPx, pitch: offset.pitch + y * radiansPerPx };
}

/** Pure. Multiplier allowed for the zoom offset so chapterZoom * offset stays within [0.5, 5]. */
export function clampZoomOffset(offsetZoom, chapterZoom = 1) {
  const base = clampModelZoom(chapterZoom);
  const lo = MODEL_ZOOM_MIN / base;
  const hi = MODEL_ZOOM_MAX / base;
  const v = Number.isFinite(offsetZoom) ? offsetZoom : 1;
  return Math.min(hi, Math.max(lo, v));
}

/** Pure. Zoom offset after a wheel event (negative deltaY zooms in). */
export function zoomByWheel(offsetZoom, deltaY, deltaMode = 0, chapterZoom = 1) {
  const unit = deltaMode === 1 ? LINE_HEIGHT_PX : deltaMode === 2 ? PAGE_HEIGHT_PX : 1;
  const d = Number.isFinite(deltaY) ? deltaY * unit : 0;
  return clampZoomOffset(offsetZoom * Math.exp(-d * WHEEL_ZOOM_PER_UNIT), chapterZoom);
}

/** Pure. Zoom offset after a pinch that started at startDist with startZoom and is now at dist. */
export function zoomByPinch(startZoom, startDist, dist, chapterZoom = 1) {
  if (!(startDist > 0) || !Number.isFinite(dist) || dist < 0) return clampZoomOffset(startZoom, chapterZoom);
  return clampZoomOffset(startZoom * (dist / startDist), chapterZoom);
}

/**
 * Attaches inspection gestures to the 3D canvas. Events from outside `element` (for example the
 * story column) never reach this handler, so touches there keep scrolling the page (Req 13.7).
 * @param {object} deps
 * @param {HTMLElement} deps.element the canvas (or its 3D area container)
 * @param {object} deps.manager hardware model manager
 * @param {()=>boolean} [deps.isActive] return false to ignore input (no model shown)
 * @returns {{destroy:Function, reset:Function}}
 */
export function createModelInspector({ element, manager, isActive }) {
  const pointers = new Map(); // pointerId -> {x, y}
  let pinch = null; // {dist, zoom}

  const active = () => (isActive ? isActive() : !!manager.getRoot()) && !!manager.getRoot();
  const dist = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  element.style.touchAction = 'none';

  function onDown(e) {
    if (!active()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (pointers.size >= 2) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      element.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is best effort */
    }
    if (pointers.size === 2) {
      pinch = { dist: dist(), zoom: manager.getInspectionOffset().zoom };
    }
    e.preventDefault?.();
  }

  function onMove(e) {
    const prev = pointers.get(e.pointerId);
    if (!prev || !active()) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      const o = manager.getInspectionOffset();
      manager.setInspectionOffset(rotateByDrag(o, cur.x - prev.x, cur.y - prev.y));
    } else if (pinch) {
      manager.setInspectionOffset({ zoom: zoomByPinch(pinch.zoom, pinch.dist, dist(), manager.getZoom()) });
    }
    e.preventDefault?.();
  }

  function onUp(e) {
    if (!pointers.delete(e.pointerId)) return;
    try {
      element.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    // Back to one pointer: the remaining finger continues as a rotation from its current position.
    pinch = null;
  }

  function onWheel(e) {
    if (!active()) return;
    e.preventDefault();
    const o = manager.getInspectionOffset();
    manager.setInspectionOffset({ zoom: zoomByWheel(o.zoom, e.deltaY, e.deltaMode, manager.getZoom()) });
  }

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onUp);
  element.addEventListener('wheel', onWheel, { passive: false });

  return {
    reset() {
      pointers.clear();
      pinch = null;
      manager.setInspectionOffset({ yaw: 0, pitch: 0, zoom: 1 });
    },
    destroy() {
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      element.removeEventListener('wheel', onWheel);
      pointers.clear();
      pinch = null;
    },
  };
}

export default createModelInspector;

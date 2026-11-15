// Scene manager: renderer, scene, camera, lights and the capped render loop.
import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { createFrameLimiter } from './frameLimiter.js';
import { selectLayout } from '../core/layoutSelector.js';
import { shouldResize, rafDebounce } from '../core/resizePolicy.js';
import { QUALITY_LEVELS, createQualityTracker } from './qualityController.js';

const MAX_FPS = 60;
const MAX_PIXEL_RATIO = 2;

let renderer = null;
let scene = null;
let camera = null;
let canvasEl = null;
let rafId = 0;
const limiter = createFrameLimiter(MAX_FPS);
let running = false;
let contextLost = false;
let listenersAttached = false;
let splitEnabled = false;
let layoutMql = null;
const updateCallbacks = new Set();
let qualityTracker = createQualityTracker();
let qualityLevel = 0;
let starShareHandler = null;
let lastSize = null;

function getPixelRatio() {
  const levelRatio = QUALITY_LEVELS[qualityLevel].pixelRatio;
  return Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO, levelRatio);
}

/** Hook for the star share: `(share) => void`, e.g. `starfield.setStarShare`. Applied immediately. */
export function setStarShareHandler(fn) {
  starShareHandler = typeof fn === 'function' ? fn : null;
  starShareHandler?.(QUALITY_LEVELS[qualityLevel].starShare);
}

export function getQualityLevel() {
  return qualityLevel;
}

/** Apply a quality level: pixel ratio and star share. */
export function applyQualityLevel(level) {
  qualityLevel = Math.min(QUALITY_LEVELS.length - 1, Math.max(0, level));
  renderer?.setPixelRatio(getPixelRatio());
  const share = QUALITY_LEVELS[qualityLevel].starShare;
  if (starShareHandler) {
    starShareHandler(share);
  } else if (scene) {
    // Fallback: trim the draw range of the scene's starfield points directly.
    const geo = scene.getObjectByName('starfield')?.geometry;
    const total = geo?.getAttribute('position')?.count;
    if (geo && total) geo.setDrawRange(0, Math.round(total * share));
  }
}

function frame(nowMs) {
  rafId = 0;
  if (!running) return;
  schedule();
  if (document.hidden || contextLost) return;
  if (!limiter.shouldRender(nowMs)) return;
  for (const cb of updateCallbacks) cb(nowMs);
  renderer.render(scene, camera);
  const next = qualityTracker.frame(nowMs);
  if (next !== null) applyQualityLevel(next);
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(frame);
}

function onVisibilityChange() {
  // Reset pacing so the first visible frame renders immediately.
  qualityTracker.reset(); // hidden-tab gaps must not count as low fps
  if (!document.hidden) limiter.reset();
}

const contextListeners = new Set();

/** Subscribe to context loss and restoration: `cb(lost: boolean)`. Returns an unsubscribe function. */
export function onContextChange(cb) {
  contextListeners.add(cb);
  return () => contextListeners.delete(cb);
}

function notifyContext(lost) {
  for (const cb of contextListeners) {
    try {
      cb(lost);
    } catch (err) {
      console.error('Context listener failed', err);
    }
  }
}

function onContextLost(event) {
  event.preventDefault(); // allow restoration
  contextLost = true;
  notifyContext(true);
}

function onContextRestored() {
  contextLost = false;
  notifyContext(false);
  limiter.reset();
  qualityTracker.reset();
  onResize();
}

/**
 * Create the renderer, scene, camera and lights.
 * @param {HTMLCanvasElement} canvas
 * @returns {{scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer}}
 */
export function init(canvas) {
  if (renderer) dispose();
  canvasEl = canvas;
  qualityLevel = 0;
  qualityTracker = createQualityTracker();
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  lastSize = currentSize();

  scene = new Scene();
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 6);

  const ambient = new AmbientLight(0xffffff, 0.35);
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(5, 3, 5);
  scene.add(ambient, sun);

  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('resize', onResizeDebounced);
  listenersAttached = true;

  return { scene, camera, renderer };
}

/** Start the render loop (idempotent). */
export function start() {
  if (!renderer || running) return;
  running = true;
  limiter.reset();
  qualityTracker.reset();
  schedule();
}

/** Stop the render loop without disposing resources. */
export function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

/** Register a per-frame callback `(nowMs) => void`. Returns an unsubscribe function. */
export function addUpdateCallback(cb) {
  updateCallbacks.add(cb);
  return () => updateCallbacks.delete(cb);
}

export function removeUpdateCallback(cb) {
  updateCallbacks.delete(cb);
}

/** Add an object to the scene. */
export function addToScene(...objects) {
  if (scene) scene.add(...objects);
}

export function removeFromScene(...objects) {
  if (scene) scene.remove(...objects);
}

export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}

export function getRenderer() {
  return renderer;
}

function currentSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    layout: selectLayout(window.innerWidth),
  };
}

/** Resize now, unconditionally. */
export function onResize() {
  if (!renderer || !camera) return;
  lastSize = currentSize();
  const w = lastSize.width;
  const h = lastSize.height;
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  applyLayout();
}

/** Window resize: once per frame, and only for width/layout changes or large height changes. */
const onResizeDebounced = rafDebounce(() => {
  if (shouldResize(lastSize, currentSize())) onResize();
});

/**
 * View offset that centres the scene in the left half (split) or top 40% (stacked).
 * The full virtual image stays w x h; the sub-rect is shifted so its centre lands
 * on the centre of the target region.
 * @returns {{x:number,y:number,width:number,height:number}}
 */
export function computeViewOffset(layout, w, h) {
  if (layout === 'stacked') return { x: 0, y: Math.round(h * 0.3), width: w, height: h };
  return { x: Math.round(w / 4), y: 0, width: w, height: h };
}

/** Apply or clear the camera view offset for the current layout. */
export function applyViewOffset(cam, enabled, viewportWidth, w, h) {
  if (!cam) return;
  if (!enabled) {
    cam.clearViewOffset();
    return;
  }
  const o = computeViewOffset(selectLayout(viewportWidth), w, h);
  cam.setViewOffset(w, h, o.x, o.y, o.width, o.height);
}

function applyLayout() {
  applyViewOffset(camera, splitEnabled, window.innerWidth, window.innerWidth, window.innerHeight);
  camera?.updateProjectionMatrix();
}

function onLayoutChange() {
  applyLayout();
}

/**
 * Enable or disable the split layout. When enabled the 3D scene is framed in the
 * left half of the viewport (>= 768px) or the top 40% (stacked), and re-applied
 * when the breakpoint media query changes.
 */
export function setSplitLayout(enabled) {
  splitEnabled = Boolean(enabled);
  if (splitEnabled && !layoutMql && typeof window.matchMedia === 'function') {
    layoutMql = window.matchMedia('(max-width: 767.98px)');
    layoutMql.addEventListener?.('change', onLayoutChange);
  } else if (!splitEnabled && layoutMql) {
    layoutMql.removeEventListener?.('change', onLayoutChange);
    layoutMql = null;
  }
  applyLayout();
}

export function dispose() {
  stop();
  setSplitLayout(false);
  updateCallbacks.clear();
  if (listenersAttached) {
    canvasEl?.removeEventListener('webglcontextlost', onContextLost);
    canvasEl?.removeEventListener('webglcontextrestored', onContextRestored);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', onResizeDebounced);
    onResizeDebounced.cancel();
    listenersAttached = false;
  }
  if (scene) {
    scene.traverse((obj) => {
      obj.geometry?.dispose?.();
      const mats = obj.material ? [].concat(obj.material) : [];
      for (const m of mats) m.dispose?.();
    });
  }
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  canvasEl = null;
  contextLost = false;
  limiter.reset();
}

// Mission markers: glowing sprites parented to body meshes, plus DOM proxy buttons and tooltips.
// Requirements 3.1 to 3.6, 8.4, 13.5, 13.6.
import {
  AdditiveBlending,
  CanvasTexture,
  Raycaster,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
} from 'three';
import { latLonToVector3 } from '../core/geo.js';
import { getMesh, getRadius, setSpinPaused } from './celestialBodies.js';
import { STRINGS } from '../ui/strings.js';

export const MAX_MARKER_SCREEN_FRACTION = 0.02;
export const TOOLTIP_MAX_CHARS = 80;
const MIN_TARGET_PX = 44;
const BASE_WORLD_RADIUS = 0.012; // scene units, before the screen-size cap
const SURFACE_OFFSET = 1.01; // markers sit just above the surface
const MARKER_COLOR = 0xa8d8ea;

/**
 * Pure. On-screen radius in CSS px of a marker with the given world radius,
 * capped at 2% of the smaller viewport dimension.
 * @param {number} worldRadius marker radius in scene units
 * @param {number} distance camera-to-marker distance in scene units
 * @param {number} fovDeg vertical camera field of view in degrees
 * @param {number} viewportHeight CSS px
 * @param {number} viewportWidth CSS px
 */
export function markerScreenRadius(worldRadius, distance, fovDeg, viewportHeight, viewportWidth) {
  const cap = MAX_MARKER_SCREEN_FRACTION * Math.min(viewportWidth, viewportHeight);
  const halfFov = (fovDeg * Math.PI) / 360;
  const denom = Math.max(distance, 1e-6) * Math.tan(halfFov);
  const px = denom > 0 ? (worldRadius / denom) * (viewportHeight / 2) : cap;
  return Math.max(0, Math.min(px, cap));
}

/** Truncates tooltip text to at most `max` characters. */
export function clampTooltipText(text, max = TOOLTIP_MAX_CHARS) {
  const s = String(text ?? '');
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function makeGlowTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(168,216,234,0.7)');
  grad.addColorStop(1, 'rgba(168,216,234,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isHoverNone = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none)').matches;

// Module state
let markers = [];
let camera = null;
let canvasEl = null;
let layer = null;
let tooltipEl = null;
let onSelectCb = null;
let visibleBody = null;
let hoveredId = null;
let expandedId = null;
let glowTexture = null;
let listeners = [];
const raycaster = new Raycaster();
const tmpWorld = new Vector3();
const tmpNormal = new Vector3();
const tmpCam = new Vector3();

function buildMarker(mission) {
  const mesh = getMesh(mission.body);
  const radius = getRadius(mission.body);
  if (!mesh || radius == null) throw new Error(`Body "${mission.body}" is not available`);
  const { lat, lon } = mission.landing;
  const p = latLonToVector3(lat, lon, radius * SURFACE_OFFSET);
  if (![p.x, p.y, p.z].every(Number.isFinite)) throw new Error('Invalid landing coordinates');
  if (!glowTexture) glowTexture = makeGlowTexture();
  const material = new SpriteMaterial({
    map: glowTexture,
    color: MARKER_COLOR,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const sprite = new Sprite(material);
  sprite.position.set(p.x, p.y, p.z);
  sprite.userData.missionId = mission.id;
  sprite.visible = false;
  mesh.add(sprite);
  return { sprite, fallback: false, position: p };
}

function buildFallback(mission) {
  const mesh = getMesh(mission.body);
  const radius = getRadius(mission.body) ?? 1;
  if (!mesh) return null;
  const p = latLonToVector3(mission.landing?.lat ?? 0, mission.landing?.lon ?? 0, radius * SURFACE_OFFSET);
  const sprite = new Sprite(new SpriteMaterial({ color: MARKER_COLOR, depthWrite: false }));
  sprite.position.set(p.x, p.y, p.z);
  sprite.scale.setScalar(BASE_WORLD_RADIUS * 2);
  sprite.userData.missionId = mission.id;
  sprite.visible = false;
  mesh.add(sprite);
  return { sprite, fallback: true, position: p };
}

function makeProxy(mission) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'marker-proxy';
  btn.dataset.missionId = mission.id;
  btn.setAttribute('aria-label', STRINGS.markerLabel(mission.name, mission.locationName));
  Object.assign(btn.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${MIN_TARGET_PX}px`,
    height: `${MIN_TARGET_PX}px`,
    padding: '0',
    margin: '0',
    border: '0',
    background: 'transparent',
    opacity: '0.01', // visually hidden, still focusable and tappable
    minWidth: `${MIN_TARGET_PX}px`,
    minHeight: `${MIN_TARGET_PX}px`,
    cursor: 'pointer',
    display: 'none',
    zIndex: '20',
  });
  btn.addEventListener('mouseenter', () => setHover(mission.id));
  btn.addEventListener('mouseleave', () => setHover(null));
  btn.addEventListener('focus', () => {
    btn.style.opacity = '1';
    btn.style.outline = '2px solid #A8D8EA';
    btn.style.outlineOffset = '3px';
    btn.style.borderRadius = '50%';
    setHover(mission.id);
  });
  btn.addEventListener('blur', () => {
    btn.style.opacity = '0.01';
    btn.style.outline = '';
    setHover(null);
  });
  btn.addEventListener('click', (e) => {
    // Overlapping 44 px hit areas: for pointer clicks the marker whose centre is nearest wins (Req 13.6).
    let id = mission.id;
    if (e.detail > 0) {
      let best = Infinity;
      for (const m of markers) {
        if (m.proxy.style.display === 'none' || m.sx === undefined) continue;
        const d = Math.hypot(e.clientX - m.sx, e.clientY - m.sy);
        if (d < best) {
          best = d;
          id = m.id;
        }
      }
    }
    activate(id);
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && expandedId) collapse();
  });
  return btn;
}

function makeLabel(mission) {
  const el = document.createElement('span');
  el.className = 'marker-label';
  el.textContent = mission.name;
  el.setAttribute('aria-hidden', 'true'); // proxy button already carries the name
  Object.assign(el.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    display: 'none',
    pointerEvents: 'none',
    color: '#FFFFFF',
    fontFamily: 'var(--font-heading, sans-serif)',
    fontSize: '14px',
    textShadow: '0 0 4px #0A0A0F, 0 0 8px #0A0A0F',
    whiteSpace: 'nowrap',
    zIndex: '19',
  });
  return el;
}

function ensureTooltip() {
  const el = document.createElement('div');
  el.className = 'marker-tooltip';
  el.setAttribute('role', 'tooltip');
  el.id = 'marker-tooltip';
  Object.assign(el.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    display: 'none',
    maxWidth: '280px',
    padding: '8px 12px',
    background: 'rgba(10, 10, 15, 0.92)',
    color: '#FFFFFF',
    border: '1px solid #A8D8EA',
    fontFamily: 'var(--font-body, serif)',
    fontSize: '0.875rem',
    lineHeight: '1.4',
    pointerEvents: 'none',
    zIndex: '30',
  });
  return el;
}

function find(id) {
  return markers.find((m) => m.id === id) ?? null;
}

function renderTooltip() {
  if (!tooltipEl) return;
  const id = expandedId ?? hoveredId;
  const m = id ? find(id) : null;
  if (!m || !isActive(m)) {
    tooltipEl.style.display = 'none';
    return;
  }
  tooltipEl.replaceChildren();
  const title = document.createElement('div');
  title.textContent = clampTooltipText(m.mission.tooltip);
  tooltipEl.appendChild(title);
  if (expandedId === id) {
    const year = document.createElement('div');
    year.textContent = String(m.mission.year);
    const desc = document.createElement('div');
    desc.textContent = m.mission.description;
    tooltipEl.append(year, desc);
  }
  tooltipEl.style.display = 'block';
}

function collapse() {
  expandedId = null;
  renderTooltip();
}

function activate(id) {
  expandedId = id;
  renderTooltip();
  if (typeof onSelectCb === 'function') onSelectCb(id);
}

function isActive(m) {
  return visibleBody != null && m.mission.body === visibleBody;
}

/**
 * Creates three markers per body, parented to the body meshes.
 * A marker that fails to build is replaced by a static fallback sprite.
 * @param {object[]} missions entries from missions.json
 * @param {{camera: import('three').PerspectiveCamera, canvas?: HTMLElement, container?: HTMLElement,
 *          onSelect?: (missionId: string) => void}} opts
 * @returns {object[]} marker records
 */
export function createMarkers(missions, opts = {}) {
  disposeMarkers();
  camera = opts.camera ?? null;
  canvasEl = opts.canvas ?? null;
  onSelectCb = opts.onSelect ?? null;
  const parent = opts.container ?? document.body;

  layer = document.createElement('div');
  layer.className = 'marker-layer';
  tooltipEl = ensureTooltip();
  layer.appendChild(tooltipEl);
  const showLabels = isHoverNone();

  for (const mission of missions) {
    let built = null;
    try {
      built = buildMarker(mission);
    } catch (err) {
      console.error(`Failed to create marker for "${mission?.id}"`, err);
      try {
        built = buildFallback(mission);
      } catch (err2) {
        console.error(`Failed to create fallback marker for "${mission?.id}"`, err2);
      }
    }
    if (!built) continue;
    const proxy = makeProxy(mission);
    const label = showLabels ? makeLabel(mission) : null;
    layer.appendChild(proxy);
    if (label) layer.appendChild(label);
    markers.push({ id: mission.id, mission, ...built, proxy, label, screenRadius: 0 });
  }
  parent.appendChild(layer);

  if (canvasEl) {
    const rect = () => canvasEl.getBoundingClientRect();
    const toNdc = (e) => {
      const r = rect();
      return new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onMove = (e) => setHover(raycastPick(toNdc(e)));
    const onClick = (e) => {
      const id = raycastPick(toNdc(e));
      if (id) activate(id);
    };
    canvasEl.addEventListener('pointermove', onMove);
    canvasEl.addEventListener('click', onClick);
    listeners.push(['pointermove', onMove], ['click', onClick]);
  }
  return markers;
}

/** Shows markers and proxies for one body only (ORBIT screen), or hides all with null. */
export function setVisibleBody(bodyId) {
  if (visibleBody && visibleBody !== bodyId) setSpinPaused(visibleBody, false);
  visibleBody = bodyId ?? null;
  hoveredId = null;
  expandedId = null;
  if (visibleBody) faceMarkersToCamera(visibleBody);
  for (const m of markers) m.sprite.visible = isActive(m);
  renderTooltip();
}

/**
 * Pauses the body's idle spin and turns it so the mean marker direction faces the camera,
 * so the markers are on the visible hemisphere on entering ORBIT.
 */
function faceMarkersToCamera(bodyId) {
  const mesh = getMesh(bodyId);
  if (!mesh || !camera) return;
  setSpinPaused(bodyId, true);
  let sx = 0;
  let sz = 0;
  for (const m of markers) {
    if (m.mission.body !== bodyId) continue;
    sx += m.position.x;
    sz += m.position.z;
  }
  if (Math.hypot(sx, sz) < 1e-9) return;
  camera.getWorldPosition(tmpCam);
  mesh.getWorldPosition(tmpWorld);
  const tx = tmpCam.x - tmpWorld.x;
  const tz = tmpCam.z - tmpWorld.z;
  mesh.rotation.y = Math.atan2(-tz, tx) - Math.atan2(-sz, sx);
  mesh.updateMatrixWorld(true);
}

/** Sets the hovered marker (or null). Hover and focus show the short tooltip. */
export function setHover(markerId) {
  const id = markerId && find(markerId) ? markerId : null;
  if (id === hoveredId) return;
  hoveredId = id;
  if (canvasEl) canvasEl.style.cursor = id ? 'pointer' : '';
  renderTooltip();
}

/** Returns the id of the nearest visible marker under the pointer, or null. */
export function raycastPick(pointerNdc) {
  if (!camera || !pointerNdc) return null;
  raycaster.setFromCamera(pointerNdc, camera);
  const candidates = markers.filter((m) => isActive(m) && m.facing !== false).map((m) => m.sprite);
  if (!candidates.length) return null;
  const hits = raycaster.intersectObjects(candidates, false);
  return hits.length ? hits[0].object.userData.missionId : null;
}

/** Moves keyboard focus to a marker's proxy button. */
export function focusMarker(markerId) {
  const m = find(markerId);
  if (m && isActive(m)) m.proxy.focus();
}

/** Per-frame update: pulse, size cap, proxy and label positions. */
export function update(nowMs = performance.now()) {
  if (!camera || !markers.length) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pulse = prefersReducedMotion() ? 1 : 1 + 0.2 * Math.sin(nowMs / 400);
  camera.getWorldPosition(tmpCam);

  for (const m of markers) {
    const active = isActive(m);
    m.sprite.visible = active;
    if (!active) {
      m.proxy.style.display = 'none';
      if (m.label) m.label.style.display = 'none';
      continue;
    }
    m.sprite.getWorldPosition(tmpWorld);
    const parent = m.sprite.parent;
    // Facing test: marker normal (from body centre) against direction to camera.
    parent.getWorldPosition(tmpNormal);
    tmpNormal.subVectors(tmpWorld, tmpNormal).normalize();
    const toCam = tmpCam.clone().sub(tmpWorld).normalize();
    m.facing = tmpNormal.dot(toCam) > 0;

    const dist = tmpWorld.distanceTo(tmpCam);
    const px = markerScreenRadius(BASE_WORLD_RADIUS, dist, camera.fov, vh, vw) * pulse;
    const cap = MAX_MARKER_SCREEN_FRACTION * Math.min(vw, vh);
    const pxCapped = Math.min(px, cap);
    const worldRadius = (pxCapped / (vh / 2)) * dist * Math.tan((camera.fov * Math.PI) / 360);
    const parentScale = parent.scale?.x || 1;
    m.sprite.scale.setScalar((worldRadius * 2) / parentScale);
    m.sprite.material.opacity = m.facing ? 1 : 0;
    m.screenRadius = pxCapped;

    const ndc = tmpWorld.clone().project(camera);
    const sx = (ndc.x * 0.5 + 0.5) * vw;
    const sy = (-ndc.y * 0.5 + 0.5) * vh;
    const onScreen = m.facing && ndc.z < 1 && Math.abs(ndc.x) <= 1.05 && Math.abs(ndc.y) <= 1.05;
    m.sx = sx;
    m.sy = sy;
    m.proxy.style.display = onScreen ? 'block' : 'none';
    m.proxy.style.transform = `translate(${Math.round(sx - MIN_TARGET_PX / 2)}px, ${Math.round(sy - MIN_TARGET_PX / 2)}px)`;
    if (m.label) {
      m.label.style.display = onScreen ? 'block' : 'none';
      const lw = m.label.offsetWidth || 120;
      const gap = pxCapped + 6;
      // Flip to the left of the marker when the label would run past the right edge.
      const lx = sx + gap + lw > vw - 4 ? sx - gap - lw : sx + gap;
      m.label.style.transform = `translate(${Math.round(Math.max(4, lx))}px, ${Math.round(sy - 10)}px)`;
    }
  }

  const id = expandedId ?? hoveredId;
  const t = id ? find(id) : null;
  if (t && tooltipEl && tooltipEl.style.display !== 'none' && t.sx != null) {
    const w = tooltipEl.offsetWidth || 200;
    const x = Math.min(Math.max(8, t.sx + 16), Math.max(8, vw - w - 8));
    const y = Math.min(Math.max(8, t.sy + 16), Math.max(8, vh - 80));
    tooltipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
}

/** Removes markers, DOM and listeners. */
export function disposeMarkers() {
  for (const m of markers) {
    m.sprite.parent?.remove(m.sprite);
    m.sprite.material?.dispose();
  }
  markers = [];
  if (canvasEl) for (const [type, fn] of listeners) canvasEl.removeEventListener(type, fn);
  listeners = [];
  layer?.remove();
  layer = null;
  tooltipEl = null;
  hoveredId = null;
  expandedId = null;
  visibleBody = null;
}

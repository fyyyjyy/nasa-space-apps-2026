// Hardware model manager: loads, places, frames, animates and disposes a mission's 3D model.
// Requirements 4.2, 4.6, 5.1, 5.2, 5.5, 5.6, 5.7.
import {
  AmbientLight,
  Box3,
  BoxGeometry,
  CanvasTexture,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { latLonToVector3 } from '../core/geo.js';
import { siteBasis } from '../core/storyPose.js';
import { STRINGS } from '../ui/strings.js';
import { showToast } from '../ui/toast.js';

export const MODEL_ZOOM_MIN = 0.5;
export const MODEL_ZOOM_MAX = 5;
export const LOAD_TIMEOUT_MS = 10000;
export const MAX_KEYFRAME_MS = 800;
export const MIN_AMBIENT_INTENSITY = 0.25;
export const FIT_MARGIN = 0.9;
export const NARROW_HEIGHT_FRACTION = 0.4;

/** Pure. Clamps a model zoom multiplier to [0.5, 5]. Non-finite input gives 1. */
export function clampModelZoom(z) {
  if (typeof z !== 'number' || Number.isNaN(z)) return 1;
  return Math.min(MODEL_ZOOM_MAX, Math.max(MODEL_ZOOM_MIN, z));
}

/**
 * Pure. Uniform scale so that the bounding sphere of a box (diagonal, so any rotation fits)
 * fits in the model region at the given camera distance.
 * Wide layout: left half of the viewport. Narrow layout: top 40%.
 * @param {{x:number,y:number,z:number}} size bounding box size at scale 1
 * @param {number} fovDeg vertical field of view
 * @param {number} aspect width / height
 * @param {number} distance camera distance to the model centre
 * @param {'wide'|'narrow'} [layout]
 */
export function computeFitScale(size, fovDeg, aspect, distance, layout = 'wide') {
  const diag = Math.hypot(size.x, size.y, size.z);
  if (!(diag > 0) || !(distance > 0) || !(aspect > 0)) return 1;
  const viewH = 2 * distance * Math.tan((fovDeg * Math.PI) / 360);
  const viewW = viewH * aspect;
  const regionW = layout === 'narrow' ? viewW : viewW / 2;
  const regionH = layout === 'narrow' ? viewH * NARROW_HEIGHT_FRACTION : viewH;
  return (FIT_MARGIN * Math.min(regionW, regionH)) / diag;
}

/** Pure. Picks the loader kind from a file path. */
export function loaderKindForPath(path) {
  const ext = String(path ?? '').split(/[?#]/)[0].split('.').pop().toLowerCase();
  if (ext === 'glb' || ext === 'gltf') return 'gltf';
  if (ext === 'obj') return 'obj';
  return null;
}

/**
 * Pure. Anchor pose on a body surface from a mission's landing coordinates.
 * @returns {{position:{x:number,y:number,z:number}, normal:{x:number,y:number,z:number}}}
 */
export function anchorPoseFor(landing, bodyRadius, groundOffset = 0) {
  const n = latLonToVector3(landing.lat, landing.lon, 1);
  const p = latLonToVector3(landing.lat, landing.lon, bodyRadius + groundOffset);
  return { position: p, normal: n };
}

function disposeObject(root) {
  root.traverse((o) => {
    o.geometry?.dispose?.();
    for (const m of o.material ? [].concat(o.material) : []) {
      for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
      m.dispose?.();
    }
  });
}

function makeLabelSprite(text) {
  let map = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 96;
    const g = c.getContext?.('2d');
    if (g) {
      g.fillStyle = '#ffffff';
      g.font = '32px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, c.width / 2, c.height / 2, c.width - 16);
      map = new CanvasTexture(c);
    }
  }
  const sprite = new Sprite(new SpriteMaterial({ map, transparent: true }));
  sprite.scale.set(1.6, 0.3, 1);
  sprite.position.set(0, 0.8, 0);
  sprite.name = 'model-label';
  sprite.userData.label = text;
  return sprite;
}

/** Wireframe box plus label, used when the real model cannot be loaded. */
export function createPlaceholder(missionName) {
  const g = new Group();
  const box = new BoxGeometry(1, 1, 1);
  const edges = new EdgesGeometry(box);
  box.dispose();
  g.add(new LineSegments(edges, new LineBasicMaterial({ color: 0xa8d8ea })));
  g.add(makeLabelSprite(STRINGS.modelUnavailable(missionName)));
  g.userData.placeholder = true;
  return g;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Model load timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const defaultLoadGltf = (url) =>
  new Promise((res, rej) => new GLTFLoader().load(url, (g) => res(g.scene), undefined, rej));
const defaultLoadObj = (url) =>
  new Promise((res, rej) => new OBJLoader().load(url, res, undefined, rej));

/**
 * @param {object} deps
 * @param {{add:Function, remove:Function}} deps.scene
 * @param {object} deps.camera PerspectiveCamera
 * @param {(id:string)=>object|undefined} deps.getMission mission lookup, uses mission.model.{path,scale,groundOffset}
 * @param {Function} [deps.loadGltf] (url) => Promise<Object3D>
 * @param {Function} [deps.loadObj]  (url) => Promise<Object3D>
 * @param {(msg:string)=>void} [deps.notify] failure notification, defaults to a toast
 * @param {number} [deps.timeoutMs]
 */
export function createHardwareModelManager({
  scene,
  camera,
  getMission,
  loadGltf = defaultLoadGltf,
  loadObj = defaultLoadObj,
  notify = (msg) => showToast(msg),
  timeoutMs = LOAD_TIMEOUT_MS,
}) {
  let frame = null; // site frame in the scene: at the anchor, y = surface normal, x = east, z = south
  let root = null; // keyframe-rotated and scaled group, child of the site frame
  let content = null; // loaded model or placeholder
  let currentId = null;
  let loadToken = 0;
  let fitScale = 1;
  let zoom = 1;
  let layout = 'wide';
  let tween = null;
  let offset = { yaw: 0, pitch: 0, zoom: 1 }; // manual inspection offset on top of the keyframe
  const cache = new Map(); // missionId -> Object3D (last load result, not yet shown)

  const ambient = new AmbientLight(0xffffff, 0.5);
  const sun = new DirectionalLight(0xffffff, 2);
  const fill = new DirectionalLight(0x8899bb, 0.6);
  sun.position.set(3, 2, 3);
  fill.position.set(-3, -1, -2);
  const lights = [ambient, sun, fill];

  function applyScale() {
    if (root) root.scale.setScalar(fitScale * clampModelZoom(zoom * offset.zoom));
  }

  function applyOffsetRotation() {
    if (content) content.rotation.set(offset.pitch, offset.yaw, 0);
  }

  /** Manual inspection offset (rotation of the content, zoom multiplier) on top of the chapter keyframe. */
  function setInspectionOffset(next) {
    const n = next ?? {};
    const f = (v, d) => (Number.isFinite(v) ? v : d);
    offset = { yaw: f(n.yaw, offset.yaw), pitch: f(n.pitch, offset.pitch), zoom: f(n.zoom, offset.zoom) };
    applyOffsetRotation();
    applyScale();
  }

  function applyLight(azimuthDeg, intensity) {
    const a = MathUtils.degToRad(azimuthDeg);
    sun.position.set(3 * Math.sin(a), 2, 3 * Math.cos(a));
    if (Number.isFinite(intensity)) sun.intensity = Math.max(0, intensity);
    ambient.intensity = Math.max(MIN_AMBIENT_INTENSITY, ambient.intensity);
  }

  async function load(missionId) {
    const mission = getMission(missionId);
    const name = mission?.name ?? String(missionId);
    const path = mission?.model?.path;
    const kind = loaderKindForPath(path);
    let obj;
    try {
      if (!kind) throw new Error('No loadable model path');
      const p = kind === 'gltf' ? loadGltf(path) : loadObj(path);
      obj = await withTimeout(Promise.resolve(p), timeoutMs);
      if (!obj) throw new Error('Empty model');
    } catch (err) {
      obj = createPlaceholder(name);
      try {
        notify(STRINGS.toast.modelLoadFailed);
      } catch {
        /* notification must never break the fly-in */
      }
    }
    cache.set(missionId, obj);
    return obj;
  }

  function fitToView(object, cam = camera, opts = {}) {
    if (opts.layout) layout = opts.layout;
    const prev = object.scale.clone();
    object.scale.setScalar(1);
    object.updateMatrixWorld(true);
    const size = new Box3().setFromObject(object).getSize(new Vector3());
    object.scale.copy(prev);
    const wp = new Vector3();
    (root ?? object).getWorldPosition(wp);
    fitScale = computeFitScale(size, cam.fov, cam.aspect, cam.position.distanceTo(wp), layout);
    applyScale();
    return fitScale;
  }

  /** Adds the loaded model (from `load`) to the scene at the anchor pose. */
  function show(missionId, anchorPose, opts = {}) {
    const obj = cache.get(missionId);
    cache.delete(missionId);
    unload();
    if (!obj) return;
    const mission = getMission(missionId);
    const ground = mission?.model?.groundOffset ?? 0;
    currentId = missionId;
    content = obj;
    root = new Group();
    root.name = `hardware-model-${missionId}`;
    root.add(content);
    const pos = anchorPose?.position ?? { x: 0, y: 0, z: 0 };
    const n = anchorPose?.normal ?? { x: 0, y: 1, z: 0 };
    // Keyframe rotations are expressed in the site frame, so +Y is up at the landing site.
    frame = new Group();
    frame.name = `hardware-site-frame-${missionId}`;
    frame.position.set(pos.x, pos.y, pos.z);
    if (anchorPose?.normal) {
      const b = siteBasis([n.x, n.y, n.z]);
      frame.quaternion.setFromRotationMatrix(
        new Matrix4().makeBasis(new Vector3(...b.x), new Vector3(...b.y), new Vector3(...b.z)),
      );
    }
    root.position.set(0, ground, 0);
    frame.add(root);
    scene.add(frame, ...lights);
    applyOffsetRotation();
    fitToView(root, camera, opts);
  }

  /** Moves the model and lights toward a chapter keyframe over at most 800 ms. */
  function applyKeyframe(keyframe, durationMs = MAX_KEYFRAME_MS, nowMs = 0) {
    if (!root || !keyframe) return;
    const d = Math.min(MAX_KEYFRAME_MS, Math.max(0, Number.isFinite(durationMs) ? durationMs : 0));
    const to = {
      rot: keyframe.modelRotation ?? [0, 0, 0],
      zoom: clampModelZoom(keyframe.modelZoom ?? 1),
      az: keyframe.lightAzimuthDeg ?? 0,
      li: keyframe.lightIntensity,
    };
    if (d === 0) {
      tween = null;
      commit(to);
      return;
    }
    tween = {
      start: nowMs,
      d,
      to,
      from: {
        rot: [root.rotation.x, root.rotation.y, root.rotation.z],
        zoom,
        az: tween ? tween.to.az : to.az,
        li: sun.intensity,
      },
    };
  }

  function commit(s) {
    root.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
    zoom = s.zoom;
    applyScale();
    applyLight(s.az, s.li);
  }

  /** Per-frame tick. Call with a monotonic ms timestamp. */
  function update(nowMs) {
    if (!tween || !root) return;
    if (tween.start === 0 && nowMs > 0) tween.start = nowMs;
    const t = Math.min(1, (nowMs - tween.start) / tween.d);
    const { from, to } = tween;
    const l = (a, b) => a + (b - a) * t;
    commit({
      rot: to.rot.map((v, i) => l(from.rot[i], v)),
      zoom: l(from.zoom, to.zoom),
      az: l(from.az, to.az),
      li: Number.isFinite(to.li) ? l(from.li, to.li) : undefined,
    });
    if (t >= 1) tween = null;
  }

  /** Removes the model and lights from the scene and disposes geometry, materials and textures. */
  function unload() {
    loadToken += 1;
    tween = null;
    if (frame) scene.remove(frame);
    if (root) {
      disposeObject(root);
      root.clear();
    }
    frame = null;
    scene.remove(...lights);
    for (const obj of cache.values()) disposeObject(obj);
    cache.clear();
    root = null;
    content = null;
    currentId = null;
    zoom = 1;
    offset = { yaw: 0, pitch: 0, zoom: 1 };
    fitScale = 1;
  }

  return {
    load,
    show,
    fitToView,
    applyKeyframe,
    update,
    unload,
    clampModelZoom,
    setInspectionOffset,
    getInspectionOffset: () => ({ ...offset }),
    getZoom: () => zoom,
    getRoot: () => root,
    getCurrentMissionId: () => currentId,
    getContent: () => content,
    lights,
  };
}

export default createHardwareModelManager;

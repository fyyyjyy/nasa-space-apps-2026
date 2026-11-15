import * as THREE from 'three';

export const BODY_DURATION = { min: 2000, max: 4000, def: 3000 };
export const SITE_DURATION = { min: 2000, max: 5000, def: 3500 };
export const MIN_ZOOM_FACTOR = 1.15;

/** Ease-in-out cubic. Input is clamped to [0, 1]. */
export function easeInOutCubic(t) {
  if (!(t > 0)) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Clamp a camera distance into [minDistance, maxDistance]. */
export function clampZoom(distance, minDistance, maxDistance) {
  const hi = Math.max(minDistance, maxDistance);
  return Math.min(hi, Math.max(minDistance, distance));
}

function clampDuration(ms, range) {
  const v = Number.isFinite(ms) ? ms : range.def;
  return Math.min(range.max, Math.max(range.min, v));
}

/**
 * Camera rig. The camera orbits `target` at `distance`.
 * Call `update(nowMs)` every frame.
 *
 * @param {THREE.Camera} camera
 * @param {{ now?: () => number, minDistance?: number, maxDistance?: number }} [opts]
 */
export function createCameraRig(camera, opts = {}) {
  const now = opts.now || (() => performance.now());
  let minDistance = opts.minDistance ?? 1;
  let maxDistance = opts.maxDistance ?? 100;

  const target = new THREE.Vector3();
  const offset = camera.position.clone(); // camera position relative to target
  let inputEnabled = true;
  let fly = null; // { from, to, start, duration, resolve }

  function apply() {
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
  }

  function isFlying() {
    return fly !== null;
  }

  function setLimits(bodyRadius, far) {
    minDistance = bodyRadius * MIN_ZOOM_FACTOR;
    maxDistance = far ?? maxDistance;
    const d = clampZoom(offset.length(), minDistance, maxDistance);
    if (offset.lengthSq() > 0) offset.setLength(d);
    apply();
  }

  function setInputEnabled(enabled) {
    inputEnabled = !!enabled;
  }

  function orbitBy(dx, dy) {
    if (!inputEnabled || fly) return;
    const s = new THREE.Spherical().setFromVector3(offset);
    s.theta -= dx;
    s.phi = Math.min(Math.PI - 0.01, Math.max(0.01, s.phi - dy));
    offset.setFromSpherical(s);
    apply();
  }

  function zoomBy(delta) {
    if (!inputEnabled || fly) return;
    const d = clampZoom(offset.length() * (1 + delta), minDistance, maxDistance);
    if (offset.lengthSq() > 0) offset.setLength(d);
    apply();
  }

  /** Current pose, relative to target. */
  function getPose() {
    return { target: target.clone(), offset: offset.clone() };
  }

  /** Jump to an absolute world pose (cancels any fly). Used by the story camera. */
  function setPose(pose) {
    cancelFly();
    target.copy(pose.target);
    offset.copy(pose.position).sub(target);
    apply();
  }

  /** Stop the current fly at the current interpolated pose. */
  function cancelFly() {
    if (!fly) return;
    const { resolve } = fly;
    fly = null;
    resolve();
  }

  /**
   * @param {{ target: THREE.Vector3, position: THREE.Vector3 }} pose absolute world pose
   * @param {{ durationMs?: number, kind?: 'body'|'site', ease?: (t:number)=>number }} [o]
   */
  function flyTo(pose, o = {}) {
    cancelFly(); // restart from the current interpolated pose
    const range = o.kind === 'site' ? SITE_DURATION : BODY_DURATION;
    const duration = clampDuration(o.durationMs, range);
    const toTarget = pose.target.clone();
    const toOffset = pose.position.clone().sub(toTarget);
    return new Promise((resolve) => {
      fly = {
        fromTarget: target.clone(),
        fromOffset: offset.clone(),
        toTarget,
        toOffset,
        start: now(),
        duration,
        ease: o.ease || easeInOutCubic,
        resolve,
      };
    });
  }

  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const qt = new THREE.Quaternion();
  const dirA = new THREE.Vector3();
  const dirB = new THREE.Vector3();

  function update(nowMs = now()) {
    if (!fly) return;
    const f = fly;
    const raw = Math.min(1, Math.max(0, (nowMs - f.start) / f.duration));
    const k = f.ease(raw);
    target.lerpVectors(f.fromTarget, f.toTarget, k);
    // Arc the camera around the target: slerp direction, lerp distance.
    const la = f.fromOffset.length();
    const lb = f.toOffset.length();
    if (la > 0 && lb > 0) {
      dirA.copy(f.fromOffset).divideScalar(la);
      dirB.copy(f.toOffset).divideScalar(lb);
      qa.identity();
      qb.setFromUnitVectors(dirA, dirB);
      qt.slerpQuaternions(qa, qb, k);
      offset.copy(dirA).applyQuaternion(qt).multiplyScalar(la + (lb - la) * k);
    } else {
      offset.lerpVectors(f.fromOffset, f.toOffset, k);
    }
    apply();
    if (raw >= 1) {
      fly = null;
      f.resolve();
    }
  }

  apply();
  return {
    flyTo,
    cancelFly,
    setInputEnabled,
    orbitBy,
    zoomBy,
    update,
    isFlying,
    setLimits,
    getPose,
    setPose,
  };
}

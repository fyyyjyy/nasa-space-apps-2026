// Audio engine (Web Audio). Requirements 11.1, 11.2, 11.4, 11.5, 11.7, 11.8, 11.10, 11.12.
//
// - The AudioContext is created lazily, inside unlockOnGesture(), and starts suspended.
// - Nothing plays before the first gesture and no error is shown.
// - Transitions requested while muted or locked only update the logical current track.
// - Fetch and decode errors are logged and skipped; the previous track simply fades out.
//
// The track table is passed to init(config): { tracks: [...], effects: [...], crossfadeMs }.

export const AMBIENT_ID = 'space-ambient';
export const DEFAULT_CROSSFADE_MS = 2000;

const AMBIENT_SCREENS = new Set(['OPENING', 'ORBIT', 'CLOSING', 'QUIZ']);
const MISSION_SCREENS = new Set(['STORY', 'SUMMARY']);

function findMission(config, missionId) {
  const list = config && config.missions;
  if (Array.isArray(list)) return list.find((m) => m && m.id === missionId) || null;
  if (list && typeof list === 'object') return list[missionId] || null;
  return null;
}

/**
 * Pure track resolution (Property 30).
 * @param state  app state ({ screen, missionId }) or a bare screen name
 * @param chapterIndex active chapter index (used for the final chapter variation)
 * @param config { ambientId?, missions: [{ id, audio: { trackId, variationTrackId? }, chapters? , chapterCount? }] }
 *               (missions may also be an object keyed by id)
 * @returns track id, or the ambient id when the mission is unknown
 */
export function resolveTrack(state, chapterIndex, config) {
  const ambient = (config && config.ambientId) || AMBIENT_ID;
  const screen = typeof state === 'string' ? state : state && state.screen;
  const missionId = state && typeof state === 'object' ? state.missionId : null;
  if (!MISSION_SCREENS.has(screen) && !AMBIENT_SCREENS.has(screen)) return ambient;
  if (AMBIENT_SCREENS.has(screen)) return ambient;

  const mission = findMission(config, missionId);
  const a = mission && mission.audio;
  if (!a || typeof a.trackId !== 'string') return ambient;

  if (typeof a.variationTrackId === 'string') {
    const count = Array.isArray(mission.chapters) ? mission.chapters.length : mission.chapterCount;
    if (Number.isInteger(count) && count > 0 && chapterIndex === count - 1) return a.variationTrackId;
  }
  return a.trackId;
}

function defaultContextFactory() {
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/**
 * @param {object} [opts]
 * @param {() => object|null} [opts.createContext] factory (for tests)
 * @param {(url:string)=>Promise<{ok?:boolean,arrayBuffer:()=>Promise<ArrayBuffer>}>} [opts.fetchFn]
 * @param {string} [opts.baseUrl] prefix for relative track files
 * @param {(...a:any[])=>void} [opts.log]
 */
/** Audio folder URL that follows Vite's `base` (relative './' in production builds). */
export function defaultAudioBase(base = import.meta.env?.BASE_URL ?? '/') {
  return `${base.endsWith('/') ? base : `${base}/`}audio/`;
}

export function createAudioEngine(opts = {}) {
  const createContext = opts.createContext || defaultContextFactory;
  const fetchFn = opts.fetchFn || ((...a) => globalThis.fetch(...a));
  const baseUrl = opts.baseUrl ?? defaultAudioBase();
  const log = opts.log || ((...a) => console.warn('[audio]', ...a));

  let config = { tracks: [], effects: [], crossfadeMs: DEFAULT_CROSSFADE_MS };
  let ctx = null;
  let master = null;
  let unlocked = false;
  let unsupported = false;
  let muted = false;
  let current = null; // logical current track id
  let active = null; // { id, source, gain } currently sounding (or silent while muted)
  let token = 0;
  const stack = [];
  const buffers = new Map(); // id -> Promise<AudioBuffer|null>

  const entry = (id) =>
    (config.tracks || []).find((t) => t.id === id) || (config.effects || []).find((t) => t.id === id) || null;
  const urlFor = (file) => (/^(\/|https?:)/.test(file) ? file : baseUrl + file);

  function init(audioConfig) {
    config = {
      tracks: [],
      effects: [],
      crossfadeMs: DEFAULT_CROSSFADE_MS,
      ...(audioConfig || {}),
    };
    if (!Number.isFinite(config.crossfadeMs)) config.crossfadeMs = DEFAULT_CROSSFADE_MS;
  }

  function load(id) {
    if (buffers.has(id)) return buffers.get(id);
    const e = entry(id);
    if (!e || !ctx) return Promise.resolve(null);
    const p = (async () => {
      try {
        const res = await fetchFn(urlFor(e.file));
        if (res && res.ok === false) throw new Error(`HTTP ${res.status}`);
        const data = await res.arrayBuffer();
        return await ctx.decodeAudioData(data);
      } catch (err) {
        log(`could not load "${id}"`, err);
        return null;
      }
    })();
    buffers.set(id, p);
    return p;
  }

  async function preload(id) {
    if (!ctx) return;
    await load(id);
    // A failed load stays cached as null so it is not retried on every transition.
  }

  const canSound = () => unlocked && !!ctx && !muted;

  function fadeOutActive(fadeS) {
    if (!active) return;
    const { gain, source } = active;
    const now = ctx.currentTime;
    const g = gain.gain;
    if (typeof g.cancelScheduledValues === 'function') g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + fadeS);
    try {
      source.stop(now + fadeS);
    } catch (err) {
      log('stop failed', err);
    }
    active = null;
  }

  async function transitionTo(id, fadeMs) {
    const myToken = ++token;
    if (!canSound()) return;
    const fadeS = Math.max(0, fadeMs) / 1000;
    const buffer = await load(id);
    if (myToken !== token || !canSound()) return;

    const e = entry(id);
    const hadActive = !!active;
    fadeOutActive(fadeS);
    if (!buffer || !e) return; // missing track: previous one just fades out

    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = e.loop !== false;
    const gain = ctx.createGain();
    const target = Number.isFinite(e.gain) ? e.gain : 1;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(target, now + fadeS);
    source.connect(gain);
    gain.connect(master);
    source.start(now);
    active = { id, source, gain };
    void hadActive;
  }

  const fadeOf = (o) => (o && Number.isFinite(o.fadeMs) ? o.fadeMs : config.crossfadeMs);

  function crossfadeTo(id, o) {
    current = id;
    if (active && active.id === id && canSound()) return Promise.resolve();
    return transitionTo(id, fadeOf(o));
  }

  function playTrack(id, o) {
    return crossfadeTo(id, o);
  }

  async function unlockOnGesture() {
    if (unlocked || unsupported) return;
    try {
      ctx = createContext();
    } catch (err) {
      log('AudioContext failed', err);
      ctx = null;
    }
    if (!ctx) {
      unsupported = true;
      return;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    unlocked = true;
    if (!muted) {
      try {
        if (ctx.state === 'suspended') await ctx.resume();
      } catch (err) {
        log('resume failed', err);
      }
    }
    if (current === null) current = AMBIENT_ID;
    await crossfadeTo(current);
  }

  function setMuted(value) {
    const next = !!value;
    if (next === muted) return;
    muted = next;
    if (!ctx || !master) return;
    if (muted) {
      token++; // cancel pending transitions
      const g = master.gain;
      if (typeof g.cancelScheduledValues === 'function') g.cancelScheduledValues(ctx.currentTime);
      g.value = 0;
      g.setValueAtTime(0, ctx.currentTime);
      Promise.resolve(ctx.suspend && ctx.suspend()).catch((err) => log('suspend failed', err));
    } else {
      master.gain.value = 1;
      master.gain.setValueAtTime(1, ctx.currentTime);
      Promise.resolve(ctx.resume && ctx.resume())
        .catch((err) => log('resume failed', err))
        .then(() => {
          if (!muted && current && (!active || active.id !== current)) return transitionTo(current, config.crossfadeMs);
          return undefined;
        });
    }
  }

  function pushContext(trackId = AMBIENT_ID) {
    stack.push(current);
    return crossfadeTo(trackId);
  }

  function popContext() {
    if (stack.length === 0) return Promise.resolve();
    const prev = stack.pop();
    if (prev === null || prev === undefined) {
      current = null;
      return Promise.resolve();
    }
    return crossfadeTo(prev);
  }

  /** Called on navigation actions (CONTINUE, FINISH_JOURNEY, RETURN_TO_SPACE, EXIT_JOURNEY). */
  function clearContext() {
    stack.length = 0;
  }

  /** One-shot effect (UI sounds). No-op before unlock and while muted. */
  async function playEffect(id) {
    if (!canSound() || !entry(id)) return;
    const buffer = await load(id);
    if (!buffer || !canSound()) return;
    const e = entry(id);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = false;
    const g = ctx.createGain();
    g.gain.value = Number.isFinite(e.gain) ? e.gain : 1;
    src.connect(g);
    g.connect(master);
    src.start(ctx.currentTime);
  }

  return {
    init,
    unlockOnGesture,
    playTrack,
    crossfadeTo,
    preload,
    setMuted,
    isMuted: () => muted,
    pushContext,
    popContext,
    clearContext,
    playEffect,
    resolveTrack,
    isUnlocked: () => unlocked,
    isSupported: () => !unsupported,
    getCurrentTrackId: () => current,
    getContextDepth: () => stack.length,
  };
}

// Shared instance for the app.
export const audioEngine = createAudioEngine();

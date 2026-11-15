// Minimal mocked AudioContext for audio engine tests.

export function createMockAudio() {
  const log = []; // ordered event log
  const gains = [];
  const sources = [];
  const ctx = {
    currentTime: 10,
    state: 'suspended',
    destination: { kind: 'destination' },
    resume: async () => {
      ctx.state = 'running';
      log.push('resume');
    },
    suspend: async () => {
      ctx.state = 'suspended';
      log.push('suspend');
    },
    decodeAudioData: async (data) => {
      log.push('decode');
      return { decoded: data };
    },
    createGain() {
      const ramps = [];
      const g = {
        gain: {
          value: 1,
          ramps,
          setValueAtTime(v, t) {
            g.gain.value = v;
            ramps.push({ type: 'set', v, t });
          },
          linearRampToValueAtTime(v, t) {
            ramps.push({ type: 'ramp', v, t });
          },
          cancelScheduledValues() {},
        },
        connect() {},
      };
      gains.push(g);
      log.push('createGain');
      return g;
    },
    createBufferSource() {
      const s = { buffer: null, loop: false, started: null, stopped: null, connect() {}, start(t) { s.started = t; }, stop(t) { s.stopped = t; } };
      sources.push(s);
      log.push('createBufferSource');
      return s;
    },
  };
  const fetched = [];
  const fetchFn = async (url) => {
    fetched.push(url);
    log.push('fetch');
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  };
  return { ctx, log, gains, sources, fetched, fetchFn, createContext: () => ctx };
}

export const AUDIO_CONFIG = {
  crossfadeMs: 2000,
  tracks: [
    { id: 'space-ambient', file: 'space-ambient.opus', loop: true, gain: 0.5 },
    { id: 'a', file: 'a.opus', loop: true, gain: 0.6 },
    { id: 'b', file: 'b.opus', loop: true, gain: 0.7 },
  ],
  effects: [{ id: 'hover-blip', file: 'hover.opus', gain: 0.3 }],
};

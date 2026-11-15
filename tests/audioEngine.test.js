import { describe, it, expect } from 'vitest';
import { createAudioEngine } from '../src/audio/audioEngine.js';
import { createMockAudio, AUDIO_CONFIG } from './helpers/mockAudio.js';

// Validates: Requirements 11.1, 11.4, 11.10

function setup() {
  const m = createMockAudio();
  const engine = createAudioEngine({
    createContext: m.createContext,
    fetchFn: m.fetchFn,
    log: () => {},
  });
  engine.init(AUDIO_CONFIG);
  return { m, engine };
}

describe('audioEngine with a mocked AudioContext', () => {
  it('plays nothing and creates no context before a gesture', async () => {
    const { m, engine } = setup();
    await engine.crossfadeTo('a');
    await engine.preload('b');
    expect(m.sources).toHaveLength(0);
    expect(m.log).toEqual([]);
    expect(engine.getCurrentTrackId()).toBe('a');
  });

  it('starts space ambient after the first gesture', async () => {
    const { m, engine } = setup();
    await engine.unlockOnGesture();
    expect(m.ctx.state).toBe('running');
    expect(m.sources).toHaveLength(1);
    expect(m.sources[0].started).not.toBeNull();
    expect(m.fetched[0]).toBe('/audio/space-ambient.opus');
    expect(engine.getCurrentTrackId()).toBe('space-ambient');
  });

  it('ends the crossfade ramps 2 s after they start', async () => {
    const { m, engine } = setup();
    await engine.unlockOnGesture();
    m.ctx.currentTime = 20;
    await engine.crossfadeTo('a');
    const outgoing = m.gains[1]; // gains[0] is master, [1] is ambient
    const incoming = m.gains[2];
    const outRamp = outgoing.gain.ramps.filter((r) => r.type === 'ramp').pop();
    const inRamp = incoming.gain.ramps.find((r) => r.type === 'ramp');
    expect(outRamp).toEqual({ type: 'ramp', v: 0, t: 22 });
    expect(inRamp).toEqual({ type: 'ramp', v: 0.6, t: 22 });
    expect(m.sources[0].stopped).toBe(22);
  });

  it('fetches and decodes the track before the crossfade begins', async () => {
    const { m, engine } = setup();
    await engine.unlockOnGesture();
    m.log.length = 0;
    await engine.crossfadeTo('b');
    const iDecode = m.log.indexOf('decode');
    expect(iDecode).toBeGreaterThanOrEqual(0);
    expect(iDecode).toBeLessThan(m.log.indexOf('createBufferSource'));
  });

  it('logs and skips a failed fetch, fading the previous track out', async () => {
    const m = createMockAudio();
    const engine = createAudioEngine({
      createContext: m.createContext,
      fetchFn: async (url) => {
        if (url.includes('a.opus')) throw new Error('404');
        return m.fetchFn(url);
      },
      log: () => {},
    });
    engine.init(AUDIO_CONFIG);
    await engine.unlockOnGesture();
    await engine.crossfadeTo('a');
    expect(m.sources).toHaveLength(1);
    expect(m.sources[0].stopped).toBe(m.ctx.currentTime + 2);
  });

  it('plays UI effects only after unlock and when not muted', async () => {
    const { m, engine } = setup();
    await engine.playEffect('hover-blip');
    expect(m.sources).toHaveLength(0);
    await engine.unlockOnGesture();
    engine.setMuted(true);
    await engine.playEffect('hover-blip');
    expect(m.sources).toHaveLength(1); // only ambient
  });
});

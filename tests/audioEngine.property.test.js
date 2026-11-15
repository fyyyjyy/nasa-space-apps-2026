import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createAudioEngine, resolveTrack } from '../src/audio/audioEngine.js';
import { createMockAudio, AUDIO_CONFIG } from './helpers/mockAudio.js';

const MISSION_IDS = ['surveyor3', 'apollo11', 'apollo17', 'viking1', 'opportunity', 'insight'];
const config = {
  missions: MISSION_IDS.map((id) => ({
    id,
    chapters: new Array(id === 'surveyor3' ? 6 : 4).fill({}),
    audio: {
      trackId: `${id}-track`,
      ...(id === 'opportunity' ? { variationTrackId: 'opportunity-quiet' } : {}),
    },
  })),
};
const ambientScreens = ['OPENING', 'ORBIT', 'CLOSING', 'QUIZ'];
const missionScreens = ['STORY', 'SUMMARY'];

// Feature: nasa-space-apps-2026, Property 30: Audio track resolution
// **Validates: Requirements 11.2, 11.3, 11.5, 11.11**
describe('Property 30: Audio track resolution', () => {
  it('resolves ambient, mission and variation tracks', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ambientScreens, ...missionScreens),
        fc.constantFrom(...MISSION_IDS),
        fc.nat({ max: 5 }),
        (screen, missionId, chapter) => {
          const m = config.missions.find((x) => x.id === missionId);
          const idx = Math.min(chapter, m.chapters.length - 1);
          const id = resolveTrack({ screen, missionId }, idx, config);
          if (ambientScreens.includes(screen)) return id === 'space-ambient';
          if (missionId === 'opportunity' && idx === m.chapters.length - 1) return id === 'opportunity-quiet';
          return id === `${missionId}-track`;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('mission tracks are pairwise distinct', () => {
    const ids = MISSION_IDS.map((missionId) => resolveTrack({ screen: 'STORY', missionId }, 0, config));
    expect(new Set(ids).size).toBe(6);
  });
});

function engineFor() {
  const m = createMockAudio();
  const engine = createAudioEngine({ createContext: m.createContext, fetchFn: m.fetchFn, log: () => {} });
  engine.init(AUDIO_CONFIG);
  return { m, engine };
}
const trackArb = fc.constantFrom('space-ambient', 'a', 'b');

// Feature: nasa-space-apps-2026, Property 31: Muted engine stays silent
// **Validates: Requirements 11.8, 11.12**
describe('Property 31: Muted engine stays silent', () => {
  const opArb = fc.oneof(
    trackArb.map((t) => ['play', t]),
    trackArb.map((t) => ['cross', t]),
    trackArb.map((t) => ['preload', t]),
    trackArb.map((t) => ['push', t]),
    fc.constant(['pop']),
    fc.constant(['ui']),
  );

  it('keeps master gain at zero and never creates sources while muted', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), fc.array(opArb, { maxLength: 15 }), async (unlockFirst, ops) => {
        const { m, engine } = engineFor();
        if (unlockFirst) await engine.unlockOnGesture();
        engine.setMuted(true);
        const sourcesBefore = m.sources.length;
        for (const [op, t] of ops) {
          if (op === 'play') await engine.playTrack(t);
          else if (op === 'cross') await engine.crossfadeTo(t);
          else if (op === 'preload') await engine.preload(t);
          else if (op === 'push') await engine.pushContext(t);
          else if (op === 'pop') await engine.popContext();
          else await engine.playEffect('hover-blip');
          expect(engine.isMuted()).toBe(true);
          if (m.gains[0]) expect(m.gains[0].gain.value).toBe(0);
        }
        expect(m.sources.length).toBe(sourcesBefore);
        if (!unlockFirst) {
          // Unlocking while muted stays silent and does not unmute.
          await engine.unlockOnGesture();
          expect(engine.isMuted()).toBe(true);
          expect(m.gains[0].gain.value).toBe(0);
          expect(m.sources).toHaveLength(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('becomes unmuted only through setMuted(false)', async () => {
    const { engine } = engineFor();
    await engine.unlockOnGesture();
    engine.setMuted(true);
    await engine.crossfadeTo('a');
    expect(engine.isMuted()).toBe(true);
    engine.setMuted(false);
    expect(engine.isMuted()).toBe(false);
  });
});

// Feature: nasa-space-apps-2026, Property 32: Quiz audio context round trip
// **Validates: Requirements 11.12**
describe('Property 32: Quiz audio context round trip', () => {
  const navTrack = { CONTINUE: 'a', FINISH_JOURNEY: 'space-ambient', RETURN_TO_SPACE: 'space-ambient', EXIT_JOURNEY: 'space-ambient' };

  it('push then pop restores the original track', async () => {
    await fc.assert(
      fc.asyncProperty(trackArb, fc.boolean(), async (start, muted) => {
        const { engine } = engineFor();
        await engine.unlockOnGesture();
        engine.setMuted(muted);
        await engine.crossfadeTo(start);
        await engine.pushContext('space-ambient');
        expect(engine.getCurrentTrackId()).toBe('space-ambient');
        await engine.popContext();
        expect(engine.getCurrentTrackId()).toBe(start);
        expect(engine.getContextDepth()).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it('a navigation action between push and pop wins over the remembered track', async () => {
    await fc.assert(
      fc.asyncProperty(trackArb, fc.constantFrom(...Object.keys(navTrack)), async (start, action) => {
        const { engine } = engineFor();
        await engine.unlockOnGesture();
        await engine.crossfadeTo(start);
        await engine.pushContext('space-ambient');
        engine.clearContext();
        await engine.crossfadeTo(navTrack[action]);
        await engine.popContext(); // empty stack: no-op
        expect(engine.getCurrentTrackId()).toBe(navTrack[action]);
        expect(engine.getContextDepth()).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

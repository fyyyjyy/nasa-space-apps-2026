import { describe, it, expect } from 'vitest';
import audio from '../src/data/audio.json';
import missions from '../src/data/missions.json';
import { validateAudio } from '../src/core/dataValidator.js';

describe('validateAudio mission resolution', () => {
  it('passes on the real data (audio.json missions map merged in)', () => {
    expect(validateAudio(audio, missions).errors).toEqual([]);
  });

  it('reports a mission with no audio in either place', () => {
    const cfg = { ...audio, missions: {} };
    const errs = validateAudio(cfg, [{ id: 'insight', chapters: [] }]).errors;
    expect(errs).toContain('mission insight: audio.trackId is missing');
  });

  it('reports an unresolved track in the map', () => {
    const cfg = { ...audio, missions: { insight: { audio: { trackId: 'nope' } } } };
    const errs = validateAudio(cfg, [{ id: 'insight', chapters: [] }]).errors;
    expect(errs).toContain('mission insight: audio track "nope" does not resolve');
  });

  it('requires variationTrackId when a chapter uses the variation track', () => {
    const cfg = { ...audio, missions: { insight: { audio: { trackId: 'insight' } } } };
    const errs = validateAudio(cfg, [{ id: 'insight', chapters: [{ useVariationTrack: true }] }]).errors;
    expect(errs.some((e) => e.includes('variationTrackId is missing'))).toBe(true);
  });

  it("prefers a mission's own audio field over the map", () => {
    const m = { id: 'insight', audio: { trackId: 'insight' }, chapters: [] };
    const cfg = { ...audio, missions: { insight: { audio: { trackId: 'nope' } } } };
    expect(validateAudio(cfg, [m]).errors).toEqual([]);
  });
});

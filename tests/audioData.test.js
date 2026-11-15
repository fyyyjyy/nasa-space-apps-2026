import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import audio from '../src/data/audio.json';
import { validateAudio } from '../src/core/dataValidator.js';

// Requirements 11.3, 11.9 (Property 33: audio data licensing)
const audioDir = path.resolve(__dirname, '../public/audio');
const all = [...audio.tracks, ...audio.effects];
const credits = fs.readFileSync(path.join(audioDir, 'CREDITS.md'), 'utf8');

describe('audio.json', () => {
  it('passes validateAudio', () => {
    expect(validateAudio(audio).errors).toEqual([]);
  });

  it('has the expected tracks and effect', () => {
    expect(audio.tracks.map((t) => t.id).sort()).toEqual(
      ['space-ambient', 'surveyor3', 'apollo11', 'apollo17', 'viking1', 'opportunity', 'opportunity-quiet', 'insight'].sort(),
    );
    expect(audio.effects.map((e) => e.id)).toEqual(['ui-hover']);
    expect(audio.crossfadeMs).toBe(2000);
  });

  it('records source and an allowed licence for every entry', () => {
    for (const e of all) {
      expect(e.source.trim().length, e.id).toBeGreaterThan(0);
      expect(['Public domain', 'CC0', 'CC BY 4.0', 'Royalty-free']).toContain(e.license);
    }
  });

  it('points every entry at an existing file listed in CREDITS.md', () => {
    for (const e of all) {
      expect(fs.existsSync(path.join(audioDir, e.file)), e.file).toBe(true);
      expect(credits).toContain('`' + e.file + '`');
    }
  });

  it('resolves mission track ids, including the Opportunity variation', () => {
    const ids = new Set(audio.tracks.map((t) => t.id));
    for (const m of Object.values(audio.missions)) {
      expect(ids.has(m.audio.trackId)).toBe(true);
      if (m.audio.variationTrackId) expect(ids.has(m.audio.variationTrackId)).toBe(true);
    }
    expect(audio.missions.opportunity.audio.variationTrackId).toBe('opportunity-quiet');
  });
});

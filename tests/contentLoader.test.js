import { describe, it, expect, vi } from 'vitest';
import missions from '../src/data/missions.json';
import quizzes from '../src/data/quizzes.json';
import audio from '../src/data/audio.json';
import { loadContent } from '../src/core/contentLoader.js';

const real = { missions, quizzes, audio };

describe('loadContent', () => {
  it('accepts the real data in dev and production', () => {
    expect(loadContent(real, { isDev: true }).errors).toEqual([]);
    expect(loadContent(real).unavailable).toEqual([]);
  });

  it('throws a readable list in dev for bad data', () => {
    const bad = structuredClone(missions);
    bad[0].chapters[0].narrative = '';
    expect(() => loadContent({ missions: bad }, { isDev: true })).toThrow(/narrative is missing/);
  });

  it('in production logs, drops the invalid chapter and keeps the mission', () => {
    const bad = structuredClone(missions);
    bad[0].chapters[0].narrative = '';
    const log = vi.fn();
    const res = loadContent({ missions: bad }, { log });
    expect(log).toHaveBeenCalled();
    expect(res.missions[0].chapters).toHaveLength(missions[0].chapters.length - 1);
    expect(res.unavailable).toEqual([]);
  });

  it('flags a mission with no valid chapters as unavailable', () => {
    const bad = structuredClone(missions);
    bad[1].chapters = [];
    const res = loadContent({ missions: bad }, { log: () => {} });
    expect(res.unavailable).toContain(bad[1].id);
  });
});

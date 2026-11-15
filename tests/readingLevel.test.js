import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { countSyllables, fleschKincaidGrade, collectPassages } from '../scripts/reading-level.js';

describe('reading-level scoring', () => {
  it('counts syllables of simple words', () => {
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('lander')).toBe(2);
    expect(countSyllables('landed')).toBe(2 - 1);
    expect(countSyllables('astronomical')).toBeGreaterThanOrEqual(4);
  });

  it('scores simple text lower than complex text', () => {
    const simple = 'I sat on the Moon. I saw the sun. It was hot.';
    const hard = 'Instrumentation notwithstanding, electromagnetic interference substantially complicated communications.';
    expect(fleschKincaidGrade(simple)).toBeLessThan(4);
    expect(fleschKincaidGrade(hard)).toBeGreaterThan(fleschKincaidGrade(simple));
  });

  it('returns 0 for empty text', () => {
    expect(fleschKincaidGrade('')).toBe(0);
  });

  it('always returns a finite number', () => {
    fc.assert(fc.property(fc.string(), (s) => Number.isFinite(fleschKincaidGrade(s))));
  });

  it('collects chapter narratives and quiz text', () => {
    const p = collectPassages(
      [{ id: 'm', chapters: [{ id: 'c1', narrative: 'Hi there.' }] }],
      [{ missionId: 'm', questions: [{ id: 'q1', prompt: 'Why?', explanation: 'Because.' }] }],
    );
    expect(p.map((x) => x.label)).toEqual(['c1 narrative', 'q1 prompt', 'q1 explanation']);
  });
});

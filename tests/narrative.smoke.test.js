import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const missions = JSON.parse(
  readFileSync(join(process.cwd(), 'src', 'data', 'missions.json'), 'utf8')
);

const byId = (id) => missions.find((m) => m.id === id);
const narratives = (m) => m.chapters.map((c) => c.narrative);
const callouts = (m) => m.chapters.map((c) => (c.callout ? c.callout.text : ''));
const allText = (m) =>
  [m.finalStatus, m.description, ...narratives(m), ...callouts(m)].join('\n');

const QUOTE_RE = /["\u201c\u201d]/;
const QUOTED_SPAN_RE = /["\u201c]([^"\u201c\u201d]*)["\u201d]/g;

const ALLOWED_QUOTES = [
  'Houston, Tranquility Base here. The Eagle has landed.',
  'Magnificent desolation.',
  "My battery is low and it's getting dark.",
];

describe('narrative smoke tests (missions.json)', () => {
  it('Apollo 11 mentions 1202, 1201 and about 17 seconds', () => {
    const text = allText(byId('apollo11'));
    expect(text).toContain('1202');
    expect(text).toContain('1201');
    expect(text).toMatch(/about 17 seconds/);
  });

  it('Viking 1 mentions November 11, 1982 and does not claim to be the first lander on Mars', () => {
    const m = byId('viking1');
    const text = allText(m);
    expect(text).toContain('November 11, 1982');
    expect(text).toContain("NASA's first truly successful");
    expect(text).toContain('Mars 3');
    expect(text).not.toMatch(/first (lander|spacecraft|probe) (to land )?(on|to reach) Mars/i);
    expect(text).not.toMatch(/first (ever )?landing on Mars/i);
    // Every use of "first ... Mars" for landing must be qualified
    expect(text).not.toMatch(/\bI (was|am) the first\b/i);
  });

  it('Opportunity presents the battery line only as a labelled paraphrase by Jacob Margolis, never in a callout', () => {
    const m = byId('opportunity');
    const battery = /battery is low/i;
    const withLine = m.chapters.filter((c) => battery.test(c.narrative));
    expect(withLine.length).toBe(1);
    const n = withLine[0].narrative;
    expect(n).toContain('Jacob Margolis');
    expect(n).toMatch(/paraphrase/i);
    expect(n).toMatch(/not mine and not NASA's/);
    for (const c of m.chapters) {
      expect(c.callout.text).not.toMatch(battery);
    }
    for (const other of missions.filter((x) => x.id !== 'opportunity')) {
      expect(allText(other)).not.toMatch(battery);
    }
  });

  it('Surveyor 3 mentions May 4, 1967 and has no quotation marks', () => {
    const m = byId('surveyor3');
    const text = allText(m);
    expect(text).toContain('May 4, 1967');
    expect(QUOTE_RE.test(text)).toBe(false);
  });

  it('InSight mentions December 15 and December 21, 2022', () => {
    const text = allText(byId('insight'));
    expect(text).toContain('December 15, 2022');
    expect(text).toContain('December 21, 2022');
  });

  it('no narrative contains quoted dialogue other than the known real quotes', () => {
    const found = [];
    for (const m of missions) {
      for (const c of m.chapters) {
        for (const match of c.narrative.matchAll(QUOTED_SPAN_RE)) {
          found.push({ id: c.id, quote: match[1] });
        }
        // Quote characters must be balanced pairs (no stray quotes)
        const count = (c.narrative.match(/["\u201c\u201d]/g) || []).length;
        expect(count % 2, `${c.id} has unbalanced quotation marks`).toBe(0);
        if (c.callout) {
          expect(QUOTE_RE.test(c.callout.text), `${c.id} callout has quotes`).toBe(false);
        }
      }
    }
    for (const f of found) {
      expect(ALLOWED_QUOTES, `Unexpected quote in ${f.id}: "${f.quote}"`).toContain(f.quote);
    }
    expect(found.map((f) => f.quote).sort()).toEqual([...ALLOWED_QUOTES].sort());
  });
});

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateMissions, EXPECTED_CHAPTER_COUNTS, LIMITS } from '../src/core/dataValidator.js';

// Feature: nasa-space-apps-2026, Property 15: Mission data completeness
// **Validates: Requirements 3.4, 3.5, 6.3, 6.12, 6.17, 8.5**

const REAL = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/missions.json'), 'utf8'));
const clone = () => structuredClone(REAL);
const missionIdx = fc.integer({ min: 0, max: REAL.length - 1 });
const pick = (m, n) => n % m.length;

describe('Property 15: Mission data completeness', () => {
  it('real missions.json is valid with agreed chapter counts, caption/tooltip/description limits', () => {
    const r = validateMissions(REAL);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    for (const m of REAL) {
      expect(m.chapters.length).toBe(EXPECTED_CHAPTER_COUNTS[m.id]);
      expect(m.chapters.length).toBeGreaterThanOrEqual(3);
      expect(m.chapters.length).toBeLessThanOrEqual(6);
      expect(m.tooltip.length).toBeLessThanOrEqual(LIMITS.tooltipMax);
      expect(m.description.length).toBeLessThanOrEqual(LIMITS.descriptionMax);
      for (const ch of m.chapters) {
        for (const img of ch.images) {
          expect(img.caption.length).toBeLessThanOrEqual(LIMITS.captionMax);
          expect(img.caption).toMatch(/Credit:\s*NASA/);
        }
      }
    }
  });

  it('rejects a missing chapter field (title, narrative, callout, keyframe)', () => {
    fc.assert(
      fc.property(missionIdx, fc.nat(), fc.constantFrom('title', 'narrative', 'callout', 'keyframe'), (mi, ci, field) => {
        const d = clone();
        const chs = d[mi].chapters;
        delete chs[pick(chs, ci)][field];
        expect(validateMissions(d).ok).toBe(false);
      }),
    );
  });

  it('rejects images that are removed, or lack alt or a NASA credit', () => {
    fc.assert(
      fc.property(missionIdx, fc.nat(), fc.constantFrom('drop', 'alt', 'credit'), (mi, ci, kind) => {
        const d = clone();
        const ch = d[mi].chapters[pick(d[mi].chapters, ci)];
        if (kind === 'drop') ch.images = [];
        else if (kind === 'alt') ch.images[0].alt = '';
        else ch.images[0].caption = 'No attribution here';
        expect(validateMissions(d).ok).toBe(false);
      }),
    );
  });

  it('rejects wrong chapter counts (extra or dropped chapters)', () => {
    fc.assert(
      fc.property(missionIdx, fc.boolean(), (mi, extra) => {
        const d = clone();
        if (extra) d[mi].chapters.push(structuredClone(d[mi].chapters[0]));
        else d[mi].chapters.pop();
        expect(validateMissions(d).ok).toBe(false);
      }),
    );
  });

  it('rejects invalid keyframes', () => {
    fc.assert(
      fc.property(
        missionIdx,
        fc.nat(),
        fc.constantFrom('cameraOffset', 'lookAt', 'modelRotation', 'modelZoom', 'lightAzimuthDeg', 'lightIntensity'),
        (mi, ci, key) => {
          const d = clone();
          const k = d[mi].chapters[pick(d[mi].chapters, ci)].keyframe;
          if (key === 'modelZoom') k[key] = 99;
          else if (key.endsWith('Deg') || key === 'lightIntensity') k[key] = 'x';
          else k[key] = [1, 2];
          expect(validateMissions(d).ok).toBe(false);
        },
      ),
    );
  });

  it('rejects over-long captions, tooltips and descriptions; accepts them at the limit', () => {
    fc.assert(
      fc.property(
        missionIdx,
        fc.nat(),
        fc.integer({ min: 1, max: 200 }),
        fc.constantFrom('caption', 'tooltip', 'description'),
        (mi, ci, over, field) => {
          const d = clone();
          const m = d[mi];
          const ch = m.chapters[pick(m.chapters, ci)];
          const max = { caption: LIMITS.captionMax, tooltip: LIMITS.tooltipMax, description: LIMITS.descriptionMax }[field];
          const make = (len) => (field === 'caption' ? 'Credit: NASA ' : '') + 'a'.repeat(len - (field === 'caption' ? 13 : 0));
          const set = (s) => (field === 'caption' ? (ch.images[0].caption = s) : (m[field] = s));
          set(make(max));
          expect(validateMissions(d).ok).toBe(true);
          set(make(max + over));
          expect(validateMissions(d).ok).toBe(false);
        },
      ),
    );
  });
});

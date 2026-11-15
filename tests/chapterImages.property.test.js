import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { validateMissions } from '../src/core/dataValidator.js';

// Feature: nasa-space-apps-2026, Property 17: Chapter image sources
// **Validates: Requirements 6.18**

const root = process.cwd();
const missions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/missions.json'), 'utf8'));
const MISSIONS = Array.isArray(missions) ? missions : missions.missions;

const imageErrors = (img) => {
  const data = structuredClone(MISSIONS);
  data[0].chapters[0].images[0] = img;
  const tag = `mission ${data[0].id} chapter[0] image[0]`;
  return validateMissions(data).errors.filter((e) => e.startsWith(tag));
};

const idArb = fc.stringMatching(/^[A-Za-z0-9_-]{3,20}$/);
const hostArb = fc.constantFrom('images.nasa.gov', 'images-assets.nasa.gov');
const badHostArb = fc.constantFrom(
  'example.com', 'nasa.gov.evil.com', 'notnasa.gov', 'www.nasa.gov', 'upload.wikimedia.org',
);
const captionArb = fc
  .tuple(fc.stringMatching(/^[A-Za-z ,.]{0,60}$/), fc.stringMatching(/^[A-Za-z ,.]{0,30}$/))
  .map(([a, b]) => `${a} Credit: NASA ${b}`.slice(0, 120))
  .filter((c) => /Credit:\s*NASA/.test(c));
const altArb = fc.stringMatching(/^[A-Za-z][A-Za-z ]{2,40}$/);

const validImageArb = fc
  .tuple(idArb, hostArb, captionArb, altArb)
  .map(([nasaId, host, caption, alt]) => ({
    src: '/images/x.webp',
    nasaId,
    sourceUrl: `https://${host}/image-detail/${nasaId}`,
    alt,
    caption,
  }));

describe('Property 17: Chapter image sources', () => {
  it('accepts images with NASA ID, NASA image host, alt and credited short caption', () => {
    fc.assert(fc.property(validImageArb, (img) => imageErrors(img).length === 0), { numRuns: 100 });
  });

  it('rejects sourceUrl hosts outside the NASA image allowlist', () => {
    fc.assert(
      fc.property(validImageArb, badHostArb, (img, host) => {
        const bad = { ...img, sourceUrl: `https://${host}/image-detail/${img.nasaId}` };
        return imageErrors(bad).some((e) => e.includes('sourceUrl'));
      }),
      { numRuns: 100 },
    );
  });

  it('rejects missing NASA ID, alt, or credit, and captions over 120 chars', () => {
    fc.assert(
      fc.property(validImageArb, (img) => {
        const noId = imageErrors({ ...img, nasaId: '' }).some((e) => e.includes('nasaId'));
        const noAlt = imageErrors({ ...img, alt: '' }).some((e) => e.includes('alt'));
        const noCredit = imageErrors({ ...img, caption: 'A caption without attribution' }).some((e) => e.includes('Credit: NASA'));
        const long = imageErrors({ ...img, caption: `Credit: NASA ${'x'.repeat(120)}` }).some((e) => e.includes('max 120'));
        return noId && noAlt && noCredit && long;
      }),
      { numRuns: 50 },
    );
  });

  it('rejects a sourceUrl that does not contain the NASA ID', () => {
    fc.assert(
      fc.property(validImageArb, (img) => {
        const bad = { ...img, nasaId: `${img.nasaId}ZZZ`, sourceUrl: `https://images.nasa.gov/details/${img.nasaId}` };
        return imageErrors(bad).some((e) => e.includes('does not contain nasaId'));
      }),
      { numRuns: 50 },
    );
  });

  describe('real data in missions.json', () => {
    const all = MISSIONS.flatMap((m) =>
      m.chapters.flatMap((c, ci) => c.images.map((img, ii) => ({ where: `${m.id} ch${ci} img${ii}`, img }))),
    );

    it('passes the image checks with no image errors', () => {
      const errors = validateMissions(MISSIONS).errors.filter((e) => /image\[/.test(e));
      expect(errors).toEqual([]);
    });

    it('every image file exists in public/ and is at most 1200 px wide', async () => {
      let sharp = null;
      try {
        sharp = (await import('sharp')).default;
      } catch {
        sharp = null;
      }
      expect(all.length).toBeGreaterThan(0);
      for (const { where, img } of all) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(img.src)) continue; // remote, covered by the host check
        const file = path.join(root, 'public', img.src.replace(/^\/+/, ''));
        expect(fs.existsSync(file), `${where}: missing file ${file}`).toBe(true);
        if (sharp) {
          const { width } = await sharp(file).metadata();
          expect(width, `${where}: width ${width}`).toBeLessThanOrEqual(1200);
        }
      }
    });
  });
});

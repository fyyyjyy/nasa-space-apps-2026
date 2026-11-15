import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import base from '../src/data/missions.json';
import { isNasaUrl, validateMissions } from '../src/core/dataValidator.js';
import { renderCitation } from '../src/ui/storyColumn.js';

// Feature: nasa-space-apps-2026, Property 16: NASA citation domain
// **Validates: Requirements 6.12, 9.2**

const RUNS = { numRuns: 200 };
const label = fc.stringMatching(/^[a-z]{1,12}$/);
const scheme = fc.constantFrom('http', 'https');
const sub = fc.stringMatching(/^[a-z0-9]{1,10}$/);
const path = fc.constantFrom('', '/', '/a/b', '/a?x=1', '/#frag');
const port = fc.constantFrom('', ':443', ':8080');
const caseMix = (s) => fc.array(fc.boolean(), { minLength: s.length, maxLength: s.length })
  .map((bits) => [...s].map((c, i) => (bits[i] ? c.toUpperCase() : c)).join(''));

const nasaHost = fc.oneof(
  fc.constant('nasa.gov'),
  fc.array(sub, { minLength: 1, maxLength: 3 }).map((p) => `${p.join('.')}.nasa.gov`),
).chain(caseMix);

const lookalikeHost = fc.oneof(
  sub.map((s) => `nasa.gov.${s}.com`),
  sub.map((s) => `not${s}nasa.gov`.replace(/\./g, '')),
  sub.map((s) => `${s}nasa.gov`),
  sub.map((s) => `nasa-gov.${s}.com`),
  sub.map((s) => `${s}.nasa.gov.evil.com`),
  sub.map((s) => `${s}.com`),
  fc.constantFrom('nasa.gov.evil.com', 'notnasa.gov', 'nasa.gov.', 'nasa.com', 'gov', 'nasa.gove.com'),
);

describe('Property 16: NASA citation domain', () => {
  it('accepts http(s) URLs on nasa.gov and its subdomains', () => {
    fc.assert(
      fc.property(scheme, nasaHost, port, path, (s, h, p, pa) => {
        expect(isNasaUrl(`${s}://${h}${p}${pa}`)).toBe(true);
      }),
      RUNS,
    );
  });

  it('rejects lookalike hosts', () => {
    fc.assert(
      fc.property(scheme, lookalikeHost, path, (s, h, pa) => {
        expect(isNasaUrl(`${s}://${h}${pa}`)).toBe(false);
      }),
      RUNS,
    );
  });

  it('rejects nasa.gov appearing only in path, query, fragment or userinfo', () => {
    fc.assert(
      fc.property(scheme, sub, (s, h) => {
        expect(isNasaUrl(`${s}://${h}.com/nasa.gov`)).toBe(false);
        expect(isNasaUrl(`${s}://${h}.com/?u=https://nasa.gov`)).toBe(false);
        expect(isNasaUrl(`${s}://${h}.com/#nasa.gov`)).toBe(false);
        expect(isNasaUrl(`${s}://nasa.gov@${h}.com/`)).toBe(false);
      }),
      RUNS,
    );
  });

  it('rejects non-http schemes, non-strings and arbitrary non-URL text', () => {
    fc.assert(
      fc.property(fc.constantFrom('ftp', 'javascript', 'data', 'file'), nasaHost, (s, h) => {
        expect(isNasaUrl(`${s}://${h}/`)).toBe(false);
      }),
      RUNS,
    );
    fc.assert(
      fc.property(fc.anything(), (v) => {
        if (typeof v !== 'string') expect(isNasaUrl(v)).toBe(false);
      }),
      RUNS,
    );
    fc.assert(
      fc.property(fc.string(), (s) => {
        // Without a scheme separator nothing can parse as an http(s) URL.
        fc.pre(!s.includes(':'));
        expect(isNasaUrl(s)).toBe(false);
      }),
      RUNS,
    );
  });

  it('checks citations in validateMissions with the same rule', () => {
    const missions = Array.isArray(base) ? base : base.missions;
    expect(validateMissions(missions).ok).toBe(true);
    // Every real citation (mission-level and callouts) is on nasa.gov.
    for (const m of missions) {
      expect(m.citations.length).toBeGreaterThan(0);
      for (const c of m.citations) expect(isNasaUrl(c.url)).toBe(true);
      for (const ch of m.chapters) if (ch.callout) expect(isNasaUrl(ch.callout.citation.url)).toBe(true);
    }
    fc.assert(
      fc.property(fc.oneof(lookalikeHost.map((h) => `https://${h}/`), fc.constant('')), fc.boolean(), (url, inCallout) => {
        const copy = structuredClone(missions);
        if (inCallout) {
          const ch = copy.flatMap((m) => m.chapters).find((c) => c.callout);
          if (!ch) return;
          ch.callout.citation.url = url;
        } else {
          copy[0].citations[0].url = url;
        }
        const r = validateMissions(copy);
        expect(r.ok).toBe(false);
        expect(r.errors.some((e) => e.includes('citation url must be on nasa.gov'))).toBe(true);
      }),
      RUNS,
    );
  });

  it('renders a link only for NASA URLs and always keeps the label', () => {
    const url = fc.oneof(
      fc.tuple(scheme, nasaHost, path).map(([s, h, p]) => `${s}://${h}${p}`),
      fc.tuple(scheme, lookalikeHost, path).map(([s, h, p]) => `${s}://${h}${p}`),
      fc.constantFrom('', 'not a url', 'javascript:alert(1)'),
    );
    fc.assert(
      fc.property(label, url, (l, u) => {
        const el = renderCitation({ label: l, url: u }, document);
        expect(el.textContent).toContain(l);
        const links = el.querySelectorAll('a');
        if (isNasaUrl(u)) {
          expect(links.length).toBe(1);
          expect(links[0].getAttribute('href')).toBeTruthy();
          expect(el.querySelector('.story-citation__unavailable')).toBeNull();
        } else {
          expect(links.length).toBe(0);
          expect(el.querySelector('.story-citation__unavailable')).not.toBeNull();
        }
      }),
      RUNS,
    );
  });
});

// Example tests for style tokens. Validates: Requirements 12.1-12.8, 12.10, 12.11
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
const tokensCss = read('src/styles/tokens.css');
const baseCss = read('src/styles/base.css');
const indexHtml = read('index.html');

function token(name) {
  const m = tokensCss.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  if (!m) throw new Error(`Missing token --${name}`);
  return m[1].trim();
}

function px(value) {
  const rem = value.match(/^([\d.]+)rem$/);
  if (rem) return parseFloat(rem[1]) * 16;
  const p = value.match(/^([\d.]+)px$/);
  if (p) return parseFloat(p[1]);
  throw new Error(`Unsupported size: ${value}`);
}

describe('font stacks (12.1, 12.2, 12.3, 12.8)', () => {
  it('heading stack is Orbitron, Arial, sans-serif', () => {
    expect(token('font-heading').replace(/["']/g, '')).toBe('Orbitron, Arial, sans-serif');
  });

  it('body stack is Exo 2, Georgia, serif', () => {
    expect(token('font-body').replace(/["']/g, '')).toBe('Exo 2, Georgia, serif');
  });

  it('base.css applies body font to the page and heading font to headings and buttons', () => {
    expect(baseCss).toMatch(/html,\s*body\s*\{[^}]*font-family:\s*var\(--font-body\)/);
    expect(baseCss).toMatch(/h1,\s*h2,[^{]*\{[^}]*font-family:\s*var\(--font-heading\)/);
    expect(baseCss).toMatch(/\.btn-text\s*\{[^}]*font-family:\s*var\(--font-heading\)/);
  });
});

describe('index.html font loading (12.1)', () => {
  it('has a preconnect link to Google Fonts', () => {
    expect(indexHtml).toMatch(/<link[^>]*rel="preconnect"[^>]*href="https:\/\/fonts\.googleapis\.com"/);
    expect(indexHtml).toMatch(/<link[^>]*rel="preconnect"[^>]*href="https:\/\/fonts\.gstatic\.com"/);
  });

  it('loads Orbitron and Exo 2 from the Google Fonts CSS endpoint', () => {
    const href = indexHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/s)?.[1];
    expect(href).toBeTruthy();
    expect(href).toContain('family=Orbitron');
    expect(href).toContain('family=Exo+2');
  });
});

describe('minimum sizes (12.4, 12.5, 12.6)', () => {
  it('body and callout are at least 18px', () => {
    expect(px(token('size-body'))).toBeGreaterThanOrEqual(18);
    expect(px(token('size-callout'))).toBeGreaterThanOrEqual(18);
  });

  it('heading is at least 22px', () => {
    expect(px(token('size-heading'))).toBeGreaterThanOrEqual(22);
    expect(px(token('size-title'))).toBeGreaterThanOrEqual(22);
  });

  it('caption is at least 14px', () => {
    expect(px(token('size-caption'))).toBeGreaterThanOrEqual(14);
  });

  it('no size token is below 12px', () => {
    const sizes = [...tokensCss.matchAll(/--size-[\w-]+\s*:\s*([^;]+);/g)].map((m) => px(m[1].trim()));
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(12);
  });
});

describe('line height (12.7)', () => {
  it('body line height is at least 1.6 and applied in base.css', () => {
    expect(parseFloat(token('line-height-body'))).toBeGreaterThanOrEqual(1.6);
    expect(baseCss).toMatch(/line-height:\s*var\(--line-height-body\)/);
  });
});

describe('colours and overlay (12.10, 12.11)', () => {
  it('overlay is rgba(10, 10, 15, 0.85)', () => {
    expect(token('color-overlay')).toBe('rgba(10, 10, 15, 0.85)');
  });

  it('text colours match the spec', () => {
    expect(token('color-bg').toUpperCase()).toBe('#0A0A0F');
    expect(token('color-heading').toUpperCase()).toBe('#FFFFFF');
    expect(token('color-body').toUpperCase()).toBe('#E8E8E8');
    expect(token('color-callout').toUpperCase()).toBe('#A8D8EA');
    expect(token('color-caption').toUpperCase()).toBe('#B0B0B0');
    expect(token('color-button').toUpperCase()).toBe('#FFFFFF');
  });
});

// Feature: nasa-space-apps-2026, Property 34: Text and focus colour contrast
// **Validates: Requirements 8.3, 8.4, 12.9, 12.11, 12.12**
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio, compositeOver } from '../src/core/contrast.js';

const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`Missing token ${name}`);
  return m[1].trim();
};

const bg = token('color-bg');
const textTokens = ['color-heading', 'color-body', 'color-callout', 'color-caption', 'color-button'];
const overlay = (() => {
  const m = token('color-overlay').match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/);
  return { rgb: [+m[1], +m[2], +m[3]], alpha: +m[4] };
})();

describe('Property 34: text and focus colour contrast', () => {
  it('every text token has >= 4.5:1 against the background token', () => {
    for (const t of textTokens) {
      expect(contrastRatio(token(t), bg), t).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('every text token has >= 4.5:1 against the 85% overlay over any star brightness', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 255 }), (v) => {
        const surface = compositeOver(overlay.rgb, overlay.alpha, [v, v, v]);
        return textTokens.every((t) => contrastRatio(token(t), surface) >= 4.5);
      }),
      { numRuns: 256 },
    );
  });

  it('focus colour has >= 3:1 against the background and the composited overlay', () => {
    const focus = token('color-focus');
    expect(contrastRatio(focus, bg)).toBeGreaterThanOrEqual(3);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 255 }), (v) =>
        contrastRatio(focus, compositeOver(overlay.rgb, overlay.alpha, [v, v, v])) >= 3),
      { numRuns: 256 },
    );
  });
});

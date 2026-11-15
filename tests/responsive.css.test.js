// Responsive CSS rules (Requirements 13.3, 13.5, 13.6).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { selectLayout, STACKED_BREAKPOINT_PX } from '../src/core/layoutSelector.js';

const css = (name) =>
  readFileSync(join(process.cwd(), 'src', 'styles', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Flatten CSS into rules: { selector, body, context: [enclosing at-rule preludes] }. */
function parseRules(text) {
  const rules = [];
  const walk = (src, context) => {
    let i = 0;
    while (i < src.length) {
      const open = src.indexOf('{', i);
      if (open < 0) break;
      let depth = 1;
      let j = open + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
        j++;
      }
      const prelude = src.slice(i, open).trim();
      const body = src.slice(open + 1, j - 1);
      if (prelude.startsWith('@')) walk(body, [...context, prelude]);
      else rules.push({ selector: prelude, body, context });
      i = j;
    }
  };
  walk(text, []);
  return rules;
}

const px44 = (body, prop) => new RegExp(`${prop}\\s*:\\s*44px`).test(body);
const findRule = (file, selectorPart, pred = () => true) =>
  parseRules(css(file)).find(
    (r) => r.context.length === 0 && r.selector.split(',').some((s) => s.trim() === selectorPart) && pred(r),
  );

describe('44 px touch targets (13.6)', () => {
  const targets = [
    ['base.css', '.btn-text'],
    ['controls.css', '.persistent-controls__button'],
    ['mute.css', '.audio-controller__button'],
    ['summary.css', '.summary-view .btn-text'],
    ['closing.css', '.closing-screen__action'],
    ['dialog.css', '.quiz-dialog .btn-text'],
    ['dialog.css', '.quiz-dialog__close'],
    ['story.css', '.story-citation__link'],
  ];
  it.each(targets)('%s %s sets 44px minimums', (file, sel) => {
    const rule = findRule(file, sel, (r) => px44(r.body, 'min-height'));
    expect(rule, `${sel} min-height`).toBeTruthy();
    if (sel !== '.quiz-dialog .btn-text') expect(px44(rule.body, 'min-width')).toBe(true);
  });
});

describe('hover scale only under (hover: hover) (13.5)', () => {
  const persistent = [
    ['controls.css', '.persistent-controls__button:hover'],
    ['mute.css', '.audio-controller__button:hover'],
    ['base.css', '.btn-text:hover'],
  ];
  it.each(persistent)('%s %s scale is inside @media (hover: hover)', (file, sel) => {
    const scaled = parseRules(css(file)).filter(
      (r) =>
        r.selector.split(',').some((s) => s.trim() === sel) && /transform\s*:\s*scale\(/.test(r.body),
    );
    expect(scaled.length).toBeGreaterThan(0);
    for (const r of scaled) {
      expect(r.context.some((c) => /\(hover:\s*hover\)/.test(c))).toBe(true);
    }
  });

  it('mute.css has no unguarded :hover scale', () => {
    const bad = parseRules(css('mute.css')).filter(
      (r) => /:hover/.test(r.selector) && /scale\(/.test(r.body) && r.context.length === 0,
    );
    expect(bad).toEqual([]);
  });
});

describe('stacked breakpoint matches selectLayout (13.3)', () => {
  it('STACKED_BREAKPOINT_PX is 768', () => {
    expect(STACKED_BREAKPOINT_PX).toBe(768);
  });

  it.each(['story.css', 'controls.css'])('%s stacks below 768 px', (file) => {
    const m = css(file).match(/@media\s*\(max-width:\s*([\d.]+)px\)/);
    expect(m).toBeTruthy();
    const max = parseFloat(m[1]);
    expect(max).toBe(767.98);
    // Integer widths: stacked in CSS iff width <= max, which must agree with selectLayout.
    for (const w of [320, 767, 768, 769, 1024]) {
      expect(w <= max ? 'stacked' : 'split').toBe(selectLayout(w));
    }
  });
});

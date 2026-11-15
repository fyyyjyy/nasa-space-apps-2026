import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { mount } from '../src/ui/persistentControls.js';

const css = readFileSync('src/styles/controls.css', 'utf8');

function rule(selectorPart) {
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m;
  const out = [];
  while ((m = re.exec(css))) if (m[1].includes(selectorPart)) out.push(m[2]);
  return out.join('\n');
}

describe('persistentControls', () => {
  let parent;
  beforeEach(() => {
    document.body.innerHTML = '';
    parent = document.body;
  });

  it('shows only Return to Space in explore mode', () => {
    const c = mount(parent, { mode: 'explore' });
    const [ret, exit] = c.el.querySelectorAll('button');
    expect(ret.hidden).toBe(false);
    expect(ret.textContent).toBe('Return to Space');
    expect(exit.hidden).toBe(true);
  });

  it('shows only Exit Journey in journey mode and hides all when hidden', () => {
    const c = mount(parent, { mode: 'journey' });
    const [ret, exit] = c.el.querySelectorAll('button');
    expect(ret.hidden).toBe(true);
    expect(exit.hidden).toBe(false);
    expect(exit.textContent).toBe('Exit Journey');
    c.setMode('hidden');
    expect(c.el.hidden).toBe(true);
  });

  it('invokes the matching callbacks on click', () => {
    const onReturnToSpace = vi.fn();
    const onExitJourney = vi.fn();
    const c = mount(parent, { mode: 'explore', onReturnToSpace, onExitJourney });
    c.el.querySelector('[data-control="return-to-space"]').click();
    expect(onReturnToSpace).toHaveBeenCalledTimes(1);
    c.setMode('journey');
    c.el.querySelector('[data-control="exit-journey"]').click();
    expect(onExitJourney).toHaveBeenCalledTimes(1);
  });

  it('calls the hover sound hook on pointer enter and focus', () => {
    const onHover = vi.fn();
    const c = mount(parent, { mode: 'explore', onHover });
    const btn = c.el.querySelector('[data-control="return-to-space"]');
    btn.dispatchEvent(new Event('pointerenter'));
    expect(onHover).toHaveBeenCalledTimes(1);
    btn.focus();
    expect(onHover).toHaveBeenCalledTimes(2);
  });

  it('destroy removes the element', () => {
    const c = mount(parent, { mode: 'explore' });
    c.destroy();
    expect(parent.querySelector('.persistent-controls')).toBeNull();
  });

  describe('CSS', () => {
    it('scales to 120% on hover and focus', () => {
      // :hover scale lives inside @media (hover: hover); focus and active stay outside it.
      const mq = css.match(/@media \(hover: hover\)\s*\{([\s\S]*?\n\})/);
      expect(mq).not.toBeNull();
      expect(mq[1]).toMatch(/:hover[\s\S]*scale\(1\.2\)/);
      const outside = css.replace(mq[0], '');
      expect(outside).not.toMatch(/:hover/);
      expect(outside).toMatch(/:focus-visible,[\s\S]*:active\s*\{[^}]*scale\(1\.2\)/);
    });

    it('transition is at most 200 ms', () => {
      const t = rule('.persistent-controls__button').match(/transition:\s*transform\s+(\d+)ms/);
      expect(t).not.toBeNull();
      expect(Number(t[1])).toBeLessThanOrEqual(200);
    });

    it('is borderless, white, and positioned with safe-area insets', () => {
      const base = rule('.persistent-controls__button');
      expect(base).toMatch(/border:\s*0/);
      expect(base).toMatch(/#FFFFFF/i);
      expect(css).toMatch(/env\(safe-area-inset-right/);
      expect(css).toMatch(/env\(safe-area-inset-bottom/);
    });
  });
});

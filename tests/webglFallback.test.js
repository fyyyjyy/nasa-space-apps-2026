import { describe, it, expect } from 'vitest';
import site from '../src/data/site.json';
import { isWebGLAvailable } from '../src/engine/webglSupport.js';
import { mount } from '../src/ui/webglFallback.js';

function fakeDoc(getContext) {
  return { createElement: () => ({ getContext }) };
}

describe('isWebGLAvailable', () => {
  it('returns false when no context can be created', () => {
    expect(isWebGLAvailable(fakeDoc(() => null))).toBe(false);
  });

  it('returns false when getContext throws', () => {
    expect(isWebGLAvailable(fakeDoc(() => { throw new Error('boom'); }))).toBe(false);
  });

  it('returns false without a document', () => {
    expect(isWebGLAvailable(null)).toBe(false);
  });

  it('tries webgl2 then falls back to webgl', () => {
    const tried = [];
    const ok = isWebGLAvailable(fakeDoc((type) => {
      tried.push(type);
      return type === 'webgl' ? {} : null;
    }));
    expect(ok).toBe(true);
    expect(tried).toEqual(['webgl2', 'webgl']);
  });

  it('returns false in jsdom (no real WebGL)', () => {
    expect(isWebGLAvailable()).toBe(false);
  });
});

describe('webglFallback view', () => {
  it('shows the site.json fallback message as an alert', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const { el, destroy } = mount(parent);
    expect(parent.contains(el)).toBe(true);
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.textContent).toBe(site.webglFallbackMessage);
    expect(el.textContent.toLowerCase()).toContain('webgl');
    destroy();
    expect(parent.children.length).toBe(0);
    parent.remove();
  });

  it('uses an override message when provided', () => {
    const parent = document.createElement('div');
    const { el } = mount(parent, { message: 'custom' });
    expect(el.textContent).toBe('custom');
  });
});

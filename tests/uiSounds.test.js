// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { createUiSounds, HOVER_EFFECT_ID } from '../src/audio/uiSounds.js';

function mockEngine({ unlocked = true, muted = false } = {}) {
  return {
    isUnlocked: () => unlocked,
    isMuted: () => muted,
    playEffect: vi.fn(() => Promise.resolve()),
  };
}

describe('uiSounds.playHover', () => {
  it('plays the hover effect when unlocked and not muted', () => {
    const e = mockEngine();
    createUiSounds(e).playHover();
    expect(e.playEffect).toHaveBeenCalledWith(HOVER_EFFECT_ID);
  });

  it('is a no-op before unlock', () => {
    const e = mockEngine({ unlocked: false });
    createUiSounds(e).playHover();
    expect(e.playEffect).not.toHaveBeenCalled();
  });

  it('is a no-op when muted', () => {
    const e = mockEngine({ muted: true });
    createUiSounds(e).playHover();
    expect(e.playEffect).not.toHaveBeenCalled();
  });

  it('swallows engine errors', async () => {
    const e = mockEngine();
    e.playEffect = vi.fn(() => Promise.reject(new Error('x')));
    expect(() => createUiSounds(e).playHover()).not.toThrow();
    e.playEffect = vi.fn(() => {
      throw new Error('y');
    });
    expect(() => createUiSounds(e).playHover()).not.toThrow();
    await Promise.resolve();
  });
});

describe('HOVER_EFFECT_ID', () => {
  it('exists in src/data/audio.json effects', () => {
    const data = JSON.parse(readFileSync('src/data/audio.json', 'utf8'));
    expect(HOVER_EFFECT_ID).toBe('ui-hover');
    expect(data.effects.map((e) => e.id)).toContain(HOVER_EFFECT_ID);
  });
});



// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mount } from '../src/audio/audioController.js';

function mockEngine() {
  let muted = false;
  return {
    setMuted: vi.fn((v) => { muted = !!v; }),
    isMuted: () => muted,
    crossfadeTo: vi.fn(),
    pushContext: vi.fn(),
    popContext: vi.fn(),
    clearContext: vi.fn()
  };
}

const config = {
  missions: [
    { id: 'opportunity', audio: { trackId: 'opp', variationTrackId: 'opp-quiet' }, chapters: [1, 2, 3, 4] },
    { id: 'apollo11', audio: { trackId: 'a11' }, chapters: [1, 2] }
  ]
};

const press = (target, key, opts = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));

describe('audioController mute toggle', () => {
  let engine, ctl;
  beforeEach(() => {
    document.body.innerHTML = '';
    engine = mockEngine();
    ctl = mount(document.body, { engine, config });
  });

  it('starts unmuted with label "Mute audio" and aria-pressed=false', () => {
    expect(ctl.button.getAttribute('aria-pressed')).toBe('false');
    expect(ctl.button.getAttribute('aria-label')).toBe('Mute audio');
  });

  it('click mutes, then unmutes, updating label and aria-pressed', () => {
    ctl.button.click();
    expect(engine.setMuted).toHaveBeenLastCalledWith(true);
    expect(ctl.button.getAttribute('aria-pressed')).toBe('true');
    expect(ctl.button.getAttribute('aria-label')).toBe('Unmute audio');
    ctl.button.click();
    expect(engine.setMuted).toHaveBeenLastCalledWith(false);
    expect(ctl.button.getAttribute('aria-pressed')).toBe('false');
  });

  it('M toggles; modifiers, repeat and text fields are ignored', () => {
    press(document, 'm');
    expect(engine.isMuted()).toBe(true);
    press(document, 'M');
    expect(engine.isMuted()).toBe(false);
    press(document, 'm', { ctrlKey: true });
    press(document, 'm', { repeat: true });
    const input = document.createElement('input');
    document.body.appendChild(input);
    press(input, 'm');
    expect(engine.setMuted).toHaveBeenCalledTimes(2);
  });

  it('destroy removes the control and the shortcut', () => {
    ctl.destroy();
    press(document, 'm');
    expect(document.querySelector('.audio-controller')).toBeNull();
    expect(engine.setMuted).not.toHaveBeenCalled();
  });

  it('CSS: 44x44, top-right with safe-area insets', () => {
    const css = readFileSync('src/styles/mute.css', 'utf8');
    expect(css).toMatch(/width:\s*44px/);
    expect(css).toMatch(/height:\s*44px/);
    expect(css).toMatch(/top:\s*calc\(1rem \+ env\(safe-area-inset-top/);
    expect(css).toMatch(/right:\s*calc\(1rem \+ env\(safe-area-inset-right/);
  });
});

describe('audioController syncToState', () => {
  let engine, ctl;
  beforeEach(() => {
    document.body.innerHTML = '';
    engine = mockEngine();
    ctl = mount(document.body, { engine, config });
  });

  it('maps screens to tracks', () => {
    expect(ctl.syncToState({ screen: 'OPENING' })).toBe('space-ambient');
    expect(engine.crossfadeTo).toHaveBeenLastCalledWith('space-ambient');
    ctl.syncToState({ screen: 'STORY', missionId: 'apollo11' });
    expect(engine.crossfadeTo).toHaveBeenLastCalledWith('a11');
    ctl.syncToState({ screen: 'STORY', missionId: 'opportunity' }, { chapterIndex: 3 });
    expect(engine.crossfadeTo).toHaveBeenLastCalledWith('opp-quiet');
  });

  it('pushes ambient on quiz entry and pops on a plain exit', () => {
    ctl.syncToState({ screen: 'SUMMARY', missionId: 'apollo11' });
    ctl.syncToState({ screen: 'QUIZ', missionId: 'apollo11' });
    expect(engine.pushContext).toHaveBeenCalledWith('space-ambient');
    ctl.syncToState({ screen: 'SUMMARY', missionId: 'apollo11' });
    expect(engine.popContext).toHaveBeenCalledTimes(1);
    expect(engine.clearContext).not.toHaveBeenCalled();
  });

  it('clears context and crossfades when the quiz exit is a navigation', () => {
    ctl.syncToState({ screen: 'QUIZ', missionId: 'apollo11' });
    ctl.syncToState({ screen: 'ORBIT' }, { navigated: true });
    expect(engine.clearContext).toHaveBeenCalled();
    expect(engine.popContext).not.toHaveBeenCalled();
    expect(engine.crossfadeTo).toHaveBeenLastCalledWith('space-ambient');
  });
});

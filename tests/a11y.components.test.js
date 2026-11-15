// @vitest-environment jsdom
// Task 28.2: axe-core scans of every DOM-rendering UI module, plus keyboard checks.
// color-contrast is disabled (jsdom has no layout); contrast is covered by contrast.property.test.js.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axe from 'axe-core';
import missionsData from '../src/data/missions.json';
import { mount as mountOpening } from '../src/ui/openingOverlay.js';
import { mount as mountStory } from '../src/ui/storyColumn.js';
import { mount as mountSummary } from '../src/ui/summaryView.js';
import { mount as mountQuiz } from '../src/ui/quizDialog.js';
import { mount as mountClosing } from '../src/ui/closingScreen.js';
import { mount as mountControls } from '../src/ui/persistentControls.js';
import { mount as mountAudio } from '../src/audio/audioController.js';
import { mount as mountToast } from '../src/ui/toast.js';
import { showJourneyIntro, showMissionCard } from '../src/ui/transitionCards.js';
import { mountScrollProgress, mountJourneyIndicator } from '../src/ui/progressIndicators.js';
import { mount as mountFallback } from '../src/ui/webglFallback.js';

const missions = Array.isArray(missionsData) ? missionsData : missionsData.missions;
const mission = missions[0];

const mk = (id, correctIdx) => ({
  id,
  prompt: `Prompt ${id}`,
  choices: [0, 1, 2].map((i) => ({ id: `${id}-${i}`, text: `Choice ${id}-${i}`, correct: i === correctIdx })),
  explanation: `Because ${id}`,
});
const quiz = { missionId: 'm', questions: [mk('q1', 0), mk('q2', 1), mk('q3', 2)] };

const engine = () => {
  let muted = false;
  return {
    setMuted: (v) => { muted = !!v; }, isMuted: () => muted,
    crossfadeTo() {}, pushContext() {}, popContext() {}, clearContext() {},
  };
};

let root;
beforeEach(() => {
  // axe probes canvas for icon-ligature detection; jsdom logs "not implemented" otherwise.
  HTMLCanvasElement.prototype.getContext = () => null;
  document.body.innerHTML = '<main id="root"></main>';
  root = document.getElementById('root');
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => vi.useRealTimers());

async function scan(el) {
  const results = await axe.run(el, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary).toEqual([]);
}

const press = (el, key, opts = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));

describe('axe: zero violations per UI module', () => {
  it('openingOverlay', async () => { mountOpening(root, {}); await scan(root); });
  it('storyColumn', async () => { mountStory(root, { mission }); await scan(root); });
  it('summaryView (explore)', async () => {
    mountSummary(root, { mission, mode: 'EXPLORE' });
    await scan(root);
  });
  it('summaryView (journey)', async () => {
    mountSummary(root, { mission, mode: 'JOURNEY', journeyIndex: 0 });
    await scan(root);
  });
  it('quizDialog', async () => { mountQuiz(root, { quiz, returnFocusTo: null }); await scan(root); });
  it('closingScreen', async () => { mountClosing(root, { missions }); await scan(root); });
  it('persistentControls', async () => { mountControls(root, { mode: 'explore' }); await scan(root); });
  it('audioController', async () => { mountAudio(root, { engine: engine(), config: {} }); await scan(root); });
  it('toast', async () => { mountToast(root, { message: 'Hello', durationMs: 60000 }); await scan(root); });
  it('transitionCards', async () => {
    showJourneyIntro(root, { durationMs: 60000 });
    showMissionCard(root, mission, { durationMs: 60000 });
    await scan(root);
  });
  it('progressIndicators', async () => {
    const s = mountScrollProgress(root);
    s.update({ activeIndex: 1, chapterCount: 4, progress: 0.4 });
    const j = mountJourneyIndicator(root);
    j.update({ index: 1, name: mission.name });
    await scan(root);
  });
  it('webglFallback', async () => { mountFallback(root); await scan(root); });
});

describe('keyboard and focus', () => {
  it('quiz: Tab wraps both directions, Escape closes and returns focus to trigger', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open quiz';
    root.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { el } = mountQuiz(root, { quiz, returnFocusTo: trigger, onClose });
    const buttons = [...el.querySelectorAll('button')];
    buttons[buttons.length - 1].focus();
    press(el, 'Tab');
    expect(document.activeElement).toBe(buttons[0]);
    press(el, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    press(el, 'Escape');
    expect(el.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('quiz close button returns focus to trigger', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open quiz';
    root.appendChild(trigger);
    const { el } = mountQuiz(root, { quiz, returnFocusTo: trigger });
    el.querySelector('.quiz-dialog__close').click();
    expect(document.activeElement).toBe(trigger);
  });

  it('buttons are native, so Enter/Space activate them via click and are focusable', () => {
    const onQuiz = vi.fn();
    mountSummary(root, { mission, mode: 'EXPLORE', onOpenQuiz: onQuiz });
    const btn = root.querySelector('button[data-action="quiz"]');
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.tabIndex).toBeGreaterThanOrEqual(0);
    btn.focus();
    expect(document.activeElement).toBe(btn);
    btn.click(); // the browser maps Enter/Space on a native button to click
    expect(onQuiz).toHaveBeenCalledTimes(1);
  });

  it('every interactive element has no positive tabindex and non-button controls are keyboard operable', () => {
    mountOpening(root, {});
    mountSummary(root, { mission, mode: 'EXPLORE' });
    mountControls(root, { mode: 'explore' });
    for (const el of root.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    }
    expect(root.querySelectorAll('[onclick], div[role="button"]').length).toBe(0);
  });

  it('icon-only buttons carry aria-labels', () => {
    const quizView = mountQuiz(root, { quiz, returnFocusTo: null });
    expect(quizView.el.querySelector('.quiz-dialog__close').getAttribute('aria-label')).toBeTruthy();
    const audio = mountAudio(root, { engine: engine(), config: {} });
    expect(audio.button.getAttribute('aria-label')).toBe('Mute audio');
    audio.button.click();
    expect(audio.button.getAttribute('aria-label')).toBe('Unmute audio');
    expect(audio.button.getAttribute('aria-pressed')).toBe('true');
    for (const b of root.querySelectorAll('button')) {
      const name = (b.getAttribute('aria-label') || b.textContent || '').trim();
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('audio mute shortcut M toggles without a pointer', () => {
    const audio = mountAudio(root, { engine: engine(), config: {} });
    press(document, 'm');
    expect(audio.button.getAttribute('aria-pressed')).toBe('true');
  });

  it('toast does not take focus', () => {
    const b = document.createElement('button');
    root.appendChild(b);
    b.focus();
    const t = mountToast(root, {});
    t.show('Hi', { durationMs: 60000 });
    expect(document.activeElement).toBe(b);
  });
});

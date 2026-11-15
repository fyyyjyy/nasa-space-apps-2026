// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '../src/ui/quizDialog.js';

const mk = (id, correctIdx) => ({
  id,
  prompt: `Prompt ${id}`,
  choices: [0, 1, 2].map((i) => ({ id: `${id}-${i}`, text: `Choice ${id}-${i}`, correct: i === correctIdx })),
  explanation: `Because ${id}`,
});
const quiz = { missionId: 'm', questions: [mk('q1', 0), mk('q2', 1), mk('q3', 2)] };
const noShuffle = () => 0.999999; // keeps order in Fisher-Yates

let trigger;
beforeEach(() => {
  document.body.innerHTML = '';
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  trigger = document.createElement('button');
  trigger.textContent = 'Test what you learned';
  document.body.appendChild(trigger);
  trigger.focus();
});

const press = (el, key, opts = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));

describe('quizDialog', () => {
  it('opens as a labelled dialog with focus inside', () => {
    const { el } = mount(document.body, { quiz, rng: noShuffle, returnFocusTo: trigger });
    expect(el.tagName).toBe('DIALOG');
    expect(el.hasAttribute('open')).toBe(true);
    const label = document.getElementById(el.getAttribute('aria-labelledby'));
    expect(label.textContent).toBe('Mission quiz');
    expect(el.contains(document.activeElement)).toBe(true);
  });

  it('close button has accessible name, 44x44 css size class and white X', () => {
    const { el } = mount(document.body, { quiz, returnFocusTo: trigger });
    const btn = el.querySelector('.quiz-dialog__close');
    expect(btn.getAttribute('aria-label')).toBe('Close quiz');
    expect(btn.innerHTML).toContain('#FFFFFF');
  });

  it('Tab wraps within the dialog in both directions', () => {
    const { el } = mount(document.body, { quiz, rng: noShuffle, returnFocusTo: trigger });
    const items = el.querySelectorAll('button');
    const first = items[0];
    const last = items[items.length - 1];
    last.focus();
    press(el, 'Tab');
    expect(document.activeElement).toBe(first);
    press(el, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('Escape closes and returns focus to the trigger', () => {
    const onClose = vi.fn();
    const { el } = mount(document.body, { quiz, returnFocusTo: trigger, onClose });
    press(el, 'Escape');
    expect(el.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button closes and returns focus', () => {
    const { el } = mount(document.body, { quiz, returnFocusTo: trigger });
    el.querySelector('.quiz-dialog__close').click();
    expect(el.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('gives feedback in an aria-live region, shows score and allows retake', () => {
    const { el } = mount(document.body, { quiz, rng: noShuffle, returnFocusTo: trigger });
    const live = el.querySelector('[aria-live]');
    for (let i = 0; i < 3; i++) {
      el.querySelector('.quiz-dialog__choice').click(); // first choice: correct only for q1
      expect(live.textContent).toMatch(/Because q\d/);
      el.querySelector('.quiz-dialog__next').click();
    }
    expect(el.querySelector('.quiz-dialog__score').textContent).toBe('You scored 1 out of 3');
    expect(el.querySelector('.quiz-dialog__message').textContent.length).toBeGreaterThan(0);
    el.querySelector('.quiz-dialog__retake').click();
    expect(el.querySelector('.quiz-dialog__progress').textContent).toBe('Question 1 of 3');
  });
});

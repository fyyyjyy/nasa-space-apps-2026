// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import missions from '../src/data/missions.json';
import site from '../src/data/site.json';
import { showJourneyIntro, showMissionCard } from '../src/ui/transitionCards.js';

/** Validates: Requirements 10.2, 10.6 */
describe('transitionCards', () => {
  let parent;
  beforeEach(() => {
    vi.useFakeTimers();
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });
  afterEach(() => {
    vi.useRealTimers();
    parent.remove();
  });

  it('mission card shows name, hardware and year of the next mission and dismisses within 3 s', () => {
    for (const m of missions) {
      const onDone = vi.fn();
      const { el } = showMissionCard(parent, m, { durationMs: 10000, onDone });
      expect(el.textContent).toContain(m.name);
      expect(el.textContent).toContain(m.hardwareName);
      expect(el.textContent).toContain(String(m.year));
      vi.advanceTimersByTime(2999);
      expect(parent.contains(el)).toBe(true);
      vi.advanceTimersByTime(1);
      expect(parent.contains(el)).toBe(false);
      expect(onDone).toHaveBeenCalledTimes(1);
    }
  });

  it('intro card shows the 1967–2022 span and auto-dismisses by default within 3 s', () => {
    const { el } = showJourneyIntro(parent);
    expect(el.textContent).toContain(site.journeyIntro.span);
    vi.advanceTimersByTime(3000);
    expect(parent.contains(el)).toBe(false);
  });

  it('manual dismiss removes the card once and cancels the timer', () => {
    const onDone = vi.fn();
    const { el, dismiss } = showMissionCard(parent, missions[0], { onDone });
    dismiss();
    dismiss();
    vi.advanceTimersByTime(5000);
    expect(parent.contains(el)).toBe(false);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

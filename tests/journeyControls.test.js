import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount as mountControls } from '../src/ui/persistentControls.js';
import { mountJourneyIndicator } from '../src/ui/progressIndicators.js';
import { mount as mountSummary } from '../src/ui/summaryView.js';
import { journeyProgressLabel, JOURNEY_ORDER } from '../src/core/journeyPlan.js';
import missionsData from '../src/data/missions.json';

const missions = missionsData.missions ?? missionsData;

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('Journey controls (Req 10.9)', () => {
  it('shows Exit Journey and never Return to Space in journey mode', () => {
    const onExit = vi.fn();
    const c = mountControls(document.body, { mode: 'journey', onExitJourney: onExit });
    const visible = [...c.el.querySelectorAll('button')].filter((b) => !b.hidden);
    expect(visible.map((b) => b.textContent)).toEqual(['Exit Journey']);
    visible[0].click();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('never shows both buttons across mode changes', () => {
    const c = mountControls(document.body);
    for (const m of ['explore', 'journey', 'hidden', 'explore']) {
      c.setMode(m);
      const visible = [...c.el.querySelectorAll('button')].filter((b) => !b.hidden);
      expect(visible.length).toBe(m === 'hidden' ? 0 : 1);
    }
  });
});

describe('Journey indicator (Req 10.7)', () => {
  it('renders "Mission n of 6 · Name" for every mission', () => {
    const ind = mountJourneyIndicator(document.body);
    JOURNEY_ORDER.forEach((id, i) => {
      const name = missions.find((m) => m.id === id).name;
      ind.update({ index: i, name });
      expect(ind.el.textContent).toBe(`Mission ${i + 1} of 6 · ${name}`);
      expect(ind.el.textContent).toBe(journeyProgressLabel(i, missions));
    });
  });
});

describe('Journey summary buttons', () => {
  it('shows Continue for the first five and Finish for the last, no Return to Space', () => {
    JOURNEY_ORDER.forEach((id, i) => {
      document.body.innerHTML = '';
      const mission = missions.find((m) => m.id === id);
      const onContinue = vi.fn();
      const onFinish = vi.fn();
      const s = mountSummary(document.body, { mission, mode: 'JOURNEY', journeyIndex: i, onContinue, onFinish });
      const labels = [...s.el.querySelectorAll('button')].map((b) => b.textContent);
      expect(labels).not.toContain('Return to Space');
      const last = i === JOURNEY_ORDER.length - 1;
      expect(labels).toContain(last ? 'Finish the Journey' : 'Continue to Next Mission');
      s.el.querySelector(`[data-action="${last ? 'finish' : 'continue'}"]`).click();
      expect(last ? onFinish : onContinue).toHaveBeenCalledTimes(1);
    });
  });
});

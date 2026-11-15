import { describe, it, expect, vi } from 'vitest';
import missionsData from '../src/data/missions.json';
import site from '../src/data/site.json';
import { mount, closingModel } from '../src/ui/closingScreen.js';

const missions = Array.isArray(missionsData) ? missionsData : missionsData.missions;

describe('closingScreen', () => {
  it('lists all six missions with hardware and year, plus title and span', () => {
    const parent = document.createElement('div');
    const { el } = mount(parent, { missions });
    const items = el.querySelectorAll('.closing-screen__item');
    expect(items.length).toBe(6);
    missions.forEach((m, i) => {
      const t = items[i].textContent;
      expect(t).toContain(m.name);
      expect(t).toContain(m.hardwareName);
      expect(t).toContain(String(m.year));
    });
    expect(el.textContent).toContain('Silent Explorers');
    expect(el.textContent).toContain(site.journeyIntro.span);
    expect(closingModel(missions).rows).toHaveLength(6);
  });

  it('fires Explore on Your Own and cleans up on destroy', () => {
    const parent = document.createElement('div');
    const onExploreOnYourOwn = vi.fn();
    const onHoverSound = vi.fn();
    const view = mount(parent, { missions, onExploreOnYourOwn, onHoverSound });
    const btn = parent.querySelector('button');
    expect(btn.textContent).toBe('Explore on Your Own');
    btn.dispatchEvent(new Event('pointerenter'));
    btn.click();
    expect(onHoverSound).toHaveBeenCalledTimes(1);
    expect(onExploreOnYourOwn).toHaveBeenCalledTimes(1);
    view.destroy();
    expect(parent.children.length).toBe(0);
  });
});

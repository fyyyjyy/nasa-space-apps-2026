import { describe, it, expect, vi } from 'vitest';
import { computeViewOffset, applyViewOffset } from '../src/engine/sceneManager.js';

describe('sceneManager layout', () => {
  it('centres on the left half in split layout', () => {
    expect(computeViewOffset('split', 1000, 600)).toEqual({ x: 250, y: 0, width: 1000, height: 600 });
  });
  it('centres on the top 40% in stacked layout', () => {
    expect(computeViewOffset('stacked', 400, 800)).toEqual({ x: 0, y: 240, width: 400, height: 800 });
  });
  it('uses selectLayout breakpoint and clears when disabled', () => {
    const cam = { setViewOffset: vi.fn(), clearViewOffset: vi.fn() };
    applyViewOffset(cam, true, 767, 767, 800);
    expect(cam.setViewOffset).toHaveBeenLastCalledWith(767, 800, 0, 240, 767, 800);
    applyViewOffset(cam, true, 768, 768, 800);
    expect(cam.setViewOffset).toHaveBeenLastCalledWith(768, 800, 192, 0, 768, 800);
    applyViewOffset(cam, false, 768, 768, 800);
    expect(cam.clearViewOffset).toHaveBeenCalled();
  });
});

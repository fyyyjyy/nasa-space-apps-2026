import { describe, it, expect } from 'vitest';
import { openingPose, OPENING_MIN_X, OPENING_MAX_X } from '../src/core/openingPose.js';

describe('openingPose', () => {
  it('keeps the original pose in landscape', () => {
    expect(openingPose(16 / 9)).toEqual({ target: [0, 0, 0], position: [0, 0, 6] });
  });

  it.each([0.3, 0.46, 0.75, 0.99])('fits both bodies horizontally at aspect %f', (aspect) => {
    const { position } = openingPose(aspect, 45);
    const half = position[2] * Math.tan((45 * Math.PI) / 360) * aspect;
    expect(position[0] - half).toBeLessThan(OPENING_MIN_X);
    expect(position[0] + half).toBeGreaterThan(OPENING_MAX_X);
  });
});

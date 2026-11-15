import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PerspectiveCamera } from 'three';
import { generateStarPositions, countStarsPerQuadrant } from '../src/engine/starfield.js';

// Feature: nasa-space-apps-2026, Property 1: Starfield quadrant coverage
// **Validates: Requirements 1.1**

function initialCamera(aspect) {
  const camera = new PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);
  return camera;
}

describe('Property 1: Starfield quadrant coverage', () => {
  it('places at least 100 stars in every viewport quadrant for any seed and count >= 1000', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.integer({ min: 1000, max: 6000 }),
        fc.double({ min: 1, max: 2.4, noNaN: true }),
        (seed, count, aspect) => {
          const positions = generateStarPositions(count, seed);
          expect(positions.length).toBe(count * 3);
          const counts = countStarsPerQuadrant(positions, initialCamera(aspect));
          for (const n of counts) expect(n).toBeGreaterThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });
});

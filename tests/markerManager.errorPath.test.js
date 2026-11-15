// Unit test: marker error path. Validates: Requirements 3.6
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Object3D } from 'three';

const meshes = { moon: new Object3D(), mars: new Object3D() };
vi.mock('../src/engine/celestialBodies.js', () => ({
  getMesh: (id) => meshes[id] ?? null,
  getRadius: (id) => (meshes[id] ? 1 : null),
}));

const { createMarkers, disposeMarkers } = await import('../src/engine/markerManager.js');

const mk = (id, body, lat, lon) => ({
  id,
  name: id,
  locationName: 'Somewhere',
  body,
  landing: { lat, lon },
  tooltip: id,
  year: 1970,
  description: 'd',
});

describe('markerManager error path', () => {
  let errorSpy;
  beforeEach(() => {
    // jsdom has no 2D canvas; stub just enough for the glow texture.
    HTMLCanvasElement.prototype.getContext = () => ({
      createRadialGradient: () => ({ addColorStop() {} }),
      fillRect() {},
    });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    disposeMarkers();
    errorSpy.mockRestore();
  });

  it('uses a fallback sprite, logs an error and still creates the other five markers', () => {
    const missions = [
      mk('a', 'moon', 0.67, 23.47),
      mk('b', 'moon', Number.NaN, 10), // factory throws: invalid coordinates
      mk('c', 'moon', 20, -30),
      mk('d', 'mars', 22.27, -47.95),
      mk('e', 'mars', 10, 10),
      mk('f', 'mars', -5, 100),
    ];
    const result = createMarkers(missions, { camera: null });

    expect(result).toHaveLength(6);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0][0])).toContain('b');
    const fallbacks = result.filter((m) => m.fallback);
    expect(fallbacks.map((m) => m.id)).toEqual(['b']);
    expect(fallbacks[0].sprite.parent).toBe(meshes.moon);
    expect(result.filter((m) => !m.fallback)).toHaveLength(5);
  });
});

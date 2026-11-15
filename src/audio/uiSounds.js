// UI sound effects. Requirements 6.19, 10.1, 10.9.
//
// playHover() plays the short hover blip. It is a no-op until audio is unlocked
// by a user gesture and while muted. Errors never propagate to the caller.

import { audioEngine } from './audioEngine.js';

export const HOVER_EFFECT_ID = 'ui-hover';

/**
 * @param {object} [engine] audio engine (defaults to the shared instance)
 * @param {{ hoverId?: string }} [opts]
 */
export function createUiSounds(engine = audioEngine, opts = {}) {
  const hoverId = opts.hoverId || HOVER_EFFECT_ID;

  function playHover() {
    if (!engine || !engine.isUnlocked() || engine.isMuted()) return;
    try {
      const p = engine.playEffect(hoverId);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      // A failed hover sound must never break the UI.
    }
  }

  return { playHover };
}

const shared = createUiSounds();
export const playHover = shared.playHover;
export const uiSounds = shared;

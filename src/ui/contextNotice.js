import { showToast } from './toast.js';
import { STRINGS } from './strings.js';

// Largest delay setTimeout accepts; the notice stays until the context is restored.
const PERSISTENT_MS = 2 ** 31 - 1;

/**
 * Shows a non-blocking message while the WebGL context is lost and removes it when restored.
 * Safe to call repeatedly (design: Error Handling, "WebGL context lost at runtime").
 *
 * @param {{ show?: typeof showToast }} [deps]
 * @returns {{ onChange: (lost: boolean) => void }}
 */
export function createContextNotice({ show = showToast } = {}) {
  let handle = null;
  return {
    onChange(lost) {
      if (lost) {
        if (!handle) handle = show(STRINGS.toast.contextLost, { durationMs: PERSISTENT_MS });
      } else if (handle) {
        handle.dismiss();
        handle = null;
      }
    },
  };
}

import { STRINGS } from './strings.js';
import { chapterLabel } from '../core/scrollMath.js';
import '../styles/progress.css';

const clamp01 = (n) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * Scroll progress indicator: "Chapter n of N" plus a thin bar (summary not counted).
 * The text is announced politely and only rewritten when the chapter changes.
 *
 * @param {HTMLElement} parent
 * @returns {{ el: HTMLElement, update: (s: { activeIndex: number, chapterCount: number, progress: number }) => void, destroy: () => void }}
 */
export function mountScrollProgress(parent) {
  const doc = parent.ownerDocument;

  const el = doc.createElement('div');
  el.className = 'progress-indicator progress-indicator--scroll';

  const text = doc.createElement('p');
  text.className = 'progress-indicator__text';
  // Chapter changes are announced by the page live region (with the chapter title).

  const track = doc.createElement('div');
  track.className = 'progress-indicator__track';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', 'Story progress');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-valuenow', '0');

  const fill = doc.createElement('div');
  fill.className = 'progress-indicator__fill';
  track.appendChild(fill);

  el.append(text, track);
  parent.appendChild(el);

  let lastLabel = '';
  let lastPercent = -1;

  function update({ activeIndex, chapterCount, progress } = {}) {
    const { current, total } = chapterLabel(activeIndex, chapterCount);
    const label = total > 0 ? STRINGS.chapterLabel(current, total) : '';
    if (label !== lastLabel) {
      text.textContent = label;
      lastLabel = label;
    }
    const p = clamp01(progress);
    fill.style.transform = `scaleX(${p})`;
    const percent = Math.round(p * 100);
    if (percent !== lastPercent) {
      track.setAttribute('aria-valuenow', String(percent));
      lastPercent = percent;
    }
  }

  function destroy() {
    el.remove();
  }

  return { el, update, destroy };
}

/**
 * Journey indicator: "Mission n of 6 · Name" (index is zero-based).
 *
 * @param {HTMLElement} parent
 * @returns {{ el: HTMLElement, update: (s: { index: number, name: string }) => void, destroy: () => void }}
 */
export function mountJourneyIndicator(parent) {
  const doc = parent.ownerDocument;

  const el = doc.createElement('div');
  el.className = 'progress-indicator progress-indicator--journey';

  const text = doc.createElement('p');
  text.className = 'progress-indicator__text';
  text.setAttribute('aria-live', 'polite');
  text.setAttribute('aria-atomic', 'true');

  el.appendChild(text);
  parent.appendChild(el);

  let last = '';

  function update({ index, name } = {}) {
    const label = STRINGS.journeyProgress(index, name);
    if (label !== last) {
      text.textContent = label;
      last = label;
    }
  }

  function destroy() {
    el.remove();
  }

  return { el, update, destroy };
}

import site from '../data/site.json';
import STRINGS from './strings.js';
import '../styles/transition.css';

/** Requirement 10.6: a card is visible for no more than 3 seconds. */
export const MAX_CARD_MS = 3000;
const DEFAULT_CARD_MS = 2500;

function clampDuration(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_CARD_MS;
  return Math.min(n, MAX_CARD_MS);
}

function buildCard(doc, className, label) {
  const el = doc.createElement('div');
  el.className = `transition-card ${className}`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', label);
  return el;
}

function addLine(doc, el, tag, className, text) {
  const node = doc.createElement(tag);
  node.className = className;
  node.textContent = text;
  el.appendChild(node);
  return node;
}

function present(parent, el, durationMs, onDone) {
  parent.appendChild(el);
  let timer = null;
  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    el.remove();
    if (typeof onDone === 'function') onDone();
  };
  timer = setTimeout(dismiss, clampDuration(durationMs));
  return { el, dismiss };
}

/**
 * Journey intro card stating the span of the six missions (Requirement 10.2).
 * Never takes focus. Auto-dismisses in at most 3 s.
 *
 * @param {HTMLElement} parent
 * @param {{ durationMs?: number, onDone?: () => void }} [props]
 * @returns {{ el: HTMLElement, dismiss: () => void }}
 */
export function showJourneyIntro(parent, { durationMs, onDone } = {}) {
  const doc = parent.ownerDocument;
  const el = buildCard(doc, 'transition-card--intro', site.journeyIntro.text);
  addLine(doc, el, 'p', 'transition-card__span', site.journeyIntro.span);
  addLine(doc, el, 'p', 'transition-card__text', site.journeyIntro.text);
  return present(parent, el, durationMs, onDone);
}

/**
 * Per-mission transition card with name, hardware and year (Requirement 10.6).
 *
 * @param {HTMLElement} parent
 * @param {{ name: string, hardwareName: string, year: number|string }} mission
 * @param {{ durationMs?: number, onDone?: () => void }} [props]
 * @returns {{ el: HTMLElement, dismiss: () => void }}
 */
export function showMissionCard(parent, mission, { durationMs, onDone } = {}) {
  const doc = parent.ownerDocument;
  const el = buildCard(
    doc,
    'transition-card--mission',
    STRINGS.transitionCard(mission.name, mission.hardwareName, mission.year)
  );
  addLine(doc, el, 'p', 'transition-card__name', mission.name);
  addLine(doc, el, 'p', 'transition-card__hardware', mission.hardwareName);
  addLine(doc, el, 'p', 'transition-card__year', String(mission.year));
  return present(parent, el, durationMs, onDone);
}

export default { showJourneyIntro, showMissionCard, MAX_CARD_MS };

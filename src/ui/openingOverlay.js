import site from '../data/site.json';
import STRINGS from './strings.js';
import { createCreditsBlock } from './creditsBlock.js';
import '../styles/opening.css';

/**
 * Opening overlay: title, subtitle, Moon/Mars selection and the journey button.
 * Does not touch the state machine; callers pass hooks.
 *
 * @param {HTMLElement} parent
 * @param {{
 *   onSelectBody?: (bodyId: 'moon'|'mars') => void,
 *   onStartJourney?: () => void,
 *   onHoverSound?: () => void
 * }} [props]
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function mount(parent, props = {}) {
  const { onSelectBody, onStartJourney, onHoverSound } = props;
  const doc = parent.ownerDocument;

  const el = doc.createElement('section');
  el.className = 'opening-overlay';
  el.setAttribute('aria-label', site.title);

  const header = doc.createElement('div');
  header.className = 'opening-overlay__header';

  // Reuse the page's single h1 if present, otherwise create one.
  const existing = doc.getElementById('site-title');
  const h1 = existing || doc.createElement('h1');
  const restore = existing
    ? { parent: existing.parentNode, next: existing.nextSibling, className: existing.className }
    : null;
  h1.textContent = site.title;
  h1.classList.add('opening-overlay__title');
  header.appendChild(h1);

  const subtitle = doc.createElement('p');
  subtitle.className = 'opening-overlay__subtitle';
  subtitle.textContent = site.subtitle;
  header.appendChild(subtitle);
  el.appendChild(header);

  const bodies = doc.createElement('div');
  bodies.className = 'opening-overlay__bodies';
  bodies.setAttribute('role', 'group');
  bodies.setAttribute('aria-label', STRINGS.opening.bodiesGroupLabel);

  const listeners = [];
  const on = (target, type, fn) => {
    target.addEventListener(type, fn);
    listeners.push(() => target.removeEventListener(type, fn));
  };
  const hoverHook = (btn) => {
    const fire = () => onHoverSound && onHoverSound();
    on(btn, 'pointerenter', fire);
    on(btn, 'focus', fire);
  };

  for (const id of ['moon', 'mars']) {
    const body = site.bodies[id];
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-text';
    btn.dataset.body = id;
    btn.textContent = body.label;
    btn.setAttribute('aria-label', STRINGS.opening.selectBody(body.label));
    on(btn, 'click', () => onSelectBody && onSelectBody(id));
    hoverHook(btn);
    bodies.appendChild(btn);
  }
  el.appendChild(bodies);

  const footer = doc.createElement('div');
  footer.className = 'opening-overlay__footer';
  const journey = doc.createElement('button');
  journey.type = 'button';
  journey.className = 'btn-text';
  journey.textContent = site.journeyButtonLabel;
  on(journey, 'click', () => onStartJourney && onStartJourney());
  hoverHook(journey);
  footer.appendChild(journey);
  footer.appendChild(createCreditsBlock(doc));
  el.appendChild(footer);

  parent.appendChild(el);

  function destroy() {
    listeners.forEach((off) => off());
    listeners.length = 0;
    if (restore) {
      h1.classList.remove('opening-overlay__title');
      if (!h1.className) h1.removeAttribute('class');
      if (restore.parent) restore.parent.insertBefore(h1, restore.next);
    }
    el.remove();
  }

  return { el, destroy };
}

export default { mount };

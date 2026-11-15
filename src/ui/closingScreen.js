import site from '../data/site.json';
import STRINGS from './strings.js';
import { createCreditsBlock } from './creditsBlock.js';
import '../styles/closing.css';

/**
 * Pure model of the closing screen (Req 10.8).
 * @returns {{ title: string, span: string, heading: string,
 *   rows: {id: string, name: string, hardwareName: string, year: number}[],
 *   actionLabel: string }}
 */
export function closingModel(missions) {
  return {
    title: site.title,
    span: site.journeyIntro.span,
    heading: STRINGS.closing.heading,
    rows: missions.map((m) => ({
      id: m.id,
      name: m.name,
      hardwareName: m.hardwareName,
      year: m.year,
    })),
    actionLabel: site.closing.exploreOnYourOwnLabel,
  };
}

/**
 * @param {HTMLElement} parent
 * @param {{ missions: object[], onExploreOnYourOwn?: () => void, onHoverSound?: () => void }} props
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function mount(parent, props) {
  const { missions, onExploreOnYourOwn, onHoverSound } = props;
  const doc = parent.ownerDocument;
  const model = closingModel(missions);

  const el = doc.createElement('section');
  el.className = 'closing-screen';
  el.setAttribute('aria-label', model.heading);

  const add = (parentEl, tag, cls, text) => {
    const n = doc.createElement(tag);
    n.className = cls;
    n.textContent = text;
    parentEl.appendChild(n);
    return n;
  };

  const heading = add(el, 'h1', 'closing-screen__title', model.title);
  heading.tabIndex = -1; // programmatic focus target when the screen opens
  add(el, 'p', 'closing-screen__span', model.span);

  const list = doc.createElement('ul');
  list.className = 'closing-screen__list';
  for (const r of model.rows) {
    const li = doc.createElement('li');
    li.className = 'closing-screen__item';
    li.dataset.missionId = r.id;
    add(li, 'span', 'closing-screen__name', r.name);
    add(li, 'span', 'closing-screen__hardware', r.hardwareName);
    add(li, 'span', 'closing-screen__year', String(r.year));
    list.appendChild(li);
  }
  el.appendChild(list);

  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-text closing-screen__action';
  btn.dataset.action = 'explore';
  btn.textContent = model.actionLabel;
  const onClick = () => { if (onExploreOnYourOwn) onExploreOnYourOwn(); };
  const fire = () => { if (onHoverSound) onHoverSound(); };
  btn.addEventListener('click', onClick);
  btn.addEventListener('pointerenter', fire);
  btn.addEventListener('focus', fire);
  el.appendChild(btn);
  el.appendChild(createCreditsBlock(doc));

  parent.appendChild(el);

  function destroy() {
    btn.removeEventListener('click', onClick);
    btn.removeEventListener('pointerenter', fire);
    btn.removeEventListener('focus', fire);
    el.remove();
  }

  const focusHeading = () => heading.focus({ preventScroll: true });
  return { el, destroy, focusHeading };
}

export default { mount, closingModel };

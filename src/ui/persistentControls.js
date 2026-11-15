import '../styles/controls.css';
import STRINGS from './strings.js';

/**
 * Bottom-right persistent control. Shows "Return to Space" (mode 'explore')
 * or "Exit Journey" (mode 'journey'), never both. Mode 'hidden' shows neither.
 *
 * @param {HTMLElement} parent
 * @param {{
 *   mode?: 'hidden'|'explore'|'journey',
 *   onReturnToSpace?: () => void,
 *   onExitJourney?: () => void,
 *   onHover?: () => void
 * }} [props] onHover is the hover sound hook (fires on pointer enter and on focus).
 * @returns {{ el: HTMLElement, setMode: (mode: string) => void, getMode: () => string, destroy: () => void }}
 */
export function mount(parent, props = {}) {
  const doc = parent.ownerDocument;
  let handlers = props;
  let mode = 'hidden';

  const el = doc.createElement('div');
  el.className = 'persistent-controls';
  el.hidden = true;

  const makeButton = (label, key) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'persistent-controls__button';
    b.dataset.control = key;
    b.textContent = label;
    b.hidden = true;
    return b;
  };

  const returnBtn = makeButton(STRINGS.returnToSpace, 'return-to-space');
  const exitBtn = makeButton(STRINGS.exitJourney, 'exit-journey');
  el.append(returnBtn, exitBtn);

  const hover = () => {
    if (typeof handlers.onHover === 'function') handlers.onHover();
  };
  for (const b of [returnBtn, exitBtn]) {
    b.addEventListener('pointerenter', hover);
    b.addEventListener('focus', hover);
  }
  returnBtn.addEventListener('click', () => {
    if (typeof handlers.onReturnToSpace === 'function') handlers.onReturnToSpace();
  });
  exitBtn.addEventListener('click', () => {
    if (typeof handlers.onExitJourney === 'function') handlers.onExitJourney();
  });

  function setMode(next) {
    mode = next === 'explore' || next === 'journey' ? next : 'hidden';
    returnBtn.hidden = mode !== 'explore';
    exitBtn.hidden = mode !== 'journey';
    el.hidden = mode === 'hidden';
  }

  parent.appendChild(el);
  setMode(props.mode ?? 'hidden');

  return {
    el,
    setMode,
    getMode: () => mode,
    destroy: () => {
      handlers = {};
      el.remove();
    }
  };
}

export default { mount };

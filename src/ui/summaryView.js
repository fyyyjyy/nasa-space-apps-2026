import { STRINGS } from './strings.js';
import { continueLabel, FINISH_LABEL } from '../core/journeyPlan.js';
import '../styles/summary.css';

/**
 * Pure model of the summary: ordered fields, then actions.
 * Actions: optional quiz, then exactly one exit action.
 * Never includes "Return to Space" in JOURNEY mode.
 *
 * @returns {{ fields: {key: string, text: string}[], actions: {id: string, label: string}[] }}
 */
export function summaryModel({ mission, mode, journeyIndex, quizEnabled = true }) {
  const fields = [
    { key: 'name', text: mission.name },
    { key: 'hardwareName', text: mission.hardwareName },
    { key: 'dates', text: mission.dates },
    { key: 'finalStatus', text: mission.finalStatus },
  ];
  const actions = [];
  if (quizEnabled) actions.push({ id: 'quiz', label: STRINGS.testWhatYouLearned });
  if (mode === 'JOURNEY') {
    const label = continueLabel(journeyIndex);
    actions.push({
      id: label === FINISH_LABEL ? 'finish' : 'continue',
      label,
    });
  } else {
    actions.push({ id: 'return', label: STRINGS.returnToSpace });
  }
  return { fields, actions };
}

/**
 * @param {HTMLElement} parent
 * @param {{
 *   mission: object, mode: 'EXPLORE'|'JOURNEY', journeyIndex?: number,
 *   quizEnabled?: boolean, onOpenQuiz?: () => void, onReturnToSpace?: () => void,
 *   onContinue?: () => void, onFinish?: () => void, onHoverSound?: () => void
 * }} props
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function mount(parent, props) {
  const {
    mission, mode, journeyIndex, quizEnabled = true,
    onOpenQuiz, onReturnToSpace, onContinue, onFinish, onHoverSound,
  } = props;
  const doc = parent.ownerDocument;
  const model = summaryModel({ mission, mode, journeyIndex, quizEnabled });

  const el = doc.createElement('section');
  el.className = 'summary-view';
  el.setAttribute('aria-label', `${mission.name} summary`);

  const tags = { name: ['h2', 'title'], hardwareName: ['h3', 'hardware'], dates: ['p', 'dates'], finalStatus: ['p', 'status'] };
  for (const f of model.fields) {
    const [tag, cls] = tags[f.key];
    const node = doc.createElement(tag);
    node.className = `summary-view__${cls}`;
    node.textContent = f.text;
    el.appendChild(node);
  }

  const handlers = {
    quiz: onOpenQuiz,
    return: onReturnToSpace,
    continue: onContinue,
    finish: onFinish,
  };
  const actions = doc.createElement('div');
  actions.className = 'summary-view__actions';
  const listeners = [];
  const on = (target, type, fn) => {
    target.addEventListener(type, fn);
    listeners.push(() => target.removeEventListener(type, fn));
  };
  for (const a of model.actions) {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-text';
    btn.dataset.action = a.id;
    btn.textContent = a.label;
    on(btn, 'click', () => { const h = handlers[a.id]; if (h) h(); });
    const fire = () => onHoverSound && onHoverSound();
    on(btn, 'pointerenter', fire);
    on(btn, 'focus', fire);
    actions.appendChild(btn);
  }
  el.appendChild(actions);
  parent.appendChild(el);

  function destroy() {
    listeners.forEach((off) => off());
    listeners.length = 0;
    el.remove();
  }

  return { el, destroy };
}

export default { mount, summaryModel };

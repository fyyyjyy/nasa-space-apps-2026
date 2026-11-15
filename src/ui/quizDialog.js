import { STRINGS } from './strings.js';
import { buildQuizSession, scoreAnswer, scoreSession, QUIZ_TOTAL } from '../core/quizLogic.js';
import '../styles/dialog.css';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mounts and opens the quiz dialog. Intended to be loaded with a dynamic import.
 *
 * @param {HTMLElement} parent
 * @param {{
 *   quiz: { missionId: string, questions: object[] },
 *   rng?: () => number,
 *   returnFocusTo?: HTMLElement | null,
 *   onClose?: () => void
 * }} props
 * @returns {{ el: HTMLDialogElement, close: () => void, destroy: () => void }}
 */
export function mount(parent, props) {
  const { quiz, rng = Math.random, onClose } = props;
  const doc = parent.ownerDocument;
  const returnTarget = props.returnFocusTo || doc.activeElement;

  const dlg = doc.createElement('dialog');
  dlg.className = 'quiz-dialog';
  const titleId = `quiz-title-${Math.random().toString(36).slice(2, 8)}`;
  dlg.setAttribute('aria-labelledby', titleId);
  dlg.setAttribute('aria-modal', 'true');

  const closeBtn = doc.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'quiz-dialog__close';
  closeBtn.setAttribute('aria-label', STRINGS.quiz.closeLabel);
  closeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">' +
    '<path d="M5 5L19 19M19 5L5 19" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

  const title = doc.createElement('h2');
  title.id = titleId;
  title.className = 'quiz-dialog__title';
  title.textContent = STRINGS.quiz.dialogLabel;

  const body = doc.createElement('div');
  body.className = 'quiz-dialog__body';

  const live = doc.createElement('div');
  live.className = 'quiz-dialog__feedback';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('role', 'status');

  dlg.append(closeBtn, title, body, live);
  parent.appendChild(dlg);

  let session = null;
  let index = 0;
  let results = [];
  let closed = false;

  function focusFirst(el) {
    if (el) el.focus();
  }

  function startSession() {
    session = buildQuizSession(quiz, rng);
    index = 0;
    results = [];
    renderQuestion();
  }

  function renderQuestion() {
    const q = session.questions[index];
    body.replaceChildren();
    live.replaceChildren();

    const progress = doc.createElement('p');
    progress.className = 'quiz-dialog__progress';
    progress.textContent = STRINGS.quizProgress(index + 1, session.questions.length);

    const prompt = doc.createElement('p');
    prompt.className = 'quiz-dialog__prompt';
    prompt.textContent = q.prompt;

    const list = doc.createElement('div');
    list.className = 'quiz-dialog__choices';
    list.setAttribute('role', 'group');

    const buttons = q.choices.map((c) => {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'quiz-dialog__choice';
      b.dataset.choiceId = c.id;
      b.textContent = c.text;
      b.addEventListener('click', () => answer(q, c, b, buttons));
      list.appendChild(b);
      return b;
    });

    body.append(progress, prompt, list);
    focusFirst(buttons[0]);
  }

  function answer(q, choice, btn, buttons) {
    const res = scoreAnswer(q, choice.id);
    results.push(res);
    session.answers[q.id] = choice.id;
    buttons.forEach((b) => { b.disabled = true; });
    btn.classList.add(res.correct ? 'is-correct' : 'is-incorrect');
    const correctChoice = q.choices.find((c) => c.correct);
    const correctBtn = buttons.find((b) => b.dataset.choiceId === String(correctChoice && correctChoice.id));
    if (correctBtn) correctBtn.classList.add('is-correct');

    const verdict = doc.createElement('p');
    verdict.className = 'quiz-dialog__verdict';
    verdict.textContent = res.correct ? STRINGS.quiz.correct : STRINGS.quiz.incorrect;
    const expl = doc.createElement('p');
    expl.className = 'quiz-dialog__explanation';
    expl.textContent = res.explanation;
    live.replaceChildren(verdict, expl);

    const last = index >= session.questions.length - 1;
    const next = doc.createElement('button');
    next.type = 'button';
    next.className = 'btn-text quiz-dialog__next';
    next.textContent = last ? STRINGS.quiz.seeScore : STRINGS.quiz.next;
    next.addEventListener('click', () => {
      if (last) renderScore();
      else { index += 1; renderQuestion(); }
    });
    body.appendChild(next);
    next.focus();
  }

  function renderScore() {
    const { score, total, message } = scoreSession(results);
    body.replaceChildren();
    live.replaceChildren();

    const s = doc.createElement('p');
    s.className = 'quiz-dialog__score';
    s.textContent = STRINGS.quizScore(score, total || QUIZ_TOTAL);
    const m = doc.createElement('p');
    m.className = 'quiz-dialog__message';
    m.textContent = message;
    const retake = doc.createElement('button');
    retake.type = 'button';
    retake.className = 'btn-text quiz-dialog__retake';
    retake.textContent = STRINGS.quiz.retake;
    retake.addEventListener('click', startSession);
    body.append(s, m, retake);
    live.append(s.cloneNode(true));
    retake.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(dlg.querySelectorAll(FOCUSABLE));
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = doc.activeElement;
    if (e.shiftKey && (active === first || !dlg.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dlg.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  function close() {
    if (closed) return;
    closed = true;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close();
    else dlg.removeAttribute('open');
    if (returnTarget && typeof returnTarget.focus === 'function') returnTarget.focus();
    if (onClose) onClose();
  }

  function destroy() {
    closed = true;
    dlg.remove();
  }

  dlg.addEventListener('keydown', onKeydown);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  closeBtn.addEventListener('click', close);

  startSession();
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
  // showModal may move focus to the close button; place it on the first choice.
  const firstChoice = body.querySelector('button');
  if (firstChoice) firstChoice.focus();

  return { el: dlg, close, destroy };
}

export default { mount };

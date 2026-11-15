// Audio_Controller: persistent mute toggle plus state-driven track selection.
// Requirements 11.6, 11.7, 11.8, 11.12, 13.6.
//
// - The button lives outside the app screens so it is visible in every view.
// - aria-pressed is true while muted. The label is "Mute audio" (unmuted) or "Unmute audio" (muted).
// - `M` toggles mute from anywhere, including while the quiz dialog traps focus.
// - Default is unmuted (11.7). Only this control ever un-mutes the engine (11.8).

import '../styles/mute.css';
import { STRINGS } from '../ui/strings.js';
import { resolveTrack, AMBIENT_ID } from './audioEngine.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(doc, name, attrs) {
  const el = doc.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function buildIcon(doc) {
  const svg = svgEl(doc, 'svg', { viewBox: '0 0 24 24', class: 'audio-controller__icon', 'aria-hidden': 'true', focusable: 'false' });
  svg.appendChild(svgEl(doc, 'path', { d: 'M4 9v6h4l5 4V5L8 9z' }));
  const waves = svgEl(doc, 'g', { class: 'audio-controller__waves' });
  waves.appendChild(svgEl(doc, 'path', { d: 'M16 9a4 4 0 0 1 0 6' }));
  waves.appendChild(svgEl(doc, 'path', { d: 'M18.5 6.5a8 8 0 0 1 0 11' }));
  svg.appendChild(waves);
  svg.appendChild(svgEl(doc, 'path', { class: 'audio-controller__slash', d: 'M17 9l5 6M22 9l-5 6' }));
  return svg;
}

function isEditable(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true;
}

/**
 * @param {HTMLElement} parent element to append the control to (normally document.body)
 * @param {object} props
 * @param {object} props.engine audio engine (setMuted, isMuted, crossfadeTo, pushContext, popContext, clearContext)
 * @param {{ missions?: any, ambientId?: string }} [props.config] data for resolveTrack
 * @param {Document} [props.doc]
 * @param {Window|Document} [props.keyTarget] where the `M` shortcut listens
 * @param {(muted:boolean)=>void} [props.onChange]
 */
export function mount(parent, props = {}) {
  const { engine, config = {}, onChange } = props;
  const doc = props.doc || parent.ownerDocument || document;
  const keyTarget = props.keyTarget || doc;
  const ambientId = config.ambientId || AMBIENT_ID;

  const el = doc.createElement('div');
  el.className = 'audio-controller';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', STRINGS.audioGroupLabel);

  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'audio-controller__button';
  button.appendChild(buildIcon(doc));
  el.appendChild(button);
  parent.appendChild(el);

  function render() {
    const muted = engine.isMuted();
    button.setAttribute('aria-pressed', String(muted));
    button.setAttribute('aria-label', muted ? STRINGS.audio.unmute : STRINGS.audio.mute);
    button.title = muted ? STRINGS.audio.unmute : STRINGS.audio.mute;
  }

  function setMuted(value) {
    engine.setMuted(!!value);
    render();
    if (onChange) onChange(engine.isMuted());
  }

  const toggle = () => setMuted(!engine.isMuted());

  const onClick = () => toggle();
  const onKey = (e) => {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (isEditable(e.target)) return;
    e.preventDefault();
    toggle();
  };
  button.addEventListener('click', onClick);
  keyTarget.addEventListener('keydown', onKey);

  // ---- state-driven track selection -------------------------------------
  let inQuiz = false;

  /**
   * Call on every state or chapter change.
   * @param {{screen:string, missionId?:string}} state
   * @param {{ chapterIndex?: number, navigated?: boolean }} [opts]
   *   navigated: true when the change came from a navigation action
   *   (CONTINUE, FINISH_JOURNEY, RETURN_TO_SPACE, EXIT_JOURNEY), which discards the saved quiz context.
   * @returns {string} the track id the state maps to
   */
  function syncToState(state, opts = {}) {
    const { chapterIndex = 0, navigated = false } = opts;
    const target = resolveTrack(state, chapterIndex, config);
    const nowQuiz = !!state && state.screen === 'QUIZ';

    if (nowQuiz && !inQuiz) {
      inQuiz = true;
      engine.pushContext(ambientId);
    } else if (!nowQuiz && inQuiz) {
      inQuiz = false;
      if (navigated) {
        engine.clearContext();
        engine.crossfadeTo(target);
      } else {
        engine.popContext();
      }
    } else if (!nowQuiz) {
      if (navigated) engine.clearContext();
      engine.crossfadeTo(target);
    }
    return target;
  }

  function destroy() {
    button.removeEventListener('click', onClick);
    keyTarget.removeEventListener('keydown', onKey);
    el.remove();
  }

  render();
  return { el, button, toggle, setMuted, render, syncToState, destroy };
}

export default { mount };

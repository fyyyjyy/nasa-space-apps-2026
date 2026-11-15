import site from '../data/site.json';
import '../styles/webglFallback.css';

/**
 * Static message shown when WebGL is unavailable. Text comes from site.json.
 *
 * @param {HTMLElement} parent
 * @param {{ message?: string }} [props] optional override of the message
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function mount(parent, props = {}) {
  const doc = parent.ownerDocument;

  const el = doc.createElement('section');
  el.className = 'webgl-fallback';
  el.setAttribute('role', 'alert');

  const p = doc.createElement('p');
  p.className = 'webgl-fallback__message';
  p.textContent = props.message || site.webglFallbackMessage;
  el.appendChild(p);

  parent.appendChild(el);

  return {
    el,
    destroy() {
      el.remove();
    }
  };
}

export default { mount };

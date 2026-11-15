import '../styles/toast.css';

const REGION_CLASS = 'toast-region';

function getRegion(doc) {
  let region = doc.querySelector(`.${REGION_CLASS}`);
  if (!region) {
    region = doc.createElement('div');
    region.className = REGION_CLASS;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    doc.body.appendChild(region);
  }
  return region;
}

/**
 * Show a non-blocking, auto-dismissing message. Never takes focus.
 *
 * @param {string} message
 * @param {{ durationMs?: number, parent?: HTMLElement }} [options]
 * @returns {{ el: HTMLElement, dismiss: () => void }}
 */
export function showToast(message, { durationMs = 5000, parent } = {}) {
  const doc = parent ? parent.ownerDocument : document;
  const region = parent ? mountRegion(parent) : getRegion(doc);

  const el = doc.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  region.appendChild(el);

  let timer = null;
  const dismiss = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    el.remove();
  };
  timer = setTimeout(dismiss, durationMs);

  return { el, dismiss };
}

function mountRegion(parent) {
  const doc = parent.ownerDocument;
  let region = parent.querySelector(`:scope > .${REGION_CLASS}`);
  if (!region) {
    region = doc.createElement('div');
    region.className = REGION_CLASS;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    parent.appendChild(region);
  }
  return region;
}

/**
 * Project-style mount: creates the live region inside `parent`.
 * @param {HTMLElement} parent
 * @param {{ message?: string, durationMs?: number }} [props] shows a toast if message is given
 * @returns {{ el: HTMLElement, show: typeof showToast, destroy: () => void }}
 */
export function mount(parent, props = {}) {
  const el = mountRegion(parent);
  const show = (msg, opts = {}) => showToast(msg, { ...opts, parent });
  if (props.message) show(props.message, { durationMs: props.durationMs });
  return { el, show, destroy: () => el.remove() };
}

export default { showToast, mount };

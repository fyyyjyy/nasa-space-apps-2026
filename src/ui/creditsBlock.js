import credits from '../data/credits.json';
import '../styles/credits.css';

/**
 * Collapsible "Credits" block built from src/data/credits.json (CC BY attribution for the textures).
 * @param {Document} doc
 * @returns {HTMLDetailsElement}
 */
export function createCreditsBlock(doc) {
  const details = doc.createElement('details');
  details.className = 'credits';
  const summary = doc.createElement('summary');
  summary.className = 'credits__summary';
  summary.textContent = credits.label;
  details.appendChild(summary);
  for (const line of credits.lines) {
    const p = doc.createElement('p');
    p.className = 'credits__line';
    p.textContent = line.text;
    if (line.licenceUrl) {
      p.appendChild(doc.createTextNode(' '));
      const a = doc.createElement('a');
      a.href = line.licenceUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `Licence: ${line.licenceLabel}`;
      p.appendChild(a);
    }
    details.appendChild(p);
  }
  // Close (X) at the top right of the open credits.
  const close = doc.createElement('button');
  close.type = 'button';
  close.className = 'credits__close';
  close.setAttribute('aria-label', 'Close credits');
  close.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">' +
    '<path d="M5 5L19 19M19 5L5 19" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  close.addEventListener('click', () => {
    details.open = false;
    summary.focus();
  });
  details.appendChild(close);
  return details;
}

export default { createCreditsBlock };

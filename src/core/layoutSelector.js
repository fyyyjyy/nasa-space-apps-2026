/**
 * Layout selection from viewport width (Requirement 13.3).
 * Widths below the breakpoint use the stacked layout, others use the split layout.
 * CSS uses `@media (max-width: 767.98px)`, which matches this boundary.
 */
export const STACKED_BREAKPOINT_PX = 768;

/**
 * @param {number} viewportWidth width in CSS pixels
 * @returns {'stacked' | 'split'}
 */
export function selectLayout(viewportWidth) {
  return viewportWidth < STACKED_BREAKPOINT_PX ? 'stacked' : 'split';
}

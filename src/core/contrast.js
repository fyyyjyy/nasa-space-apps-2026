// WCAG 2.1 contrast helpers. Pure functions, no DOM.
// Colours are accepted as '#RGB', '#RRGGBB', or [r, g, b] with channels 0..255.

/** Parses a colour into [r, g, b] (0..255). */
export function parseColor(color) {
  if (Array.isArray(color)) {
    if (color.length < 3 || color.slice(0, 3).some((c) => !Number.isFinite(c))) {
      throw new Error('Invalid colour array');
    }
    return [color[0], color[1], color[2]];
  }
  if (typeof color !== 'string') throw new Error('Invalid colour');
  let hex = color.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.replace(/(.)/g, '$1$1');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Invalid colour: ${color}`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(color) {
  const [r, g, b] = parseColor(color).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, 1 to 21. Order of arguments does not matter. */
export function contrastRatio(colorA, colorB) {
  const a = relativeLuminance(colorA);
  const b = relativeLuminance(colorB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Composites a foreground colour with the given alpha over an opaque background.
 * Returns [r, g, b] (unrounded, 0..255).
 */
export function compositeOver(fg, alpha, bg) {
  const f = parseColor(fg);
  const b = parseColor(bg);
  return f.map((c, i) => alpha * c + (1 - alpha) * b[i]);
}

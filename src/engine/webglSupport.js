/**
 * Detects WebGL support by trying to create a webgl2 then a webgl context.
 * Never throws: any failure counts as "unavailable".
 *
 * @param {Document} [doc] defaults to the global document
 * @returns {boolean}
 */
export function isWebGLAvailable(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return false;
  try {
    const canvas = doc.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    // Release the probe context so it does not count against browser limits.
    const lose = gl.getExtension && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default { isWebGLAvailable };

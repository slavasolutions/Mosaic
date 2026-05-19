/**
 * Tiny formatting helpers used by the devtool UI.
 *
 * `prettyJson` is JSON.stringify with stable indent + a sane null/undefined
 * fallback so callers don't have to guard against the panel throwing on
 * weird input.
 */

export function prettyJson(value: unknown, indent = 2): string {
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value, null, indent);
  } catch (err) {
    return `[unserialisable: ${(err as Error).message}]`;
  }
}

/**
 * Format an HTML head fragment into a single-string preview. Returns the
 * fragment verbatim — modern browsers already preserve whitespace inside
 * `<head>` reasonably for inspection. We normalise the leading indent so
 * the preview reads top-aligned.
 */
export function formatHead(headHtml: string): string {
  return headHtml.replace(/^\s+|\s+$/g, '');
}

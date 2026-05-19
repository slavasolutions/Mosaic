/** Find the 1-based line number containing `index` in `content`. */
export function lineOf(content: string, index: number): number {
  if (index <= 0) return 1;
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
}

/** Return the line text containing `index`, trimmed and clipped to 200 chars. */
export function snippetFor(content: string, index: number): string {
  const start = content.lastIndexOf('\n', index - 1) + 1;
  let end = content.indexOf('\n', index);
  if (end === -1) end = content.length;
  return content.slice(start, end).trim().slice(0, 200);
}

/**
 * Lowercase-kebab slug from arbitrary text. Empty input -> "x".
 */
export function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return s || 'x';
}

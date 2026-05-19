/**
 * Markdown → HTML for Mosaic record bodies (Next.js).
 *
 * Mirrors the Astro adapter's helper — same pipeline, same sanitisation
 * defaults, same GFM support. Returns an HTML string suitable for a
 * React component's `dangerouslySetInnerHTML`.
 *
 * Pipeline: remark-parse → remark-gfm → remark-rehype → rehype-sanitize
 *           → rehype-stringify.
 *
 * Sync API on top of unified's sync processor. App Router server
 * components can call this freely at build time.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

export function renderBody(body: string | undefined | null): string {
  if (!body) return '';
  return String(processor.processSync(body));
}

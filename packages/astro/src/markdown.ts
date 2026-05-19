/**
 * Markdown → HTML for Mosaic record bodies.
 *
 * Adapters consume Mosaic records whose `body` is a markdown string. This
 * helper renders that string to a sanitised HTML fragment that can be
 * dropped into a template via Astro's `set:html`.
 *
 * Pipeline: remark-parse → remark-gfm → remark-rehype → rehype-sanitize
 *           → rehype-stringify.
 *
 * GFM is on, so tables, task lists and strikethrough are supported. The
 * sanitiser uses unified's defaults (rehype-sanitize) — no raw HTML or
 * scripts can survive a round-trip, even if a Mosaic record contains
 * untrusted content.
 *
 * Sync wrapper: unified's process is async, but the underlying parsers
 * are synchronous, so we expose a `renderBody` that uses `processSync`.
 * Astro server components are async-tolerant, but a sync API is simpler
 * to drop into a template expression.
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

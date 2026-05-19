/**
 * Render a Mosaic record body to a sanitised HTML fragment.
 *
 * Dispatches on the source-file extension (`bodyExt` on a Mosaic record):
 *
 *   - `md`    — remark-parse → remark-gfm → remark-rehype → rehype-sanitize
 *               → rehype-stringify. GFM (tables, task lists, strikethrough).
 *   - `html`  — rehype-parse (fragment) → rehype-sanitize → rehype-stringify.
 *               Pass-through with sanitisation; raw `<script>` / `<style>` /
 *               event handlers are stripped by rehype-sanitize defaults.
 *   - `txt`   — escaped + wrapped in `<pre>`. Whitespace preserved verbatim.
 *   - `adoc`  — not yet supported; throws.
 *   - default (unknown / missing ext) — falls back to the markdown pipeline,
 *               which is also the convention for sidecar-provided body
 *               literals (no source file → no extension).
 *
 * Output is HTML safe to drop into Astro's `set:html`.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeParse from 'rehype-parse';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

const htmlProcessor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSanitize)
  .use(rehypeStringify);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderBody(
  body: string | undefined | null,
  bodyExt?: string,
): string {
  if (!body) return '';
  const ext = (bodyExt ?? '').toLowerCase();
  switch (ext) {
    case 'html':
      return String(htmlProcessor.processSync(body));
    case 'txt':
      return `<pre>${escapeHtml(body)}</pre>`;
    case 'adoc':
      throw new Error(
        'mosaic-astro: AsciiDoc (.adoc) bodies are not yet supported.',
      );
    case '':
    case 'md':
    default:
      return String(markdownProcessor.processSync(body));
  }
}

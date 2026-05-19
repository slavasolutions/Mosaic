/**
 * Render a Mosaic record body to a sanitised HTML fragment (Next.js).
 *
 * Mirrors the Astro adapter — same dispatch on `bodyExt`, same pipelines,
 * same sanitisation defaults. See `packages/astro/src/markdown.ts` for the
 * full contract.
 *
 * Sync API on top of unified's sync processor. App Router server
 * components can call this freely at build time. Output is HTML suitable
 * for React's `dangerouslySetInnerHTML`.
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
        'mosaic-next: AsciiDoc (.adoc) bodies are not yet supported.',
      );
    case '':
    case 'md':
    default:
      return String(markdownProcessor.processSync(body));
  }
}

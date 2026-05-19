import * as cheerio from 'cheerio';
import type { Detector, Finding, Location, ScannedFile } from '../types.js';
import { lineOf, snippetFor } from '../util.js';

export const metaDetector: Detector = {
  category: 'meta-tags',
  title: 'Meta tags',
  run(files: ScannedFile[]): Finding[] {
    const findings: Finding[] = [];

    for (const f of files) {
      if (f.ext !== '.html' && f.ext !== '.htm') continue;
      let $: cheerio.CheerioAPI;
      try { $ = cheerio.load(f.content); } catch { continue; }

      const tags: Array<{ kind: string; key: string; value: string; snippet: string; line: number }> = [];

      $('head meta').each((_, el) => {
        const e = el as { type: string; attribs?: Record<string, string> };
        if (e.type !== 'tag') return;
        const attrs = e.attribs || {};
        let key: string;
        let value: string;
        if (attrs.name || attrs.property || attrs['http-equiv']) {
          key = attrs.name || attrs.property || attrs['http-equiv'] || '(unknown)';
          value = attrs.content || '';
        } else if (attrs.charset !== undefined) {
          key = 'charset';
          value = attrs.charset;
        } else {
          key = '(unknown)';
          value = '';
        }
        const raw = $.html(el);
        const idx = f.content.indexOf(raw);
        tags.push({
          kind: 'meta',
          key,
          value,
          snippet: snippetFor(f.content, idx >= 0 ? idx : 0),
          line: lineOf(f.content, idx >= 0 ? idx : 0),
        });
      });

      $('head link[rel]').each((_, el) => {
        const e = el as { type: string; attribs?: Record<string, string> };
        if (e.type !== 'tag') return;
        const attrs = e.attribs || {};
        const rel = attrs.rel || '';
        const href = attrs.href || '';
        const raw = $.html(el);
        const idx = f.content.indexOf(raw);
        tags.push({
          kind: 'link',
          key: `rel="${rel}"`,
          value: href,
          snippet: snippetFor(f.content, idx >= 0 ? idx : 0),
          line: lineOf(f.content, idx >= 0 ? idx : 0),
        });
      });

      if (tags.length === 0) continue;

      const locations: Location[] = tags.map((t) => ({
        file: f.relPath,
        line: t.line,
        snippet: `${t.kind} ${t.key}=${t.value}`,
      }));

      const ogCount = tags.filter((t) => t.key.startsWith('og:') || t.key.startsWith('twitter:')).length;
      const severity = ogCount > 0 ? 'medium' : 'low';

      findings.push({
        category: 'meta-tags',
        severity,
        finding: `Page \`${f.relPath}\` has ${tags.length} meta/link tags${ogCount ? ` (${ogCount} OG/Twitter)` : ''}.`,
        recommendation:
          `Migrate \`<head>\` meta into a record-level \`meta:\` block per mosaic-web §7. ` +
          `OG/Twitter values map onto the JSON-LD subset described in mosaic-web §6.`,
        locations,
      });
    }
    return findings;
  },
};

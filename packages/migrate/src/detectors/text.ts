import * as cheerio from 'cheerio';
import type { Detector, Finding, Location, ScannedFile } from '../types.js';
import { lineOf, slugify, snippetFor } from '../util.js';

const MIN_TEXT_LEN = 3;
const MIN_OCCURRENCES = 3;

/** Match JSX text nodes between tags. Cheap heuristic; flags >literal< between angle brackets. */
const JSX_TEXT_RE = />([^<>{}\n]{3,200})</g;

function collectHtmlText(file: ScannedFile, push: (text: string, idx: number) => void): void {
  const $ = cheerio.load(file.content);
  $('script, style, noscript').remove();
  $('*').each((_, el) => {
    const e = el as { type: string; children?: Array<{ type: string; data?: string }> };
    if (e.type !== 'tag') return;
    for (const child of e.children ?? []) {
      if (child.type !== 'text') continue;
      const raw = child.data || '';
      const text = raw.trim();
      if (text.length < MIN_TEXT_LEN) continue;
      const idx = file.content.indexOf(raw);
      push(text, idx >= 0 ? idx : 0);
    }
  });
}

function collectJsxText(file: ScannedFile, push: (text: string, idx: number) => void): void {
  for (const m of file.content.matchAll(JSX_TEXT_RE)) {
    const raw = (m[1] || '').trim();
    if (raw.length < MIN_TEXT_LEN) continue;
    // skip if the run is all whitespace, punctuation, or looks like a tag fragment
    if (!/[a-zA-Z]/.test(raw)) continue;
    push(raw, m.index ?? 0);
  }
}

export const textDetector: Detector = {
  category: 'repeated-text',
  title: 'Repeated text strings',
  run(files: ScannedFile[]): Finding[] {
    const grouped = new Map<string, Location[]>();

    for (const f of files) {
      const push = (text: string, idx: number): void => {
        const location: Location = {
          file: f.relPath,
          line: lineOf(f.content, idx),
          snippet: snippetFor(f.content, idx),
        };
        const arr = grouped.get(text);
        if (arr) arr.push(location);
        else grouped.set(text, [location]);
      };

      if (f.ext === '.html' || f.ext === '.htm') {
        try { collectHtmlText(f, push); } catch { /* malformed HTML — skip */ }
      } else if (f.ext === '.jsx' || f.ext === '.tsx' || f.ext === '.vue' || f.ext === '.svelte' || f.ext === '.astro') {
        collectJsxText(f, push);
      }
    }

    const findings: Finding[] = [];
    const sorted = [...grouped.entries()]
      .filter(([, locs]) => locs.length >= MIN_OCCURRENCES)
      .sort((a, b) => b[1].length - a[1].length);

    for (const [text, locations] of sorted) {
      const slug = slugify(text);
      findings.push({
        category: 'repeated-text',
        severity: locations.length >= 5 ? 'high' : 'medium',
        finding: `Text "${text}" repeats ${locations.length} times.`,
        recommendation:
          `Extract to a global record at \`/snippets/${slug}\` and replace each occurrence with a ref. ` +
          `One canonical string, edited once.`,
        locations,
      });
    }
    return findings;
  },
};

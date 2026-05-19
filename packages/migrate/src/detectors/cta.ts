import * as cheerio from 'cheerio';
import type { Detector, Finding, Location, ScannedFile } from '../types.js';
import { lineOf, slugify, snippetFor } from '../util.js';

const CTA_CLASS_RE = /\b(?:button|btn|cta|action)\b/i;
const ACTION_VERB_RE = /^(?:get|sign(?:\s+up)?|try|buy|contact|start|join|learn|book|order|subscribe|download|request)\b/i;

interface RawHit { text: string; line: number; snippet: string; }

function collectHtml(file: ScannedFile, hits: RawHit[]): void {
  let $: cheerio.CheerioAPI;
  try { $ = cheerio.load(file.content); } catch { return; }

  $('a, button').each((_, el) => {
    const e = el as { type: string; tagName?: string; name?: string; attribs?: Record<string, string> };
    if (e.type !== 'tag') return;
    const $el = $(el);
    const cls = (e.attribs?.class || '').trim();
    const text = $el.text().trim();
    if (!text) return;

    const tag = (e.tagName || e.name || '').toLowerCase();
    const matchesClass = CTA_CLASS_RE.test(cls);
    const matchesVerb = ACTION_VERB_RE.test(text);
    const isButton = tag === 'button';

    if (matchesClass || (isButton && matchesVerb) || (tag === 'a' && matchesVerb && cls)) {
      const raw = $.html(el);
      const idx = file.content.indexOf(raw);
      hits.push({
        text,
        line: lineOf(file.content, idx >= 0 ? idx : 0),
        snippet: snippetFor(file.content, idx >= 0 ? idx : 0),
      });
    }
  });
}

const JSX_CTA_RE = /<(?:a|button|Link|Button)\b[^>]*\bclass(?:Name)?\s*=\s*["']([^"']*)["'][^>]*>([^<]{1,80})<\/(?:a|button|Link|Button)>/gi;

function collectJsx(file: ScannedFile, hits: RawHit[]): void {
  for (const m of file.content.matchAll(JSX_CTA_RE)) {
    const cls = m[1] || '';
    const text = (m[2] || '').trim();
    if (!text) continue;
    if (!CTA_CLASS_RE.test(cls) && !ACTION_VERB_RE.test(text)) continue;
    const idx = m.index ?? 0;
    hits.push({
      text,
      line: lineOf(file.content, idx),
      snippet: snippetFor(file.content, idx),
    });
  }
}

export const ctaDetector: Detector = {
  category: 'cta-patterns',
  title: 'CTA / button patterns',
  run(files: ScannedFile[]): Finding[] {
    const grouped = new Map<string, Location[]>();
    for (const f of files) {
      const hits: RawHit[] = [];
      if (f.ext === '.html' || f.ext === '.htm') collectHtml(f, hits);
      else if (f.ext === '.jsx' || f.ext === '.tsx' || f.ext === '.astro' || f.ext === '.vue' || f.ext === '.svelte') collectJsx(f, hits);
      for (const h of hits) {
        const key = h.text.toLowerCase();
        const arr = grouped.get(key);
        const loc: Location = { file: f.relPath, line: h.line, snippet: h.snippet };
        if (arr) arr.push(loc);
        else grouped.set(key, [loc]);
      }
    }

    const findings: Finding[] = [];
    const sorted = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [text, locations] of sorted) {
      const slug = slugify(text);
      findings.push({
        category: 'cta-patterns',
        severity: locations.length >= 3 ? 'high' : 'medium',
        finding: `CTA "${text}" appears ${locations.length} time${locations.length === 1 ? '' : 's'}.`,
        recommendation:
          `Extract as block record \`/snippets/cta-${slug}\` with fields \`{ label, href, variant }\`. ` +
          `Compose via section refs (see ADR 0002).`,
        locations,
      });
    }
    return findings;
  },
};

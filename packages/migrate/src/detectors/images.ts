import type { Detector, Finding, Location, ScannedFile } from '../types.js';
import { lineOf, snippetFor } from '../util.js';

const SRC_RE = /\b(?:src|srcset|poster|data-src)\s*=\s*["']([^"']+)["']/gi;
const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
const OG_IMAGE_RE = /<meta[^>]+property\s*=\s*["'](?:og:image|twitter:image)["'][^>]+content\s*=\s*["']([^"']+)["']/gi;

const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?)(?:[?#]|$)/i;
const EXTERNAL_RE = /^(?:https?:)?\/\//i;

interface RawHit {
  url: string;
  line: number;
  snippet: string;
}

function pushHit(file: ScannedFile, urlRaw: string, idx: number, hits: RawHit[]): void {
  const url = urlRaw.trim();
  if (!url) return;
  if (url.startsWith('data:')) return;
  // For srcset, take the first URL only — keeps things simple for v1.
  const first = url.split(/[\s,]+/)[0] || '';
  if (!first) return;
  if (!IMAGE_EXT_RE.test(first) && !/og:image|twitter:image/.test(first)) return;
  hits.push({
    url: first,
    line: lineOf(file.content, idx),
    snippet: snippetFor(file.content, idx),
  });
}

export const imagesDetector: Detector = {
  category: 'image-urls',
  title: 'Image URLs',
  run(files: ScannedFile[]): Finding[] {
    const external: RawHit[] = [];
    const local: RawHit[] = [];

    const externalLocs = new Map<string, Location[]>();
    const localLocs = new Map<string, Location[]>();

    for (const f of files) {
      const ext = f.ext;
      const relevant =
        ext === '.html' || ext === '.htm' ||
        ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less' ||
        ext === '.jsx' || ext === '.tsx' || ext === '.vue' || ext === '.svelte' || ext === '.astro' ||
        ext === '.md' || ext === '.mdx';
      if (!relevant) continue;

      const hits: RawHit[] = [];
      for (const m of f.content.matchAll(SRC_RE)) {
        pushHit(f, m[1] || '', m.index ?? 0, hits);
      }
      for (const m of f.content.matchAll(CSS_URL_RE)) {
        pushHit(f, m[1] || '', m.index ?? 0, hits);
      }
      for (const m of f.content.matchAll(OG_IMAGE_RE)) {
        pushHit(f, m[1] || '', m.index ?? 0, hits);
      }

      for (const h of hits) {
        const isExternal = EXTERNAL_RE.test(h.url);
        const bucket = isExternal ? externalLocs : localLocs;
        const arr = bucket.get(h.url);
        const loc: Location = { file: f.relPath, line: h.line, snippet: h.snippet };
        if (arr) arr.push(loc);
        else bucket.set(h.url, [loc]);
        if (isExternal) external.push(h); else local.push(h);
      }
    }

    const findings: Finding[] = [];

    if (external.length > 0) {
      const locs = [...externalLocs.entries()].flatMap(([url, ls]) =>
        ls.map((l) => ({ ...l, snippet: `${url} — ${l.snippet}` })),
      );
      findings.push({
        category: 'image-urls',
        severity: 'low',
        finding: `${externalLocs.size} unique external image URLs across ${external.length} references.`,
        recommendation:
          `External URLs (R2/S3/CDN) can stay where they are — Mosaic records reference them by URL string. ` +
          `No migration needed unless you want a centralised registry.`,
        locations: locs,
      });
    }

    if (local.length > 0) {
      const locs = [...localLocs.entries()].flatMap(([url, ls]) =>
        ls.map((l) => ({ ...l, snippet: `${url} — ${l.snippet}` })),
      );
      findings.push({
        category: 'image-urls',
        severity: 'medium',
        finding: `${localLocs.size} unique local image references across ${local.length} occurrences.`,
        recommendation:
          `Per-image decision: (a) keep local in \`public/\`, (b) upload to a bucket and reference by URL, ` +
          `(c) embed as data URI for tiny inline assets. Mosaic does not mandate one — pick per use case.`,
        locations: locs,
      });
    }

    return findings;
  },
};

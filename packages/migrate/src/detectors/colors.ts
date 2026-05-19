import type { Detector, Finding, Location, ScannedFile } from '../types.js';
import { lineOf, snippetFor } from '../util.js';

const NAMED_COLORS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood',
  'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
  'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
  'darkgrey', 'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
  'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
  'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
  'ghostwhite', 'gold', 'goldenrod', 'gray', 'grey', 'green', 'greenyellow',
  'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
  'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgrey', 'lightgreen',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
  'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
  'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace',
  'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
  'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
  'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red',
  'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
  'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray',
  'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle',
  'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow',
  'yellowgreen',
]);

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_RE = /\brgba?\s*\(\s*[^)]+\)/gi;
const HSL_RE = /\bhsla?\s*\(\s*[^)]+\)/gi;
const NAMED_RE = /\b([a-z]{3,20})\b/gi;

/** Files we look at for color references. JSX/TSX get inline-style + className scanning. */
const RELEVANT_EXTS = new Set([
  '.css', '.scss', '.sass', '.less',
  '.jsx', '.tsx', '.html', '.htm',
  '.vue', '.svelte', '.astro', '.mdx',
]);

interface Hit {
  value: string;
  location: Location;
}

function normalizeColor(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

function collectFromContent(file: ScannedFile, hits: Hit[]): void {
  const c = file.content;

  for (const m of c.matchAll(HEX_RE)) {
    const idx = m.index ?? 0;
    hits.push({
      value: normalizeColor(m[0]),
      location: { file: file.relPath, line: lineOf(c, idx), snippet: snippetFor(c, idx) },
    });
  }

  for (const m of c.matchAll(RGB_RE)) {
    const idx = m.index ?? 0;
    hits.push({
      value: normalizeColor(m[0]),
      location: { file: file.relPath, line: lineOf(c, idx), snippet: snippetFor(c, idx) },
    });
  }

  for (const m of c.matchAll(HSL_RE)) {
    const idx = m.index ?? 0;
    hits.push({
      value: normalizeColor(m[0]),
      location: { file: file.relPath, line: lineOf(c, idx), snippet: snippetFor(c, idx) },
    });
  }

  // Named colors: only inside a color-ish context (css value, style="...", color:..., bg:...).
  // To keep false positives down, only flag named colors when adjacent to ':' or '=' in CSS-like contexts.
  const isCss = ['.css', '.scss', '.sass', '.less'].includes(file.ext);
  if (isCss) {
    for (const m of c.matchAll(NAMED_RE)) {
      const word = m[0].toLowerCase();
      if (!NAMED_COLORS.has(word)) continue;
      const idx = m.index ?? 0;
      // require a preceding colon on same line within 40 chars to look property-ish
      const before = c.slice(Math.max(0, idx - 40), idx);
      if (!/[:\s]/.test(before)) continue;
      if (!/:[^;{}\n]*$/.test(before)) continue;
      hits.push({
        value: word,
        location: { file: file.relPath, line: lineOf(c, idx), snippet: snippetFor(c, idx) },
      });
    }
  }
}

export const colorsDetector: Detector = {
  category: 'hardcoded-colors',
  title: 'Hardcoded colors',
  run(files: ScannedFile[]): Finding[] {
    const grouped = new Map<string, Location[]>();
    const hits: Hit[] = [];
    for (const f of files) {
      if (!RELEVANT_EXTS.has(f.ext)) continue;
      collectFromContent(f, hits);
    }
    for (const h of hits) {
      const arr = grouped.get(h.value);
      if (arr) arr.push(h.location);
      else grouped.set(h.value, [h.location]);
    }

    const findings: Finding[] = [];
    let swatchIndex = 1;
    const sorted = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [value, locations] of sorted) {
      const count = locations.length;
      const severity = count >= 5 ? 'high' : count >= 2 ? 'medium' : 'low';
      findings.push({
        category: 'hardcoded-colors',
        severity,
        finding: `Color \`${value}\` appears ${count} time${count === 1 ? '' : 's'}.`,
        recommendation:
          `Extract as token \`color.swatch-${swatchIndex}\` in \`tokens/index.json\` ` +
          `(rename the slug — \`swatch-${swatchIndex}\` is a placeholder).`,
        locations,
      });
      swatchIndex++;
    }
    return findings;
  },
};

import type { DetectorCategory, Finding, ScanResult } from './types.js';

const TITLES: Record<DetectorCategory, string> = {
  'hardcoded-colors': 'Hardcoded colors',
  'repeated-text': 'Repeated text strings',
  'meta-tags': 'Meta tags',
  'cta-patterns': 'CTA / button patterns',
  'image-urls': 'Image URLs',
};

const ORDER: DetectorCategory[] = [
  'hardcoded-colors',
  'repeated-text',
  'meta-tags',
  'cta-patterns',
  'image-urls',
];

function group(findings: Finding[]): Record<DetectorCategory, Finding[]> {
  const out = {
    'hardcoded-colors': [] as Finding[],
    'repeated-text': [] as Finding[],
    'meta-tags': [] as Finding[],
    'cta-patterns': [] as Finding[],
    'image-urls': [] as Finding[],
  };
  for (const f of findings) out[f.category].push(f);
  return out;
}

export function toMarkdown(result: ScanResult): string {
  const lines: string[] = [];
  lines.push('# Mosaic Migration Report');
  lines.push('');
  lines.push(`Scanned: ${result.fileCount} files in \`${result.root}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- ${result.detectorCount} detectors ran. ${result.findings.length} opportunities found.`);
  for (const cat of ORDER) {
    const count = result.perCategoryCount[cat] ?? 0;
    lines.push(`- ${TITLES[cat]}: ${count} finding${count === 1 ? '' : 's'}`);
  }
  lines.push('');
  lines.push('## Detailed findings');
  lines.push('');

  const grouped = group(result.findings);
  for (const cat of ORDER) {
    const items = grouped[cat];
    lines.push(`### ${TITLES[cat]}`);
    lines.push('');
    if (items.length === 0) {
      lines.push('_No findings._');
      lines.push('');
      continue;
    }
    for (const f of items) {
      lines.push(`- **[${f.severity}]** ${f.finding}`);
      lines.push(`  - Recommendation: ${f.recommendation}`);
      const sample = f.locations.slice(0, 5);
      for (const loc of sample) {
        lines.push(`  - \`${loc.file}:${loc.line}\` — \`${loc.snippet.replace(/`/g, "'")}\``);
      }
      if (f.locations.length > sample.length) {
        lines.push(`  - …and ${f.locations.length - sample.length} more.`);
      }
    }
    lines.push('');
  }

  lines.push('## Recommended next steps');
  lines.push('');
  const colorCount = result.perCategoryCount['hardcoded-colors'] ?? 0;
  const textCount = result.perCategoryCount['repeated-text'] ?? 0;
  const ctaCount = result.perCategoryCount['cta-patterns'] ?? 0;
  const metaCount = result.perCategoryCount['meta-tags'] ?? 0;
  const imgCount = result.perCategoryCount['image-urls'] ?? 0;
  let step = 1;
  if (colorCount > 0) lines.push(`${step++}. Create \`tokens/index.json\` with ${colorCount} color extraction${colorCount === 1 ? '' : 's'}; rename swatch slugs to semantic names.`);
  if (textCount > 0) lines.push(`${step++}. Create \`snippets/\` global records for the ${textCount} repeated string${textCount === 1 ? '' : 's'}; replace inline copies with refs.`);
  if (ctaCount > 0) lines.push(`${step++}. Extract ${ctaCount} CTA pattern${ctaCount === 1 ? '' : 's'} into \`snippets/cta-*\` block records; compose via section refs (ADR 0002).`);
  if (metaCount > 0) lines.push(`${step++}. Move \`<head>\` meta into per-record \`meta:\` blocks per mosaic-web §7.`);
  if (imgCount > 0) lines.push(`${step++}. Audit image URLs — external URLs are fine as-is; decide on a per-image basis for local ones.`);
  if (step === 1) lines.push('_No actionable findings — site is already lean, or scan target lacks Mosaic-extractable shapes._');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('_Heuristic scan. False positives possible — review each finding before extracting._');
  lines.push('');
  return lines.join('\n');
}

export function toJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

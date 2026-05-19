import { detectors as defaultDetectors } from './detectors/index.js';
import type { Detector, DetectorCategory, Finding, ScanResult } from './types.js';
import { walk } from './walk.js';

export interface ScanOptions {
  detectors?: Detector[];
}

const ALL_CATEGORIES: DetectorCategory[] = [
  'hardcoded-colors',
  'repeated-text',
  'meta-tags',
  'cta-patterns',
  'image-urls',
];

export async function scan(root: string, opts: ScanOptions = {}): Promise<ScanResult> {
  const detectors = opts.detectors ?? defaultDetectors;
  const files = await walk(root);

  const findings: Finding[] = [];
  for (const d of detectors) {
    findings.push(...d.run(files));
  }

  const perCategoryCount: Record<DetectorCategory, number> = {
    'hardcoded-colors': 0,
    'repeated-text': 0,
    'meta-tags': 0,
    'cta-patterns': 0,
    'image-urls': 0,
  };
  for (const f of findings) perCategoryCount[f.category]++;

  // ensure all known categories are present in the map even if zero
  for (const c of ALL_CATEGORIES) if (!(c in perCategoryCount)) perCategoryCount[c] = 0;

  return {
    root,
    fileCount: files.length,
    detectorCount: detectors.length,
    findings,
    perCategoryCount,
  };
}

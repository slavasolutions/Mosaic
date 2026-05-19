/**
 * Shared types for the migration scanner.
 *
 * A Finding is one opportunity to extract a Mosaic shape from an existing site.
 * A Location pinpoints where in the source that finding appears.
 */

export type DetectorCategory =
  | 'hardcoded-colors'
  | 'repeated-text'
  | 'meta-tags'
  | 'cta-patterns'
  | 'image-urls';

export type Severity = 'info' | 'low' | 'medium' | 'high';

export interface Location {
  file: string;
  line: number;
  snippet: string;
}

export interface Finding {
  category: DetectorCategory;
  severity: Severity;
  finding: string;
  recommendation: string;
  locations: Location[];
}

export interface ScannedFile {
  /** Path relative to the scan root. */
  relPath: string;
  /** Absolute path on disk. */
  absPath: string;
  /** UTF-8 content. */
  content: string;
  /** Lowercased extension including dot, e.g. ".tsx". Empty string if none. */
  ext: string;
}

export interface Detector {
  category: DetectorCategory;
  title: string;
  run(files: ScannedFile[]): Finding[];
}

export interface ScanResult {
  root: string;
  fileCount: number;
  detectorCount: number;
  findings: Finding[];
  perCategoryCount: Record<DetectorCategory, number>;
}

export { scan } from './scan.js';
export { toMarkdown, toJson } from './report.js';
export { detectors, colorsDetector, textDetector, metaDetector, ctaDetector, imagesDetector } from './detectors/index.js';
export type {
  Detector,
  DetectorCategory,
  Finding,
  Location,
  ScanResult,
  ScannedFile,
  Severity,
} from './types.js';

import type { Detector } from '../types.js';
import { colorsDetector } from './colors.js';
import { textDetector } from './text.js';
import { metaDetector } from './meta.js';
import { ctaDetector } from './cta.js';
import { imagesDetector } from './images.js';

export const detectors: Detector[] = [
  colorsDetector,
  textDetector,
  metaDetector,
  ctaDetector,
  imagesDetector,
];

export {
  colorsDetector,
  textDetector,
  metaDetector,
  ctaDetector,
  imagesDetector,
};

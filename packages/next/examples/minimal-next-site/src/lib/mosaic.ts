/**
 * Shared Mosaic accessor for the example site.
 *
 * Centralises the content path so the layout, the catch-all page, and any
 * future server component all read from the same root. All calls happen at
 * build time (App Router server components + static export).
 */

import { readMosaic } from '@ssolu/mosaic-next';
import type { MosaicEntry, MosaicResolution } from '@ssolu/mosaic-next';
import { join } from 'node:path';

// `MOSAIC_CONTENT_DIR` selects which content shape to render. The Pages
// workflow sets it per build slot (demo-single-next / demo-blog-next /
// demo-full-next). Default is content-blog so `next dev` works without
// env-var ceremony.
const CONTENT_DIR = process.env.MOSAIC_CONTENT_DIR ?? 'content-blog';
export const CONTENT_ROOT = join(
  process.cwd(),
  '..',
  '..',
  '..',
  '..',
  'examples',
  CONTENT_DIR,
);

let cached: Promise<MosaicResolution> | null = null;

export function getMosaic(): Promise<MosaicResolution> {
  if (!cached) cached = readMosaic(CONTENT_ROOT);
  return cached;
}

export type { MosaicEntry, MosaicResolution };

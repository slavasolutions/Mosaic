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

// Canonical content lives at `<repo>/examples/content/` — shared between
// the Astro twin and this Next site. `process.cwd()` during `next build`
// is this example's root (packages/next/examples/minimal-next-site/), so
// we hop up four levels to reach the repo root.
const CONTENT_ROOT = join(process.cwd(), '..', '..', '..', '..', 'examples', 'content');

let cached: Promise<MosaicResolution> | null = null;

/**
 * Read the Mosaic folder. Cached for the lifetime of the build process —
 * `next build` invokes server components many times across routes and we
 * don't want to walk the tree per route. Cache is process-scoped, so
 * `next dev` picks up file changes on each restart (good enough for a
 * demo; the astro adapter dogfoods FS watch in dev which we don't need
 * for the static export demo).
 */
export function getMosaic(): Promise<MosaicResolution> {
  if (!cached) cached = readMosaic(CONTENT_ROOT);
  return cached;
}

export type { MosaicEntry, MosaicResolution };

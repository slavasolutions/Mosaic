/**
 * `readMosaic` — single entry point.
 *
 * Thin wrapper over `@ssolu/mosaic-core`'s `readFolder`. Adds:
 *   - URL derivation per the Mosaic Web profile (when declared).
 *   - Split into `routedEntries` / `nonRouted` so Next pages can drive
 *     `generateStaticParams` from the right subset without re-filtering.
 *
 * Stays a pure read: no fs writes, no globals, safe to call from any
 * Server Component or build-time helper.
 */

import { resolve as pathResolve } from 'node:path';
import { readFolder } from '@ssolu/mosaic-core';
import { deriveUrl, getWebProfileRoot } from './url.js';
import type {
  MosaicEntry,
  MosaicManifest,
  MosaicResolution,
  ReadMosaicOptions,
  MosaicCoreReadResult,
} from './types.js';

/**
 * Read a Mosaic folder and resolve every record. Returns an object with
 * the full entry list plus pre-split route / non-route views.
 *
 * @param rootPath  Path to the Mosaic folder root. Relative paths are
 *                  resolved against `process.cwd()`. Absolute paths are
 *                  used as-is.
 * @param opts      See {@link ReadMosaicOptions}.
 */
export async function readMosaic(
  rootPath: string,
  opts: ReadMosaicOptions = {},
): Promise<MosaicResolution> {
  if (typeof rootPath !== 'string' || rootPath.length === 0) {
    throw new TypeError(
      'readMosaic: `rootPath` is required and must be a non-empty path string.',
    );
  }
  const includeNonRouteRecords = opts.includeNonRouteRecords ?? true;
  const absoluteRoot = pathResolve(process.cwd(), rootPath);

  // Pass-through cascading keys: 'theme' is the cascading field declared by
  // the design-tokens profile. Anything that wants cross-cutting cascade
  // should be added here too (e.g. a future layout profile).
  const result = (await readFolder(absoluteRoot, {
    cascadingKeys: ['theme'],
  } as any)) as MosaicCoreReadResult;
  const manifest = normaliseManifest(result.manifest);
  const profileRoot = getWebProfileRoot(manifest);

  const entries: MosaicEntry[] = [];
  const routedEntries: MosaicEntry[] = [];
  const nonRouted: MosaicEntry[] = [];

  for (const [identity, variantsOrRecord] of result.records) {
    // Skip the root collection record (identity ""); cascade source only,
    // never an entry consumers see.
    if (identity === '') continue;
    // Path A: mosaic-core returns Map<Identity, Record[]>; legacy test
    // stubs still hand back a single Record. Normalise both forms.
    const variants = Array.isArray(variantsOrRecord)
      ? variantsOrRecord
      : [variantsOrRecord];

    for (const record of variants) {
      const modifiers = Array.isArray(record.modifiers) ? record.modifiers : [];
      const isCanonical = modifiers.length === 0;

      // mosaic-core's Record.data is typed as Json; for our purposes the top
      // level is always an object (records are always merged with sidecar
      // shape) — assert structurally.
      const dataObj: Record<string, unknown> =
        record.data && typeof record.data === 'object' && !Array.isArray(record.data)
          ? (record.data as Record<string, unknown>)
          : {};

      // Only the canonical variant resolves to a route URL. Non-canonical
      // variants are surfaced as non-route data entries; a future locale
      // profile can promote them to localised URLs.
      const url =
        profileRoot && isCanonical ? deriveUrl(identity, profileRoot) : null;
      const isRouted = url !== null;

      if (!isRouted && !includeNonRouteRecords) continue;

      const entryId = isCanonical
        ? identity
        : `${identity}::${modifiers.join('.')}`;

      const entry: MosaicEntry = {
        id: entryId,
        slug: identity,
        data: dataObj,
        opaque: record.opaque ?? false,
        modifiers,
      };
      if (record.body !== undefined) entry.body = record.body;
      if (url !== null) entry.url = url;

      entries.push(entry);
      if (isRouted) routedEntries.push(entry);
      else nonRouted.push(entry);
    }
  }

  // Stable, identity-sorted output. Callers (e.g. generateStaticParams) get
  // deterministic ordering across builds without paying for a sort each
  // time.
  entries.sort((a, b) => a.id.localeCompare(b.id));
  routedEntries.sort((a, b) => a.id.localeCompare(b.id));
  nonRouted.sort((a, b) => a.id.localeCompare(b.id));

  return { entries, routedEntries, nonRouted, manifest };
}

/**
 * Accept either the raw manifest JSON or the `{ raw: ... }` wrapper
 * mosaic-core produces. Normalise to the raw object so downstream code
 * (helpers, URL derivation) sees a single shape.
 */
function normaliseManifest(
  m: MosaicCoreReadResult['manifest'] | undefined,
): MosaicManifest | null {
  if (!m) return null;
  if (typeof m !== 'object') return null;
  if ('raw' in m && m.raw && typeof m.raw === 'object') {
    return m.raw as MosaicManifest;
  }
  return m as MosaicManifest;
}

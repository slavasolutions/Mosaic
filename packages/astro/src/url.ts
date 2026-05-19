/**
 * Mosaic Web profile §3 — identity -> URL derivation.
 *
 * For every record whose identity is rooted within the configured `root`:
 *   1. Compute the record's identity per base §7.1.
 *   2. Strip the configured root prefix from the front of the identity.
 *   3. If the remaining segments end in `index`, strip the trailing
 *      `index` segment (collapsing to the folder URL).
 *   4. The resulting path, prefixed with `/`, is the record's URL.
 *
 * If a step leaves an empty path, the URL is `/`.
 *
 * mosaic-core is expected to already have collapsed file-form / folder-form
 * pairs (`about.json` vs `about/index.json`) to the same identity per base
 * §7.1 step 3. We do NOT re-collapse `index` here when it appears in the
 * identity itself — by spec the identity has already had trailing `/index`
 * stripped. The §3 step 3 collapse only applies when the configured root
 * IS the identity (yielding `/`). See {@link deriveUrl} comments below.
 */

import type { MosaicManifest } from './types.js';

/**
 * Resolve the Mosaic Web profile root from a manifest. Returns `null` when
 * the profile is not active in this folder (manifest absent, or no `web`
 * key under `profiles`).
 *
 * Per spec §2 both `profiles.web.root` and `profiles.mosaic-web.root` are
 * accepted and equivalent.
 */
export function getWebProfileRoot(manifest: MosaicManifest | undefined | null): string | null {
  if (!manifest || typeof manifest !== 'object') return null;
  // mosaic-core wraps the parsed JSON as { raw: {...} }; accept either the
  // wrapped form or the raw JSON directly so callers building a manifest
  // by hand also work.
  const root = (manifest as { raw?: unknown }).raw ?? manifest;
  if (!root || typeof root !== 'object') return null;
  const profiles = (root as { profiles?: unknown }).profiles;
  if (!profiles || typeof profiles !== 'object') return null;

  const profMap = profiles as Record<string, unknown>;
  const web = profMap.web ?? profMap['mosaic-web'];
  if (!web || typeof web !== 'object') return null;

  const webRoot = (web as { root?: unknown }).root;
  if (typeof webRoot !== 'string' || webRoot.length === 0) return null;

  // Normalise: strip leading/trailing slashes; spec says root is a path
  // relative to the Mosaic root.
  return webRoot.replace(/^\/+|\/+$/g, '');
}

/**
 * Split a path into segments, dropping empty entries from leading/trailing
 * or consecutive slashes.
 */
function segments(path: string): string[] {
  return path.split('/').filter((s) => s.length > 0);
}

/**
 * Derive the URL for a single identity per Mosaic Web §3. Returns `null`
 * when the identity sits outside the configured profile root (i.e. it's a
 * record but not a web route — non-route record per §4.3).
 *
 * @param identity  The record's Mosaic identity (already normalised by
 *                  mosaic-core per base §7.1 — no trailing `/index`).
 * @param profileRoot  The configured profile root from `mosaic.json`
 *                     (`profiles.web.root`), e.g. `"pages"`.
 */
export function deriveUrl(identity: string, profileRoot: string): string | null {
  const idSegs = segments(identity);
  const rootSegs = segments(profileRoot);

  // Identity must be rooted within profileRoot.
  if (rootSegs.length > idSegs.length) return null;
  for (let i = 0; i < rootSegs.length; i++) {
    if (idSegs[i] !== rootSegs[i]) return null;
  }

  // Strip the root prefix.
  const remaining = idSegs.slice(rootSegs.length);

  // §3 step 3: if the remaining segments end in `index`, strip it.
  //
  // In practice base §7.1 has already collapsed `pages/index.json` to
  // identity `pages` (the trailing `/index` is stripped). So `remaining`
  // here will be `[]` for the home page, which we then map to `/`.
  //
  // But a manifest could declare `root: "pages/index"` (degenerate), or a
  // future variant could leave an inner `index` in the identity; we apply
  // the step defensively anyway, exactly as spec §3 says.
  if (remaining.length > 0 && remaining[remaining.length - 1] === 'index') {
    remaining.pop();
  }

  if (remaining.length === 0) return '/';
  return '/' + remaining.join('/');
}

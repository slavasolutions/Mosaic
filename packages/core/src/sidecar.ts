/**
 * Sidecar merge per `01-format.md` §8.
 *
 * Rules:
 *   §8.1 — a `.json` whose base AND modifier set match a sibling content file
 *          is that file's sidecar.
 *   §8.2 — shallow top-level merge; sidecar wins on key collision.
 *   §8.3 — shallow at top level unless a profile says otherwise (we do shallow).
 *   §8.4 — modifier sidecar with no matching content sibling is a warning.
 */

import type { Json, JsonObject } from './types.js';

/**
 * Merge a sidecar object onto a content object, sidecar winning on collision.
 * Shallow at the top level (§8.2/§8.3). Returns a new object; inputs are not
 * mutated.
 */
export function mergeSidecar(
  content: JsonObject,
  sidecar: JsonObject,
): JsonObject {
  const out: JsonObject = {};
  for (const k of Object.keys(content)) out[k] = content[k] as Json;
  for (const k of Object.keys(sidecar)) out[k] = sidecar[k] as Json;
  return out;
}

/**
 * Two sets of modifiers are "the same modifier set" (§8.1) when sorted
 * equal — order on disk is not load-bearing for matching.
 */
export function modifiersEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const as = [...a].sort();
  const bs = [...b].sort();
  for (let i = 0; i < as.length; i++) {
    if (as[i] !== bs[i]) return false;
  }
  return true;
}

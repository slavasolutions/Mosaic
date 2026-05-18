/**
 * Cascade fill per `02-references.md` §12.
 *
 * §12.3 — opt-in only:
 *   1. A collection record MAY contain `defaults`.
 *   2. Cascade chain = ordered list of collection records, root → record's collection.
 *   3. Effective value = record's own value if present; else nearest defaults[key]
 *      walking UP the chain; else absent.
 *   4. Shallow / key-level only. NO deep merge. NO array concat. Present key
 *      on the record fully shadows ancestor defaults.
 *   5. Cascade applies to `locale` (base-blessed) and profile-declared keys ONLY.
 *   6. References (§11) resolve AFTER cascade.
 */

import type { Json, JsonObject } from './types.js';

/** The base-blessed cascading key (§12.3 clause 5). */
export const BASE_BLESSED_KEYS = ['locale'] as const;

/**
 * Apply cascade fill to a record's post-sidecar JSON.
 *
 * @param record         The record's content+sidecar JSON.
 * @param chain          Defaults objects walking root → record's parent collection.
 *                       (The record's OWN collection-record `defaults`, if the
 *                       record IS a collection record, MUST be excluded — a
 *                       collection record's defaults apply to descendants, not
 *                       to itself. Callers prepare this list.)
 * @param cascadingKeys  Profile-declared cascading keys (`locale` always added).
 */
export function applyCascade(
  record: JsonObject,
  chain: readonly JsonObject[],
  cascadingKeys: readonly string[],
): JsonObject {
  const blessed = new Set<string>([...BASE_BLESSED_KEYS, ...cascadingKeys]);
  const out: JsonObject = { ...record };

  for (const key of blessed) {
    if (Object.prototype.hasOwnProperty.call(out, key)) continue; // §12.3 clause 4
    // Walk UP the chain: nearest = deepest collection in the chain.
    // `chain` is ordered root → parent, so we iterate from end.
    for (let i = chain.length - 1; i >= 0; i--) {
      const defaults = chain[i]!;
      if (Object.prototype.hasOwnProperty.call(defaults, key)) {
        out[key] = defaults[key] as Json;
        break;
      }
    }
  }
  return out;
}

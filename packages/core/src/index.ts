/**
 * mosaic-core — reference Mosaic reader for Node.
 *
 * Implements §§5–12 of the Mosaic spec (mosaic-0.9.2/spec/format/).
 * Zero third-party runtime dependencies.
 */

export { readFolder, TEXT_BODY_EXTENSIONS } from './reader.js';
export { validate } from './validate.js';
export {
  parseRef,
  evaluatePointer,
  resolveIdentity,
  isRefString,
} from './refs.js';
export { applyCascade, BASE_BLESSED_KEYS } from './cascade.js';
export { mergeSidecar } from './sidecar.js';
export { identityOf, splitName, isHidden } from './identity.js';

import type { Record as MosaicRecord } from './types.js';

/**
 * Pick the "primary" variant from a variant array. Returns the canonical
 * variant (`modifiers.length === 0`) when present; otherwise returns the
 * first non-canonical variant per the reader's sort order. Returns
 * `undefined` for an empty array.
 *
 * Profiles/consumers that need locale- or modifier-aware selection should
 * roll their own picker; `getPrimary` exists for the common case of "give
 * me the canonical record".
 */
export function getPrimary(variants: MosaicRecord[]): MosaicRecord | undefined {
  if (!variants || variants.length === 0) return undefined;
  const canonical = variants.find((v) => v.modifiers.length === 0);
  if (canonical) return canonical;
  return variants[0];
}

export type {
  Json,
  JsonObject,
  Record,
  Collection,
  Identity,
  Manifest,
  RefValue,
  Resolution,
  ReadOptions,
  ValidationResult,
  ValidationMessage,
} from './types.js';

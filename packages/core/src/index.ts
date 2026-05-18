/**
 * mosaic-core — reference Mosaic reader for Node.
 *
 * Implements §§5–12 of the Mosaic spec (mosaic-0.9.2/spec/format/).
 * Zero third-party runtime dependencies.
 */

export { readFolder } from './reader.js';
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

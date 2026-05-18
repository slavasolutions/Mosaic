/**
 * Mosaic-core types.
 *
 * Names map to spec sections in `mosaic-0.9.2/spec/format/`:
 *   01-format.md §§5–9   — records, collections, identity, sidecars
 *   02-references.md §§11–12 — references, cascade
 */

/** Arbitrary JSON value (no third-party deps). */
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [k: string]: Json };

export type JsonObject = { [k: string]: Json };

/**
 * A resolved record's effective JSON, the output of the 4-step pipeline
 * defined in `02-references.md §12.5`.
 */
export interface Record {
  /** Identity per §7.1 (root collection record uses `""`). */
  identity: string;
  /** Effective JSON after content + sidecar + cascade + refs. */
  data: Json;
  /** Source file paths (relative to root) that contributed to this record. */
  sources: string[];
  /** True if the record's content file is non-`.json` (opaque, §5.2). */
  opaque: boolean;
}

/**
 * A collection is a directory (§6). The collection itself MAY have a record
 * via `index.*` (the collection record).
 */
export interface Collection {
  /** Identity of the collection's collection-record (or `""` for root). */
  identity: string;
  /** Member-record identities directly under this collection. */
  members: string[];
  /** Child collection identities. */
  children: string[];
  /** `defaults` object on the collection record, if any (§12.3). */
  defaults: JsonObject | null;
}

/** Internal: a record identity decomposed from a path. */
export interface Identity {
  /** Path-derived form-independent name (§7.1). */
  identity: string;
  /** True when the file is `index.*` (folder form). */
  folderForm: boolean;
  /** Base name (the first dot-segment). */
  base: string;
  /** Modifier list (the dot-segments between base and ext). */
  modifiers: string[];
  /** Final extension, without the dot. */
  ext: string;
}

/** Root manifest. The base spec leaves contents out of scope (§7.2). */
export interface Manifest {
  raw: JsonObject;
}

/** A parsed `ref:` value (§11.2). */
export interface RefValue {
  /** Identity portion (already trimmed of any `#…` pointer). */
  identity: string;
  /** Optional JSON Pointer (RFC 6901), without the leading `#`. */
  pointer: string | null;
  /** Whether the identity portion is absolute (`/…`) or relative (`./` `../`). */
  kind: 'absolute' | 'relative';
}

/**
 * Result of {@link readFolder}.
 *
 * `records` maps identity → resolved record. `manifest` is the root manifest
 * (`mosaic.json`) if present.
 */
export interface Resolution {
  rootPath: string;
  manifest: Manifest | null;
  records: globalThis.Map<string, Record>;
  collections: globalThis.Map<string, Collection>;
  warnings: ValidationMessage[];
}

export interface ValidationMessage {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  /** Identities discovered. Same shape as `validate.py`'s `records`. */
  records: globalThis.Map<string, string[]>;
}

export interface ReadOptions {
  /**
   * Profile-declared cascading keys. The base format only blesses `locale`
   * (§12.3 clause 5); any other cascading key MUST be passed here.
   */
  cascadingKeys?: string[];
  /**
   * Optional override of the root collection used as the cascade-chain origin.
   * Defaults to `rootPath`. Useful for profiles that scope content to a
   * sub-directory (e.g. the Web profile's `pages/`).
   */
  contentRoot?: string;
  /**
   * When `true`, dangling references are passed through verbatim instead of
   * being replaced with `null`. The format is silent on the rendering, only
   * mandating a warning (§11.6).
   */
  keepDangling?: boolean;
}

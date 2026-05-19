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
 *
 * A record represents a single (identity, modifier-set) variant. The
 * canonical variant has `modifiers.length === 0`; any other variant carries
 * one or more modifier segments (e.g. `["fr"]` for `about.fr.json`).
 * Variants of the same identity surface as separate records in the
 * resolution map keyed by identity (`Resolution.records: Map<Identity, Record[]>`).
 */
export interface Record {
  /** Identity per §7.1 (root collection record uses `""`). */
  identity: string;
  /**
   * The parsed modifier set for this variant (§7.1). Empty array marks the
   * canonical variant; otherwise the modifiers are sorted ascending and
   * unique. Sorting is normalisation only — `about.fr.json` and a
   * `about.fr.md` sidecar both produce `["fr"]` regardless of disk order.
   */
  modifiers: string[];
  /** Effective JSON after content + sidecar + cascade + refs. */
  data: Json;
  /** Source file paths (relative to root) that contributed to this record. */
  sources: string[];
  /** True if the record's content file is non-`.json` (opaque, §5.2). */
  opaque: boolean;
  /**
   * Raw bytes of the paired *text* content file (`.md`, `.txt`, `.html`,
   * `.adoc`), decoded as UTF-8. Absent when the record has no content
   * sibling, or when the sibling is binary (e.g. `.png`, `.pdf`).
   *
   * A JSON sidecar that carries its own `body` field literal overrides
   * the content file's bytes (sidecar wins, per §8 precedence).
   */
  body?: string;
  /**
   * The lower-case extension of the content file `body` was read from
   * (`"md"`, `"txt"`, `"html"`, `"adoc"`). Absent when `body` is absent
   * or when `body` came from a sidecar literal rather than a file (in
   * which case the source format is by convention markdown — adapters
   * that need stricter behaviour should require an explicit format
   * field on the sidecar JSON).
   *
   * Adapter renderers dispatch on this to pick the right pipeline
   * (markdown → remark, HTML → rehype-parse pass-through, etc.).
   */
  bodyExt?: string;
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
 * `records` maps identity → array of variant records (Path A — variants of
 * an identity are first-class). Each array entry is one (identity,
 * modifier-set) variant. The array is ordered: canonical variant first if
 * present (`modifiers.length === 0`), then non-canonical variants sorted
 * lexicographically by `modifiers.join('.')` ascending.
 *
 * `manifest` is the root manifest (`mosaic.json`) if present.
 */
export interface Resolution {
  rootPath: string;
  manifest: Manifest | null;
  records: globalThis.Map<string, Record[]>;
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

/**
 * Public types for mosaic-astro.
 *
 * The loader is a thin wrapper around mosaic-core. mosaic-core does the
 * actual reading, sidecar merge, cascade fill, and reference resolution per
 * the base format spec. This package only translates resolved records to
 * Astro's Content Layer shape and applies the Mosaic Web profile's
 * identity -> URL map.
 */

/**
 * Options accepted by {@link mosaicLoader}.
 */
export interface MosaicLoaderOptions {
  /**
   * Path to the Mosaic folder root, relative to the Astro project root or
   * absolute. The folder MUST be a conforming Mosaic folder (see
   * https://github.com/slavasolutions/mosaic for the base format).
   */
  root: string;

  /**
   * Optional: name of the Astro collection this loader is feeding. Used in
   * log lines only — Astro itself passes the collection name through
   * `LoaderContext` so we don't need it for behaviour.
   */
  name?: string;

  /**
   * If true, records outside the Mosaic Web profile root (the `pages/`
   * subtree by default) are emitted with no `url`. If false, they are
   * skipped entirely. Defaults to `true` so non-route records (e.g. data
   * referenced by routes) remain addressable.
   */
  includeNonRouteRecords?: boolean;
}

/**
 * An entry as we hand it to Astro's `store.set`. Astro accepts an open
 * object shape; these are the fields we actually populate.
 *
 * Path A: each (identity, modifier-set) variant becomes its own entry.
 * For the canonical variant, `id === slug === identity`. For non-canonical
 * variants, `id` is suffixed with `::<modifiers.join('.')>` so the store
 * keeps them addressable separately, while `slug` stays identity-only so
 * Layouts can group variants by identity.
 */
export interface MosaicEntry {
  /** Mosaic Astro store id — `<identity>` for canonical, `<identity>::<modkey>` otherwise. */
  id: string;
  /** Resolved JSON (post sidecar merge + cascade + refs) from mosaic-core. */
  data: Record<string, unknown>;
  /** Opaque content body, if any (e.g. the bytes of a `.md` file). */
  body?: string;
  /** Lower-case extension of the file that supplied `body` (e.g. `"md"`, `"html"`). */
  bodyExt?: string;
  /** Mosaic identity (always — no modifier suffix), doubles as the slug. */
  slug: string;
  /** Web profile URL — only set for the canonical variant under the profile root. */
  url?: string;
  /** Content digest for change detection — Astro consumes this. */
  digest?: string;
  /** Original file path the content came from, for the watcher's filterUpdate. */
  filePath?: string;
}

/**
 * Subset of the manifest shape we care about. mosaic-core returns the full
 * `mosaic.json`; we only read profile config.
 */
export interface MosaicManifest {
  mosaic?: string;
  profiles?: {
    web?: { root?: string };
    'mosaic-web'?: { root?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * The contract mosaic-astro consumes from mosaic-core. Kept local so the
 * loader compiles even if mosaic-core's published types drift slightly; we
 * structurally accept any module that exports a `readFolder` matching this.
 */
export interface MosaicCoreRecord {
  /** The resolved JSON for the record (sidecar merged + cascade + refs). */
  data: Record<string, unknown>;
  /** Opaque content bytes as a UTF-8 string, when the record has a non-JSON body. */
  body?: string;
  /** Lower-case extension of the file that supplied `body`. */
  bodyExt?: string;
  /** Absolute (or root-relative) path of the source file. Used for watch. */
  filePath?: string;
  /** Modifier-set for this variant; empty = canonical. */
  modifiers?: string[];
}

/**
 * `records` is a Map<Identity, Variant[]> in current mosaic-core (Path A).
 * The adapter also accepts a single-record value for backward compatibility
 * with older test stubs / loaders.
 */
export interface MosaicCoreReadResult {
  records: Map<string, MosaicCoreRecord[] | MosaicCoreRecord>;
  manifest: MosaicManifest;
}

export type MosaicCoreReadFolder = (
  rootPath: string,
  opts?: { cascadingKeys?: string[]; keepDangling?: boolean; contentRoot?: string },
) => Promise<MosaicCoreReadResult>;

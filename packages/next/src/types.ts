/**
 * Public types for mosaic-next.
 *
 * The helpers are thin wrappers around mosaic-core. mosaic-core does the
 * actual reading, sidecar merge, cascade fill, and reference resolution per
 * the base format spec. This package only translates resolved records into
 * a Next-friendly shape and applies the Mosaic Web profile's identity -> URL
 * map.
 */

/** A single resolved record exposed to a Next page. */
export interface MosaicEntry {
  /** Mosaic identity, e.g. `pages/about` or `team/ada`. Doubles as the id. */
  id: string;
  /** Mosaic identity also serves as the slug. */
  slug: string;
  /** Web profile URL, when the record sits under the configured profile root. */
  url?: string;
  /** Resolved JSON (post sidecar merge + cascade + refs) from mosaic-core. */
  data: Record<string, unknown>;
  /** Opaque content body, if any (e.g. the bytes of a `.md` file). */
  body?: string;
  /** True when the source file is non-JSON (an opaque payload). */
  opaque: boolean;
}

/** What {@link readMosaic} returns. */
export interface MosaicResolution {
  /** All records, route + non-route. */
  entries: MosaicEntry[];
  /** Just the records that resolved to a URL under the web profile root. */
  routedEntries: MosaicEntry[];
  /** Just the records that sit outside the web profile root (or no profile). */
  nonRouted: MosaicEntry[];
  /** The mosaic.json manifest object (raw), or null when absent. */
  manifest: MosaicManifest | null;
}

/**
 * Options accepted by {@link readMosaic} and the helpers built on top.
 */
export interface ReadMosaicOptions {
  /**
   * If true, records outside the Mosaic Web profile root are still emitted
   * in `entries` (and surfaced under `nonRouted`). If false, they are
   * omitted entirely. Defaults to `true` so non-route records (e.g. data
   * referenced by routes, banners, footers) remain addressable.
   */
  includeNonRouteRecords?: boolean;
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
 * The contract mosaic-next consumes from mosaic-core. Kept local so the
 * package builds even if mosaic-core's published types drift slightly; we
 * structurally accept any module that exports a `readFolder` matching this.
 */
export interface MosaicCoreRecord {
  /** The resolved JSON for the record (sidecar merged + cascade + refs). */
  data: Record<string, unknown>;
  /** Opaque content bytes as a UTF-8 string, when the record has a non-JSON body. */
  body?: string;
  /** Whether the underlying source is non-JSON (opaque). */
  opaque?: boolean;
}

export interface MosaicCoreReadResult {
  records: Map<string, MosaicCoreRecord>;
  manifest: MosaicManifest | { raw: MosaicManifest } | null;
}

export type MosaicCoreReadFolder = (
  rootPath: string,
) => Promise<MosaicCoreReadResult>;

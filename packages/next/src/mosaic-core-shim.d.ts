/**
 * Ambient declaration for `@ssolu/mosaic-core`.
 *
 * Structural fallback so `tsc -p tsconfig.json --noEmit` succeeds even when
 * the sibling workspace's published types are not yet on the resolution
 * path (e.g. typechecking in isolation). When the workspace symlink is in
 * place, mosaic-core's own `.d.ts` takes precedence over this fallback.
 */
declare module '@ssolu/mosaic-core' {
  export interface MosaicCoreRecord {
    data: Record<string, unknown>;
    body?: string;
    opaque?: boolean;
  }
  export interface MosaicManifest {
    mosaic?: string;
    profiles?: Record<string, unknown>;
    [key: string]: unknown;
  }
  export interface MosaicCoreReadResult {
    records: Map<string, MosaicCoreRecord>;
    manifest: MosaicManifest | { raw: MosaicManifest } | null;
  }
  export function readFolder(
    rootPath: string,
    opts?: { cascadingKeys?: string[]; keepDangling?: boolean; contentRoot?: string },
  ): Promise<MosaicCoreReadResult>;
}

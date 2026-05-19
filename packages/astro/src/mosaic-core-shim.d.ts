/**
 * Ambient declaration for `@ssolu/mosaic-core`.
 *
 * mosaic-core is a sibling package developed in parallel; while it is
 * pre-release we declare it as `file:../mosaic-core` in package.json. If
 * the sibling isn't installed (e.g. typechecking on its own), TypeScript
 * needs a structural fallback so this package still compiles.
 *
 * Once mosaic-core publishes to npm, its own `.d.ts` will take precedence
 * over this fallback automatically.
 */
declare module '@ssolu/mosaic-core' {
  export interface MosaicCoreRecord {
    data: Record<string, unknown>;
    body?: string;
    filePath?: string;
  }
  export interface MosaicManifest {
    mosaic?: string;
    profiles?: Record<string, unknown>;
    [key: string]: unknown;
  }
  export interface MosaicCoreReadResult {
    records: Map<string, MosaicCoreRecord>;
    manifest: MosaicManifest;
  }
  export function readFolder(rootPath: string): Promise<MosaicCoreReadResult>;
}

/**
 * Public adapter API.
 *
 * Imports allowed at subpath `@ssolu/mosaic-core/adapter`. Stable surface
 * for backend-adapter packages (S3, in-memory test fixtures, custom
 * editors) that supply their own source layer and want to run the same
 * §12.5 pipeline as `readFolder`.
 *
 * Public API consumers should NOT import from here — they only need
 * `@ssolu/mosaic-core`'s default export (`readFolder`, types, etc.).
 *
 * SemVer: this subpath is its own surface. Source-layer adapters depend
 * on the pipeline contract here; spec-only changes that don't touch the
 * pipeline shape are non-breaking. Changes to {@link PipelineInput} or
 * {@link FileEntry} are breaking for adapter packages.
 */

export { runPipeline, TEXT_BODY_EXTENSIONS } from './reader.js';
export type { FileEntry, PipelineInput } from './reader.js';
export { identityOf, isHidden, splitName, isValidNameToken } from './identity.js';
export type { SplitName } from './identity.js';

/**
 * Test stub for `@ssolu/mosaic-core` — installed via vitest's `alias` so the
 * unit tests can drive the helpers without bringing in the sibling package.
 *
 * Tests that need bespoke fixtures swap this out with `vi.mock(...)`. The
 * default export here is a safe no-op so imports don't explode.
 */

import type {
  MosaicCoreReadResult,
  MosaicCoreRecord,
} from '../../src/types.js';

export type { MosaicCoreReadResult, MosaicCoreRecord };

/**
 * Default stub: returns an empty result. Tests override per-call via
 * `vi.mocked(readFolder).mockResolvedValueOnce(...)`.
 */
export async function readFolder(_rootPath: string): Promise<MosaicCoreReadResult> {
  return {
    records: new Map(),
    manifest: null,
  };
}

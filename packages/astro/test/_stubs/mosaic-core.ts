/**
 * Test stub for `mosaic-core`.
 *
 * Aliased in `vitest.config.ts` so that the dynamic `import('mosaic-core')`
 * inside `src/loader.ts` resolves to this file during tests, regardless of
 * whether the sibling repo has been installed. Individual tests then
 * override `readFolder` via `vi.mock('mosaic-core', ...)`.
 *
 * In production, `mosaic-core` resolves to the real published / linked
 * package; this stub is never loaded.
 */

export const readFolder = async () => {
  throw new Error(
    'mosaic-core stub: readFolder() was called without being mocked. ' +
      'Tests must use vi.mock("mosaic-core", ...) before importing the loader.',
  );
};

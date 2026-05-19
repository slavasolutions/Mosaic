/**
 * Test stub for `@ssolu/mosaic-core`.
 *
 * Aliased in `vitest.config.ts` so that the dynamic `import('@ssolu/mosaic-core')`
 * inside `src/loader.ts` resolves to this file during tests, regardless of
 * whether the sibling repo has been installed. Individual tests then
 * override `readFolder` via `vi.mock('@ssolu/mosaic-core', ...)`.
 *
 * In production, `@ssolu/mosaic-core` resolves to the real published / linked
 * package; this stub is never loaded.
 */

export const readFolder = async () => {
  throw new Error(
    'mosaic-core stub: readFolder() was called without being mocked. ' +
      'Tests must use vi.mock("@ssolu/mosaic-core", ...) before importing the loader.',
  );
};

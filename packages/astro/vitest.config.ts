import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Resolve `mosaic-core` to a local stub during tests. This lets the
// loader's dynamic `import('mosaic-core')` succeed before vi.mock() takes
// over, even when the sibling repo isn't installed.
const mosaicCoreStub = fileURLToPath(
  new URL('./test/_stubs/mosaic-core.ts', import.meta.url),
);

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    alias: {
      'mosaic-core': mosaicCoreStub,
    },
  },
});

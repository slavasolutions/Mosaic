import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Resolve `@ssolu/mosaic-core` to a local stub during tests. Mirrors the
// astro adapter's strategy — lets the package's helpers be exercised even
// when the sibling isn't installed in this workspace's node_modules.
const mosaicCoreStub = fileURLToPath(
  new URL('./test/_stubs/mosaic-core.ts', import.meta.url),
);

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    alias: {
      '@ssolu/mosaic-core': mosaicCoreStub,
    },
  },
});

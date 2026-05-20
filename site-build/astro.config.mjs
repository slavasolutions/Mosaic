import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// site-build/ is the Astro project; its content lives one level up at /site/.
// We point publicDir at /site/images/ so brand assets ship to dist/ untouched.
const siteRoot = fileURLToPath(new URL('../site/', import.meta.url));

export default defineConfig({
  site: 'https://mosaic.ssolu.dev',
  trailingSlash: 'never',
  publicDir: siteRoot + 'images',
  output: 'static',
  build: {
    format: 'directory',
  },
});

import { defineConfig } from 'astro/config';

// When the GitHub Pages workflow sets GITHUB_PAGES_DEPLOY=1 the site is
// built for https://slavasolutions.github.io/mosaic/example/ — Astro
// needs both `site` and `base` so generated links resolve under the
// subpath. Local dev / preview ignores these and serves at '/'.
const isDeploy = process.env.GITHUB_PAGES_DEPLOY === '1';

export default defineConfig({
  site: isDeploy ? 'https://slavasolutions.github.io' : undefined,
  base: isDeploy ? '/mosaic/example' : undefined,
});

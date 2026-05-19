import { defineConfig } from 'astro/config';

// When the GitHub Pages workflow sets GITHUB_PAGES_DEPLOY=1 the site is
// built for https://slavasolutions.github.io/mosaic/<variant>/ — Astro
// needs both `site` and `base` so generated links resolve under the
// subpath. Local dev / preview ignores these and serves at '/'.
//
// `MOSAIC_VARIANT` selects which deploy slot this build targets:
//   astro          → /mosaic/astro/        (default theme, default content)
//   astro-dark     → /mosaic/astro-dark/   (dark theme, default content)
//   astro-minimal  → /mosaic/astro-minimal/(no tokens, minimal content)
const isDeploy = process.env.GITHUB_PAGES_DEPLOY === '1';
const variant = process.env.MOSAIC_VARIANT ?? 'astro';

export default defineConfig({
  site: isDeploy ? 'https://slavasolutions.github.io' : undefined,
  base: isDeploy ? `/mosaic/${variant}` : undefined,
});

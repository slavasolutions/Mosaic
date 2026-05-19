import { defineConfig } from 'astro/config';

// `MOSAIC_VARIANT` selects which deploy slot this build targets:
//   demo-single       → /mosaic/demo-single/        (1-page shape, Astro)
//   demo-blog         → /mosaic/demo-blog/          (blog shape, Astro)
//   demo-full         → /mosaic/demo-full/          (10+ page shape, Astro)
//
// When GITHUB_PAGES_DEPLOY=1 the Pages workflow sets both vars and the
// site builds under the matching subpath. Local dev / preview ignores
// these and serves at '/'.
const isDeploy = process.env.GITHUB_PAGES_DEPLOY === '1';
const variant = process.env.MOSAIC_VARIANT ?? 'demo-blog';

export default defineConfig({
  site: isDeploy ? 'https://slavasolutions.github.io' : undefined,
  base: isDeploy ? `/mosaic/${variant}` : undefined,
});

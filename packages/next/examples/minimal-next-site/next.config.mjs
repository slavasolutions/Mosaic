// `MOSAIC_VARIANT` selects which deploy slot this build targets:
//   demo-single-next  → /demo-single-next/   (1-page shape)
//   demo-blog-next    → /demo-blog-next/     (blog shape)
//   demo-full-next    → /demo-full-next/     (10+ page shape)
//
// When GITHUB_PAGES_DEPLOY=1 the Pages workflow sets both vars and the
// site builds under the matching subpath of mosaic.ssolu.dev. Local
// dev / preview ignores these and serves at '/'.
const isDeploy = process.env.GITHUB_PAGES_DEPLOY === '1';
const variant = process.env.MOSAIC_VARIANT ?? 'demo-blog-next';
const basePath = isDeploy ? `/${variant}` : '';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default config;

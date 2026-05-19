// When GITHUB_PAGES_DEPLOY=1 the GitHub Pages workflow builds for
// https://slavasolutions.github.io/mosaic/next-example/ — Next needs both
// `basePath` and `assetPrefix` for assets to resolve under the subpath.
// Local dev / preview ignores these and serves at '/'.
const isDeploy = process.env.GITHUB_PAGES_DEPLOY === '1';
const basePath = isDeploy ? '/mosaic/next-example' : '';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  // Trailing slash so each page emits as `<route>/index.html` — Pages serves
  // those cleanly without server-side rewrites.
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // Next's <Image> needs an external optimiser; static export disables it.
  images: { unoptimized: true },
  // Surface the base path to client code that needs to build hrefs.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default config;

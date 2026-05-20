# mosaic.ssolu.dev — site folder

This folder **is** the Mosaic marketing site. The site eats its own dogfood:
every page is a JSON record under `/pages/`, every reusable block is a record
under `/snippets/`, the brand tokens live in `/tokens/`, and the Astro adapter
in `packages/astro/` reads this folder and compiles it to static HTML.

## Layout

```
site/
  mosaic.json          manifest — locales, nav, brand
  pages/               one record per route
    index.json         home (/)
    spec.json          /spec
    explore.json       /explore
  snippets/            reusable blocks referenced by ref:/snippets/<name>
    hero-home.json
    three-rules.json
    journal-preview.json
  tokens/              design tokens — colours, type, spacing, radii
    index.json
  images/              binary assets — logo, hero art, favicons
  i18n/                locale overlays (empty until we add a second locale)
```

## Build

The marketing site builds via the Astro example adapter pointed at this folder:

```
MOSAIC_VARIANT=site GITHUB_PAGES_DEPLOY=0 \
  npx --workspace=packages/astro/examples/minimal-site astro build
```

Output lands in `site/dist/`. Cloudflare Pages picks that up.

## Deploy

Cloudflare Pages, custom domain `mosaic.ssolu.dev`. See `site/wrangler.toml`
for the deploy config.

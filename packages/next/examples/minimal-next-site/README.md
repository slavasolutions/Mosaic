# Mosaic — Next minimal example

A static Next.js (App Router) site whose content is a Mosaic folder.

The same `content/` folder powers the Astro twin at
`../../../astro/examples/minimal-site/`. Same records, same URLs, same
banner — different framework. The point of this directory is to make that
swap visible.

## Run locally

```bash
# from the repo root, once
npm install

# dev server
npm run dev --workspace=packages/next/examples/minimal-next-site

# static build → out/
npm run build --workspace=packages/next/examples/minimal-next-site
```

## Deploy

The repo's `pages.yml` workflow builds this site with `GITHUB_PAGES_DEPLOY=1`
and publishes the `out/` tree to `https://slavasolutions.github.io/mosaic/next-example/`.

## File layout

```
minimal-next-site/
├── content/         # Mosaic folder (the source of truth)
├── next.config.mjs  # output: 'export' + basePath for Pages
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx        # banner + footer (banner is a Mosaic record)
    │   └── [[...slug]]/
    │       └── page.tsx      # catch-all that renders any Mosaic page
    └── lib/mosaic.ts          # `getMosaic()` — cached `readMosaic` call
```

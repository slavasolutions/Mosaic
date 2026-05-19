# Mosaic — Next example site

A static Next.js (App Router) site whose content is a Mosaic folder. The same site code is built three times against three content shapes at the repo root.

The Astro twin lives at `../../../astro/examples/minimal-site/`. Same records, same URLs — different framework.

## Run locally

```bash
# from the repo root, once
npm install

# dev server (defaults to content-blog)
npm run dev --workspace=packages/next/examples/minimal-next-site

# render a different shape
MOSAIC_CONTENT_DIR=content-single npm run dev --workspace=packages/next/examples/minimal-next-site
MOSAIC_CONTENT_DIR=content-full   npm run dev --workspace=packages/next/examples/minimal-next-site

# static build → out/
npm run build --workspace=packages/next/examples/minimal-next-site
```

## Deploy

The repo's `pages.yml` workflow builds this site three times (once per shape) under `MOSAIC_VARIANT=demo-single-next` / `demo-blog-next` / `demo-full-next` and publishes the `out/` tree to:

- `https://mosaic.ssolu.dev/demo-single-next/`
- `https://mosaic.ssolu.dev/demo-blog-next/`
- `https://mosaic.ssolu.dev/demo-full-next/`

## File layout

```
minimal-next-site/
├── next.config.mjs         # output: 'export' + basePath for Pages
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx          # html shell + banner + footer + theme switcher
    │   └── [[...slug]]/
    │       └── page.tsx        # catch-all that renders any Mosaic record;
    │                           # header nav + locale switcher live here
    └── lib/mosaic.ts            # `getMosaic()` — cached `readMosaic` call
```

The content folder is selected at build time via `MOSAIC_CONTENT_DIR` (default `content-blog`) and read from `../../../../examples/<dir>/`.

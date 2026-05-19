# @ssolu/mosaic-astro — example site

An Astro site whose content is a Mosaic folder. The same site code is built three times against three content shapes — `content-single`, `content-blog`, `content-full` — at the repo root.

## Run

```sh
npm install

# Default — renders examples/content-blog/
npm run dev

# Render a different shape (single page, or twelve-plus pages)
MOSAIC_CONTENT_DIR=content-single npm run dev
MOSAIC_CONTENT_DIR=content-full   npm run dev
```

Then open whichever routes the shape ships:

| Shape | Routes |
|---|---|
| `content-single` | `/` only |
| `content-blog` | `/`, `/about`, `/blog`, `/blog/<post>`, plus `/legal` (HTML body fixture) |
| `content-full` | `/`, `/about`, `/services` + 4 sub-pages, `/team` + 3 person pages, `/blog` + 5 posts, `/contact` |

## Deploy

The repo's `pages.yml` workflow builds this site three times (once per shape) under `MOSAIC_VARIANT=demo-single` / `demo-blog` / `demo-full` and publishes to:

- `https://mosaic.ssolu.dev/demo-single/`
- `https://mosaic.ssolu.dev/demo-blog/`
- `https://mosaic.ssolu.dev/demo-full/`

## Chrome

Every page ships a locale switcher in the header (visible when the record has an `.fr` sibling) and a theme switcher in the footer (light / dark / system, persisted in `localStorage`). The adapter switcher (Astro ↔ Next) lives in the floating devtool, not in the page.

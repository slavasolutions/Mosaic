# ADR 0003 — Variant URL strategy: path prefix per variant

**Status:** Accepted (revised 2026-05-19)
**Date:** 2026-05-19

## Context

Mosaic deploys multiple renderings of the example content. The matrix
now ships six variants — three content shapes crossed with two
adapters:

- `/mosaic/demo-single/` — Astro adapter, `examples/content-single/`
- `/mosaic/demo-single-next/` — Next adapter, same shape
- `/mosaic/demo-blog/` — Astro adapter, `examples/content-blog/`
- `/mosaic/demo-blog-next/` — Next adapter, same shape
- `/mosaic/demo-full/` — Astro adapter, `examples/content-full/`
- `/mosaic/demo-full-next/` — Next adapter, same shape

A visitor on `/demo-blog/blog/hello/` should be able to switch to the
Next rendering of the same record, or jump to a different content
shape, with one click. The question is what the URL of that other
rendering looks like.

## Decision

**Each variant is its own static build at its own URL prefix.** The
prefix is the variant slot (`demo-single`, `demo-blog`, …); the path
after the prefix is the in-site route. The cross-variant switcher
lives in the `@ssolu/mosaic-devtool` Adapter tab (each page injects a
`<script id="mosaic-sites">` with the six slot URLs). The devtool
builds cross-variant links by swapping the prefix while preserving the
path:

```
/mosaic/demo-blog/blog/hello   ⇆   /mosaic/demo-blog-next/blog/hello
                                ⇆   /mosaic/demo-full/blog/hello
                                ⇆   /mosaic/demo-single/                 (404-tolerant)
```

No query parameter. No client-side routing — variants are byte-distinct
prerenders.

## Consequences

- **Builds stay static.** Each variant is `next build` or `astro build`
  with different env (`MOSAIC_VARIANT`, `MOSAIC_CONTENT_DIR`). No
  server, no edge worker, no client-side framework router required
  for variant switching.
- **Linkable variants.** Pasting `/mosaic/demo-full/services/repairs/`
  into chat survives the round-trip; the recipient sees the exact
  rendering immediately.
- **CI work scales linearly with variants.** Today: six builds in
  `pages.yml`. Each new shape × adapter cell is one more build step.
  Acceptable while builds stay under ~30 s each.
- **Path mismatches are not redirects.** A cross-variant link from
  `/demo-full/services/repairs/` to `/demo-single/` lands on the
  single page that exists there, not on the matching route (the
  single shape has no `/services/repairs/`). The Adapter tab in the
  devtool shows the variant root URLs only, not every route, so the
  user picks the destination explicitly.
- **Locale is in-deploy, not a separate deploy.** The French sidecar
  at `pages/about.fr.{json,md}` resolves inside any variant where the
  shape ships an `.fr` modifier. The header locale switcher toggles
  between EN and FR within the same deploy; the Adapter switcher in
  the devtool is orthogonal.
- **Chrome is universal.** Theme switch (footer) and locale switch
  (header) are part of the layout, not the variant slot. Both Astro
  and Next emit the same chrome from the same env-driven loader, so
  cross-adapter pages match pixel-for-pixel where the underlying HTML
  matches.

## Alternatives considered

- **(A) `?adapter=astro` query param** — one URL space, the variant
  decides via query. Rejected: needs either a server route handler
  (which GitHub Pages does not provide for free) or a client-side
  rehydration step. Couples every page to a router script.
- **(B) Single deploy, runtime JS selector** — ship one variant, let
  the visitor flip a button to swap shapes/adapters client-side.
  Rejected: a different product. The point of the matrix is that the
  variants are genuinely separate prerenders.
- **(C) On-page variant pill in the header** — what the prior version
  of this ADR specified. Rejected on revision because (a) the header
  is now load-bearing for the locale switch and was visually cluttered
  with six entries, and (b) moving the switcher into the devtool
  keeps the demo chrome representative of what a real Mosaic site
  ships (no adapter-debug UI on the home page).
- **(D) Path prefix per variant + devtool switcher (chosen)** —
  simplest static model; the switcher lives where switching is a
  debug/inspection concern rather than user-facing navigation.

## Cross-references

- `.github/workflows/pages.yml` — the CI step that produces one
  `_site/<variant>/` per build (six steps).
- `packages/devtool/src/sites.ts` — the default Adapter-switcher list
  (the six slot URLs).
- `packages/astro/examples/minimal-site/src/layouts/Layout.astro` and
  `packages/next/examples/minimal-next-site/src/app/layout.tsx` /
  `[[...slug]]/page.tsx` — emit `<script id="mosaic-sites">` so the
  devtool's Adapter tab reflects this deploy's six slots.
- `explore/index.html` — picker page that enumerates the deployed
  variants and links to each.
- `docs/adr/0002-block-composition.md` — earlier ADR; the section-ref
  pattern is orthogonal to URL variants but worth reading alongside.

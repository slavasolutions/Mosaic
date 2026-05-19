# ADR 0003 — Variant URL strategy: path prefix per variant

**Status:** Accepted
**Date:** 2026-05-19

## Context

Mosaic deploys multiple renderings of the same content. The matrix v1
deploy already ships four variants from one `examples/content/`
folder:

- `/mosaic/astro/` — Astro adapter, default theme
- `/mosaic/astro-dark/` — Astro adapter, dark-theme cascade
- `/mosaic/astro-minimal/` — Astro adapter, smaller content folder, no
  tokens
- `/mosaic/next/` — Next adapter, default theme

A visitor on `/astro/blog/hello/` should be able to switch to the
Next rendering of the same record, or to the dark-theme version, with
one click. The question is what the URL of that other rendering looks
like.

Two patterns were on the table.

## Decision

**Each variant is its own static build at its own URL prefix.** The
prefix is the variant slot (`astro`, `astro-dark`, `next`, …); the
path after the prefix is the in-site route. The on-page selector
(`packages/{astro,next}/examples/.../...`) builds cross-variant
links by swapping the prefix while preserving the path:

```
/mosaic/astro/blog/hello   ⇆   /mosaic/next/blog/hello
                            ⇆   /mosaic/astro-dark/blog/hello
                            ⇆   /mosaic/astro-minimal/note         (404-tolerant)
```

No query parameter — `?adapter=astro` is rejected. No client-side
routing — variants are byte-distinct prerenders.

## Consequences

- **Builds stay static.** Each variant is `next build` or `astro
  build` with different env (`MOSAIC_VARIANT`, `MOSAIC_CONTENT_DIR`,
  etc). No server, no edge worker, no client-side framework router
  required for variant switching.
- **Linkable variants.** Pasting `/mosaic/astro-dark/blog/hello`
  into chat survives the round-trip; the recipient sees the dark
  rendering immediately. A query-param scheme would have required
  client JS to read the param and either redirect or rehydrate.
- **CI work scales linearly with variants.** Today: four builds in
  `pages.yml`. Each new variant is one more build step. This is
  acceptable while builds stay under ~10 s each (current Astro: ~2 s,
  Next: ~20 s). When totals approach the GitHub Actions free tier
  budget (~6 hours/month) we revisit, not earlier.
- **Path mismatches are not redirects.** If `/mosaic/astro-minimal/`
  has no `/blog/hello/` (the minimal content folder has only three
  routes), the cross-variant link 404s. The on-page selector dims
  variants where the path is known not to exist; the variant card
  on `/explore/` lists the routes each variant ships. We chose not
  to add a fallback-to-home redirect because (a) it requires server
  rules under GitHub Pages's static host, and (b) a soft 404 hides
  the fact that the variants are genuinely different content sets.
- **No locale variant in v1.** Locale URLs are an in-deploy concern,
  not a separate deploy. The French sidecar at `pages/about.fr.json`
  resolves inside any variant; the variant selector is orthogonal to
  the locale modifier.
- **Selector UX is one anchor tag.** Swapping `/mosaic/<slot>/` is a
  string operation; no framework component needed. Both the Astro
  and Next layouts compute selector hrefs at build time so the
  rendered HTML is identical between adapters.

## Alternatives considered

- **(A) `?adapter=astro` query param** — one URL space, the variant
  decides via query. Rejected: needs either a server route handler
  (which GitHub Pages does not provide for free) or a client-side
  rehydration step (which contradicts the static-deploy story).
  Worse: it would couple every page to a "variant router" script,
  inflating page weight and adding a JS dependency to a section of
  the site that otherwise needs none.
- **(B) Single deploy, runtime JS selector** — ship one variant, let
  the visitor flip a button to swap themes/adapters client-side.
  Rejected: this is a different product. The point of the matrix is
  that the variants are genuinely separate prerenders; making them
  one site with a toggle would prove a less interesting thing.
- **(C) Path prefix per variant (chosen)** — the simplest model.
  Static builds, linkable URLs, no JS dependency for switching,
  straightforward CI matrix. Cost is N builds in the pipeline,
  which we are paying happily until the build budget tightens.

## Cross-references

- `.github/workflows/pages.yml` — the CI step that produces one
  `_site/<variant>/` per build.
- `packages/astro/examples/minimal-site/src/layouts/Layout.astro` and
  `packages/next/examples/minimal-next-site/src/app/[[...slug]]/page.tsx`
  — both render the cross-variant selector pill.
- `explore/index.html` — picker page that enumerates the deployed
  variants and links to each.
- `docs/adr/0002-block-composition.md` — earlier ADR; the section-ref
  pattern is orthogonal to URL variants but worth reading alongside
  when reasoning about how the same record renders in multiple
  contexts.

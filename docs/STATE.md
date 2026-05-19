# Mosaic — session state

Working notes for picking up between sessions. **Not normative — see `spec/` for the actual format.** Update when state changes; otherwise rot.

Last updated by this session: 2026-05-19 (matrix rebuild).

---

## What landed this session (2026-05-19, matrix rebuild)

A coordinated rework of the example deploys and the layout chrome. Most recent first.

- **Three content shapes** — replaced the prior single `examples/content/` (plus the placeholder `content-dark/` and `content-minimal/`) with three explicit shapes at the repo root:
  - `examples/content-single/` — one page, no tokens. The smallest viable Mosaic site.
  - `examples/content-blog/` — three pages + about.fr variant + tokens + four blog posts. The "real small site" middle.
  - `examples/content-full/` — twelve-plus pages with home, about (+fr), services (4 sub-pages), team (3 person records + 3 sidecar pages under `pages/team/`), blog (5 posts), contact. Nav + footer columns surfaced from the root collection record. Image URLs throughout (Unsplash).
- **Universal site chrome** — both adapter layouts (`packages/astro/examples/minimal-site/src/layouts/Layout.astro` and `packages/next/examples/minimal-next-site/src/app/layout.tsx`) now ship:
  - **Locale switcher** in the header, surfaced when the current record has an `.fr` sibling.
  - **Theme switcher** in the footer — light / dark / system, persists in `localStorage` under `mosaic-theme`, applied via `data-theme` attribute on `<html>`. Pre-paint bootstrap script avoids the flash; runtime script wires the buttons. CSS uses `html[data-theme="dark"]` / `html[data-theme="light"]` selectors to override the OS-preference fallback.
- **Adapter switcher elevated to devtool** — the cross-variant pill that used to sit in the header has been retired. Layouts inject `<script id="mosaic-sites">` with the six new slot URLs; the devtool's Adapter tab reads it. Tab was renamed from "Sites" to "Adapter" in `packages/devtool/src/mount.ts`. Default list in `packages/devtool/src/sites.ts` lists the six new slots. Bundle holds at 12,256 B (under the 12,288 B / 12 KB budget); one CSS hover rule trimmed to fit.
- **Deploy matrix is now 3 × 2 = 6 builds** — `.github/workflows/pages.yml` builds:
  - `examples/content-single/` × Astro → `_site/demo-single/`
  - `examples/content-single/` × Next → `_site/demo-single-next/`
  - `examples/content-blog/` × Astro → `_site/demo-blog/`
  - `examples/content-blog/` × Next → `_site/demo-blog-next/`
  - `examples/content-full/` × Astro → `_site/demo-full/`
  - `examples/content-full/` × Next → `_site/demo-full-next/`
- **`/explore/` picker rebuilt** — three sections (Single / Blog / Full), each with two cards (Astro + Next). Drops the dimmed `next-dark` and `vanilla` placeholder slots.
- **Tear-down** — `examples/content/`, `examples/content-dark/`, `examples/content-minimal/` all removed. Old deploy paths (`/astro/`, `/astro-dark/`, `/astro-minimal/`, `/next/`) no longer referenced. README CTA + root `index.html` CTAs point at `./explore/` instead of `/astro/`. ADR 0003 rewritten to reflect the new six-slot matrix + the chrome-vs-devtool split.

## Earlier in the same week (carryover from prior session)

- `@ssolu/mosaic-migrate` v1 — adoption-ramp scanner at `packages/migrate/`.
- `@ssolu/mosaic-validator-web` — client-side browser validator.
- Migration explainer — `spec/profiles/mosaic-web-migration.md`.
- ADR 0001 + ADR 0002 — body-format-agnosticism + block composition.
- Adapters dispatch on body extension (`.md` / `.html` / `.txt`).
- Body field codified in spec base format §5.2.
- Core reader extracts paired text bodies into `record.body`.
- `@ssolu/mosaic-devtool` package extracted from inline example layouts.
- mosaic-web §7 — HTML meta tags reserved field.
- SEO explainer — `spec/profiles/mosaic-web-seo.md`.
- License cleanup — Apache 2.0 (code) + CC BY 4.0 (spec) + `TRADEMARK.md`.

## Live URLs

| URL | What |
|---|---|
| https://slavasolutions.github.io/mosaic/ | Explainer (0.9.4, mobile-first, dark-mode) |
| https://slavasolutions.github.io/mosaic/explore/ | Six-deploy picker page (the matrix) |
| https://slavasolutions.github.io/mosaic/demo-single/ | Single shape, Astro adapter |
| https://slavasolutions.github.io/mosaic/demo-single-next/ | Single shape, Next adapter |
| https://slavasolutions.github.io/mosaic/demo-blog/ | Blog shape, Astro adapter |
| https://slavasolutions.github.io/mosaic/demo-blog-next/ | Blog shape, Next adapter |
| https://slavasolutions.github.io/mosaic/demo-full/ | Full shape, Astro adapter |
| https://slavasolutions.github.io/mosaic/demo-full-next/ | Full shape, Next adapter |

Devtool overlay (`@ssolu/mosaic-devtool`) loads on every demo route. Append `?nodebug=1` to hide. The Adapter tab inside the devtool jumps between the six deploys.

Header locale switcher appears on routes whose record has an `.fr` sibling (e.g. `/about` on the blog and full shapes). Footer theme switcher appears on every page.

## Test count

`npm test` from the monorepo root → **287 tests passing**:

| Package | Tests |
|---|---|
| `@ssolu/mosaic-astro` | 52 |
| `@ssolu/mosaic-core` | 92 |
| `@ssolu/mosaic-devtool` | 40 |
| `@ssolu/mosaic-migrate` | 18 |
| `@ssolu/mosaic-next` | 58 |
| `@ssolu/mosaic-s3` | 21 |
| `@ssolu/mosaic-validator-web` | 6 |

## Architecture decisions (the important ones)

| Decision | Choice |
|---|---|
| Spec layering | Base format + separate profiles (mosaic-web for routing, mosaic-design-tokens for visual values). |
| Tokens default storage | `tokens/` collection (file-level separation). |
| Variant model | `(identity, modifier-set)` is the matching key. |
| Body field | Base format §5.2 reserves `body`; recognised text extensions `{.md, .txt, .html, .adoc}`. See ADR 0001. |
| Block composition | Each block is its own record (conventionally under `/snippets/`). See ADR 0002. |
| External assets | Records reference images, videos, PDFs by URL. |
| npm scope | `@ssolu/*`. |
| Repo layout | One monorepo. |
| Branch strategy | Single main; pre-0.9.2 history preserved as tags. |
| Standalone renderer | Not building one. Adapters handle rendering. |
| Variant URL strategy | Path prefix per variant; six slots. Adapter switcher is in the devtool, not in the page header. See ADR 0003 (revised 2026-05-19). |
| Chrome philosophy | Theme + locale belong to the layout; adapter swap belongs to the devtool. |

## Queued — NOT done yet

### Surface-level
- **Re-tighten main branch protection** — untick "Allow force pushes" at https://github.com/slavasolutions/mosaic/settings/branches.

### Substantial work
- **Browser validator polish** — final integration into the live explainer (replacing the `_coming_` row).
- **Spec flatten** — merge `format/01-format.md` + `02-references.md` → single `format.md`. Flatten one-file subdirs.
- **`rationale.md`** — skeleton for the user's "I want to write the WHYs myself" doc.
- **Cross-folder design sharing** — the gallery vision still wants a decision on A (copy tokens), B (`mosaic.json#extends`), or C (cross-folder refs).

### Open questions to resolve next session
1. Cross-folder design sharing approach — A/B/C.
2. Should the gallery be its own Mosaic folder (dogfood) or a hand-rolled static page?
3. Render the spec text itself as a Mosaic site (deeper dogfood)?
4. Reserve `sections` as a normative field in mosaic-web once ADR 0002 pattern proves out.

## How to pick this up cleanly

```
cd /home/ms/active/mosaic
git pull
npm install
npm run build --workspace=packages/core
npm run build --workspace=packages/astro
npm run build --workspace=packages/next
npm test                                  # expect 287 passing

# Build any shape locally (default is content-blog):
GITHUB_PAGES_DEPLOY=1 MOSAIC_VARIANT=demo-blog MOSAIC_CONTENT_DIR=content-blog \
  npx --workspace=packages/astro/examples/minimal-site astro build

GITHUB_PAGES_DEPLOY=1 MOSAIC_VARIANT=demo-full-next MOSAIC_CONTENT_DIR=content-full \
  npx --workspace=packages/next/examples/minimal-next-site next build
```

The example sites read from whichever folder `MOSAIC_CONTENT_DIR` names under `examples/`. Each shape is self-contained — edit the records, both adapters pick up the change on next build.

The Pages workflow at `.github/workflows/pages.yml` produces all six deploys. The Astro example layout reads `nav` and `footer.columns` from the root collection record (`<shape>/index.json`); shapes without a nav field render the chrome without it (content-single).

## Branches on remote

Just `main`. Pre-0.9.2 history lives in git tags. No stale branches.

## Files to read first on next session

1. `README.md` — pitch + path map
2. `spec/README.md` — spec overview + two-layer model
3. `spec/format/01-format.md` — base spec
4. `spec/format/02-references.md` — refs + cascade
5. `spec/profiles/mosaic-web.md` — web profile
6. `spec/profiles/mosaic-design-tokens.md` — tokens profile
7. `docs/adr/0001-body-format-agnosticism.md` + `docs/adr/0002-block-composition.md` + `docs/adr/0003-variant-url-strategy.md`
8. `examples/content-single/`, `examples/content-blog/`, `examples/content-full/` — the three demo folders
9. `packages/astro/examples/minimal-site/src/layouts/Layout.astro` + `packages/next/examples/minimal-next-site/src/app/layout.tsx` — the shared chrome (theme + locale)
10. `packages/devtool/src/sites.ts` — the Adapter-switcher default list
11. **This file (STATE.md)** — session continuity

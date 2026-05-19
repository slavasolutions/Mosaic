# Mosaic — session state

Working notes for picking up between sessions. **Not normative — see `spec/` for the actual format.** Update when state changes; otherwise rot.

Last updated by this session: 2026-05-19.
Main HEAD when written: `af0cd03` (plus #16/#17/#19 from the same session — bump on next refresh).

---

## What landed this large session (2026-05-19, multi-teammate)

A coordinated push across spec, core, adapters, devtool, examples, migration tooling, and ADRs. Most recent first.

- **`@ssolu/mosaic-migrate` v1** — adoption-ramp scanner at `packages/migrate/`. CLI `mosaic-migrate scan <path>`. Five detectors (hardcoded colours, repeated strings, meta tags, CTAs, image URLs). Read-only; outputs a markdown + JSON report. Self-contained, no `@ssolu/mosaic-core` dep.
- **`@ssolu/mosaic-validator-web`** — client-side browser validator at `packages/validator-web/`. Drag a folder onto the live explainer, runs validate against §§5–9 in-browser. Replaces the `_coming_` placeholder in the README validate table. Tests for render + mount.
- **Migration explainer** — `spec/profiles/mosaic-web-migration.md` (non-normative). HTML bodies, R2/S3 assets, block composition, tokens, snippets, scanner pointer, explicit non-goals.
- **ADR 0001 + ADR 0002** — `docs/adr/0001-body-format-agnosticism.md` records the format-agnostic position on `body`. `docs/adr/0002-block-composition.md` codifies the canonical pattern: each block is a record, page holds `sections: [ref:/snippets/...]` ordered array. Cross-linked from spec.
- **Adapters dispatch on body extension** — `.md` through markdown processor, `.html` through rehype-sanitize pass-through, `.txt` through escape-and-wrap. Both Astro and Next render parity. New HTML body fixture at `examples/content/pages/legal.{json,html}` (note: nav-visibility for `legal` may need wire-up if examples-dev didn't add it).
- **Markdown renderer wired into both adapters** — remark + rehype-sanitize, real markdown (no more lorem-ipsum-only-via-`body`-passthrough). Astro + Next test fixtures for markdown rendering.
- **Body field codified in spec** — base format §5.2 reserves `body`; binary content skips body; `TEXT_BODY_EXTENSIONS = {.md, .txt, .html, .adoc}` (exported from `@ssolu/mosaic-core`). §8.1 — sidecar literal wins over file bytes. §1.2 pipeline diagram now includes the body step.
- **Core reader extracts paired text bodies** — `record.body` is now populated by the reader pipeline. Pass 2 reads UTF-8 by extension. Variants pair body per `(identity, modifier-set)`. New `F-bodies` test fixture in core (+9 tests).
- **`@ssolu/mosaic-devtool` package** — extracted the inline JSON disclosure from example layouts into a standalone bundle. Both example sites now load the same devtool via a `?debug=1` URL gate. −304 net lines across the two example sites; +43 in the shared package.
- **Example content deduplicated** — single canonical `examples/content/` at the repo root. Astro reads via `mosaicLoader({ root: '../../../../examples/content' })`; Next via `join(process.cwd(), '..', '..', '..', '..', 'examples', 'content')`. Edit once, both sites pick it up.
- **mosaic-web §7 — HTML meta tags (RECOMMENDED)** — `meta` field reserved with `description`, `robots`, `canonical`, nested `og.*` and `twitter.*` groups. D-web fixture exercises end-to-end (home + about + blog post + French sidecar variant).
- **SEO explainer** — `spec/profiles/mosaic-web-seo.md` (non-normative). Walks how URL derivation + §6 JSON-LD + §7 meta tags combine. Includes format-agnostic body subsection (pre-ADR 0001).
- **License cleanup** — stale MIT removed; current state is Apache 2.0 (code) + CC BY 4.0 (spec text) + `TRADEMARK.md` (project marks).

## Live URLs

| URL | What |
|---|---|
| https://slavasolutions.github.io/mosaic/ | Explainer (0.9.2, mobile-first, dark-mode) |
| https://slavasolutions.github.io/mosaic/example/ | Astro example — `@ssolu/mosaic-astro` |
| https://slavasolutions.github.io/mosaic/example/about/ | Sidecar pattern demo + French variant via Path A |
| https://slavasolutions.github.io/mosaic/example/blog/ | Blog index, sorted by date |
| https://slavasolutions.github.io/mosaic/example/blog/hello/ | Blog post — author resolved via `ref:/team/ada` |
| https://slavasolutions.github.io/mosaic/next-example/ | Next.js example — `@ssolu/mosaic-next` (same folder, different adapter) |

Append `?debug=1` on any example route to overlay the `@ssolu/mosaic-devtool` JSON disclosure panel.

## Test count

`npm test` from the monorepo root → **238 tests passing**:

| Package | Tests |
|---|---|
| `@ssolu/mosaic-astro` | 46 |
| `@ssolu/mosaic-core` | 92 |
| `@ssolu/mosaic-devtool` | 18 |
| `@ssolu/mosaic-migrate` | 18 |
| `@ssolu/mosaic-next` | 58 |
| `@ssolu/mosaic-validator-web` | 6 |

## Architecture decisions (the important ones)

| Decision | Choice |
|---|---|
| Spec layering | Base format + separate profiles (mosaic-web for routing, mosaic-design-tokens for visual values). Each profile encodes ONE concern. |
| Tokens default storage | `tokens/` collection (file-level separation — strip-design = skip one directory; hot-swap = change one cascade line). Inline `tokens` field on records is permitted but discouraged. |
| Variant model | `(identity, modifier-set)` is the matching key. Same identity with different modifier-sets = distinct variants. Refs resolve to canonical (empty modifier-set). |
| Body field | Base format §5.2 reserves `body`; recognised text extensions `{.md, .txt, .html, .adoc}`. Bytes are opaque UTF-8 — markdown is an adapter convention, not a spec requirement. See ADR 0001. |
| Block composition | Each block = its own record (conventionally under `/snippets/`). Page holds an ordered `sections: [ref:/snippets/...]` array. No new spec primitive. See ADR 0002. |
| External assets | Records reference images, videos, PDFs by URL. R2 / S3 / CDN / external bucket stays. Mosaic does not mandate colocated assets. |
| npm scope | `@ssolu/*` (user owns the slavasolutions org on npm). Top-level `mosaic` squatted, reclaim candidate later. |
| Repo layout | One monorepo. Standalone repos (mosaic-core, mosaic-astro) archived. |
| Branch strategy | Single main; pre-0.9.2 history preserved as tags (`archive/v0`, `archive/pre-0.9.2`, `v0.5.0`), no stale branches. |
| Cross-folder design sharing | Not in spec. Convention only (copy tokens between Mosaic folders). Spec extensions (`mosaic.json#extends`, cross-folder refs) deferred. |
| Standalone renderer | Not building one. Astro / Next / future Vite adapters handle rendering via their framework. |

## Queued — NOT done yet

### Surface-level
- **Re-tighten main branch protection** — untick "Allow force pushes" at https://github.com/slavasolutions/mosaic/settings/branches (your click).

### Substantial work
- **Browser validator polish** — `@ssolu/mosaic-validator-web` is built (task #19 in flight at session end). Final integration into the live explainer (replacing the `_coming_` row) needs a deploy round.
- **HTML body fixture nav** — `examples/content/pages/legal.{json,html}` exists; if not visible from the example nav after #16 lands, add a link from one of the existing pages.
- **Gallery of examples** — vision: a Mosaic-shaped index page at `/mosaic/gallery/` listing 2-3 featured + a long list of edge-case Mosaic folders (empty, refs-heavy, variant-heavy, collision, opaque payloads). Each is its own deployed Mosaic. Needs design decision on multi-site design sharing: (A) copy tokens, (B) `mosaic.json#extends`, (C) cross-folder refs. Recommend A first.
- **Theme hot-swap demo** — duplicate `/example/` as `/example-dark/` with one cascade line changed (`defaults.theme: "ref:/tokens/dark"`). Proves hot-swap.
- **Spec flatten** — merge `format/01-format.md` + `02-references.md` → single `format.md`. Flatten one-file subdirs (`tools/`, `schemas/`, `profiles/` with only `mosaic-web.md` + `mosaic-design-tokens.md`). Risky refactor — needs your eyes. Big diff.
- **`rationale.md`** — the user's "I want to write the WHYs myself" doc. Skeleton headings only; user fills prose.

### Open questions to resolve next session
1. Cross-folder design sharing approach — A/B/C.
2. Should the gallery be its own Mosaic folder (dogfood) or a hand-rolled static page?
3. Render the spec text itself as a Mosaic site (deeper dogfood)?
4. Reserve `sections` as a normative field in mosaic-web once ADR 0002 pattern proves out in production adapters.

## How to pick this up cleanly

```
cd /home/ms/active/mosaic        # repo path
git pull
npm install
npm run build --workspace=packages/core
npm run build --workspace=packages/astro
npm run build --workspace=packages/next
npm test                                 # expect 238 passing
GITHUB_PAGES_DEPLOY=1 npx --workspace=packages/astro/examples/minimal-site astro build
GITHUB_PAGES_DEPLOY=1 npx --workspace=packages/next/examples/minimal-next-site next build
```

The example sites read from a single canonical content folder at `examples/content/`. Edit content once, both sites pick it up.

The two live URLs should match what's in this file. If they don't, the Pages workflow at `.github/workflows/pages.yml` is the deploy mechanism — check Actions tab.

## Branches on remote

Just `main`. Pre-0.9.2 history lives in git tags: `archive/v0`, `archive/pre-0.9.2`, `v0.5.0`. No stale branches.

## Files to read first on next session

1. `README.md` — pitch + path map
2. `spec/README.md` — spec overview + two-layer model
3. `spec/format/01-format.md` — base spec, includes variant clause (§7.1) and the body field (§5.2)
4. `spec/format/02-references.md` — refs + cascade
5. `spec/profiles/mosaic-web.md` — web profile + §6 JSON-LD + §7 meta tags
6. `spec/profiles/mosaic-web-seo.md` — non-normative SEO explainer
7. `spec/profiles/mosaic-web-migration.md` — non-normative migration explainer
8. `spec/profiles/mosaic-design-tokens.md` — tokens profile
9. `docs/adr/0001-body-format-agnosticism.md` + `docs/adr/0002-block-composition.md`
10. `packages/astro/examples/minimal-site/` + `packages/next/examples/minimal-next-site/`
11. `packages/migrate/` (scanner) + `packages/validator-web/` (browser validator) + `packages/devtool/` (debug overlay)
12. **This file (STATE.md)** — session continuity

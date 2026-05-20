# Changelog

## Unreleased

### `@ssolu/mosaic-astro@0.4.0`

**Added**

- Publishes Zod schemas for the Mosaic Web profile so example sites no
  longer cast `entry.data as any`: `pageSchema`, `heroSchema`,
  `ruleCardsSchema`, `journalPreviewSchema`, `blockSchema`, `tokensSchema`,
  `manifestSchema` + inferred TypeScript types (`Page`, `HeroBlock`, …).
  Pass them straight to `defineCollection({ schema })`.
- Loader now populates `entry.rendered.html` via `renderBody()` at load
  time. Consumers can use the canonical Astro idiom
  `const { Content } = await render(entry); <Content />` instead of
  reaching for `set:html`. Dispatches on `bodyExt` (md / html / txt).

**Dependencies**

- Added `zod ^3.23.0 || ^4.0.0` — peer-compatible with Astro's content
  collection machinery.

### `@ssolu/mosaic-validator-web@0.1.1`

**Fixed**

- Drop-in browser bundle no longer throws
  `Dynamic require of "node:fs" is not supported` at startup. The
  fs-coupled paths from `@ssolu/mosaic-core`'s `validate()` are now
  resolved to an inline no-op shim via an esbuild resolve plugin; the
  browser bundle keeps the no-runtime-deps guarantee (no external
  polyfills added).

### Marketing site moves to a Mosaic folder (dogfood)

- New `/site/` folder is the Mosaic source for `mosaic.ssolu.dev`:
  `mosaic.json` (manifest with mosaic-web profile + brand + nav),
  `pages/` (route records), `snippets/` (reusable blocks),
  `tokens/index.json` (design tokens — single source of truth),
  `images/` (brand assets).
- New `/site-build/` Astro project consumes `/site/` via
  `mosaicLoader({ root: '../site', includeNonRouteRecords: false })`,
  parses entries with the published Zod schemas, and emits static HTML
  to `site-build/dist/`. Block resolution uses a discriminated union on
  `@type` (hero / rule-cards / journal-preview); design tokens live in
  one `tokens.css` referenced by every component (no inline literals).
- Cloudflare Pages config (`wrangler.toml`) replaces the GitHub Pages
  deploy path. CI build target:
  `cd site-build && npm install && npm run build`, output dir
  `site-build/dist`. Custom domain `mosaic.ssolu.dev` flips via DNS once
  the Pages project is created in the CF dashboard.
- Repo `/index.html` and root favicon set stay intact; the GH Pages
  deploy remains valid until DNS flips. After the CF Pages deploy is
  verified the root-level marketing site will be removed in a follow-up.

### Adapter side-effects

- `@ssolu/mosaic-astro` example layouts (`Layout.astro`,
  `[[...slug]]/page.tsx`) now point at `/logo.png` (rendered globe)
  instead of the deprecated `/logo.svg` (four-corners mark). Each
  adapter package ships a matching `logo.png` so the brand mark is
  consistent across `packages/{astro,core,next}` READMEs.
- Site-wide QA: a Playwright pass (`scripts/qa-playwright.mjs`) checks
  `/`, `/explore/`, `/spec/`, and all six demo variants at mobile /
  tablet / desktop viewports for console errors + 4xx/5xx responses.
  Latest run is 27/27 clean against the local preview build.

### Repository housekeeping

- `.gitignore` now excludes CI deploy targets the workflow generates
  from each package's `dist/`: `_mosaic-devtool/`, `_mosaic-validator/`,
  `demo-blog/`, `demo-single/`, `demo-full/`, `demo-blog-next/`,
  `demo-single-next/`, `demo-full-next/`, and Astro build outputs under
  `site-build/dist/` + `site-build/.astro/`. These were never meant to
  be source-tracked; the workflow rebuilds them on every push.

### README + repo presentation

- Version sprawl reconciled — every file now reads **0.9.4** (root README,
  spec README, spec headers, index.html topbar + footer, packages/core
  README, root package.json). Previous mix of 0.9.2 / 0.9.4 across files
  was the biggest credibility leak.
- README "About the website framing" rewritten — drops the foreshadowed
  "feeds, future archives" profiles that don't exist. Says only what ships
  today (mosaic-web + mosaic-design-tokens).
- README gains a **Compared to other content tools** section — honest
  table vs Astro Content Collections, Contentlayer, Keystatic, Notion-as-CMS,
  with "pick Mosaic if / don't pick yet if / not necessarily either-or"
  guidance.
- README gains a **pre-release notice** above the Status section — explicit
  that `@ssolu/*` packages aren't on npm yet, install snippets describe the
  future-published shape.
- README gains a **Roadmap** section — 1.0 stability lock criteria, npm
  publish coordination, React adapter ([#12]), Studio ([#11]), git
  adapter, profile-by-demand policy.
- Removed `docs/STATE.md` — it was internal session-handoff working notes,
  not fit for outside visitors. Recovered via git history if needed; future
  state goes in PR descriptions, the CHANGELOG, and roadmap.
- Removed the "Historic and superseded material lives in `../mosaic-archive/`"
  pointer from the repo guide — that sibling folder is outside the repo
  and shouldn't be advertised here.
- Repo renamed back to lowercase `mosaic` (GitHub had been serving it as
  `Mosaic`, breaking case-sensitive Pages URLs).

### Root cleanup

- `PRINCIPLES.md` removed — its content (three foundational claims, plain
  language) merged into `README.md` as a new "Principles" section. The
  normative version lives in `spec/format/01-format.md`.
- `STATE.md` moved to `docs/STATE.md`. It's an internal working-notes
  handoff doc, doesn't belong at the root.
- Added a single root `/LICENSE` pointer file describing the dual-licensing
  arrangement (`LICENSE-code` for code, `LICENSE-spec.md` for spec text,
  `TRADEMARK.md` for project marks). Auto-detection tools that look for
  a literal `LICENSE` file now find one.
- `CONTRIBUTING.md` source-of-truth section refreshed — points at
  `README.md`, `spec/format/`, `spec/profiles/`, `docs/adr/`; the old
  `PRINCIPLES.md` / `SPEC.md` / `mips/` references are gone.

### Licensing & marks (earlier this session)

- Removed stale top-level `/LICENSE` (MIT). Dual licensing is now canonical:
  Apache 2.0 for code (`LICENSE-code`) + CC BY 4.0 for spec text
  (`LICENSE-spec.md`).
- Added `/TRADEMARK.md` — project marks policy (forks MUST rename; logos
  are not covered by the code/spec licenses).
- Root `package.json#license` switched from `SEE LICENSE IN ./LICENSE`
  to `Apache-2.0` to match the per-package metadata.
- `NOTICE`, `LICENSE-code`, and `LICENSE-spec.md` refreshed to point at
  the current spec layout (`spec/format/`, `spec/profiles/`,
  `spec/schemas/`) — the old `SPEC.md` / `PHILOSOPHY.md` / `mips/`
  paths no longer exist.
- `README.md` license section gained a TRADEMARK.md pointer.

## 0.9 — Realignment (2026-05-14)

Doc-layer realignment after drift accumulated through 0.8 → 0.8.1. No semantic spec changes; terminology renames (`record → entry`, `drift`, `tools → packages`) deferred to 0.10. Locks 1.0 scope.

### Doc structure overhaul

- `TRUTHS.md` renamed to `PRINCIPLES.md`; rewritten as 10 hybrid-format truths (down from 17).
- `SPEC.md` hoisted out of `spec/` subdir to repo root. Single file, no subdir split.
- `OVERVIEW.md` folded into `README.md`.
- `ARCHITECTURE.md`, `BUILD_REPORT.md`, original `TRUTHS.md`, original `spec/SPEC.md` moved to `archive/0.8.1/`.
- `mips/` keeps its name; adopts the Rust RFC template going forward (Summary / Motivation / Guide / Reference / Drawbacks / Rationale & alternatives / Prior art / Unresolved / Future).

### Process additions

- `CONTRIBUTING.md` added with the session-equals-version-step rule: each non-discarded Claude session is exactly one CHANGELOG entry and one version step.
- `AGENTS.md` added mirroring the versioning rule for AI sessions.
- `CHANGELOG.md` reconstructed back to 0.0 (pre-0.7 entries are author-memory placeholders; see "Prior history" below).
- `V1.md` added — locks the 1.0 scope: 4 packages, `mosaic-explorer` separate-repo binary distribution, dogfood website, conformance 100%.

### Architecture

- Studio architecture decoupled from CLI; explorer ships as a separate `mosaic-explorer` repo with its own release cadence.
- Three-layer source-of-truth strictly separated: PRINCIPLES (claims) / SPEC (rules) / MIPs (decisions).

### Deferred to 0.10

- `record → entry` rename (whole spec + tools + tests sweep).
- `drift` severity rename (`inconsistency` vs collapse into `warning` — pending).
- `tools/ → packages/` directory rename.

---

## 0.8.1 — First-class locales (2026-05-14)

Promotes localization out of engine extensions into the base spec.

### Shipped MIPs (new)

- **MIP-0014** — First-class locales (translatable fields + locale-suffix records, `site.defaultLocale`, `site.locales`).

### Spec additions

- SPEC §2.5 — filename grammar amended to parse `<slug>.<locale>.{md,json}` suffix before the extension check.
- SPEC §2.8 (new) — localized records resolution algorithm.
- SPEC §6.3 — `mosaic.locale.invalid`, `mosaic.locale.unknown-default` drift codes.
- SPEC §6.4 — `mosaic.locale.missing` warning code.
- SPEC §8.2 — `site.defaultLocale` and `site.locales` fields.
- SPEC §11 — replaced "Localization beyond the locale field" with the more specific "Locale-prefixed URL routing" and "Per-locale asset variants".

### Tooling updates

- Migrator (`tools/migrate/interactive/`) emits sibling locale-suffix records (`<slug>.<locale>.md`) instead of stashing translations under `$astro.translations.<locale>`. Detects source locales from `astro.config.mjs#i18n` or `project.inlang/settings.json` and writes `site.defaultLocale` + `site.locales` into `mosaic.json`.
- Astro loader (`tools/astro-loader/`) emits one Astro entry per `(slug, locale)` combination. Default-locale entries keep `id = "<slug>"`; non-default-locale entries use `id = "<slug>--<locale>"`. Each entry carries `data.locale`. Translatable fields are resolved against the entry's locale before reaching the schema.

### Conformance tests

- `033-translatable-field-pass` — translatable field resolved against `defaultLocale`.
- `034-locale-suffix-record-pass` — `<slug>.<locale>.md` sibling files surface as separate locale variants.

### Late-window addition

- `@mosaic/core` extracted (commit `fa42abb`): shared SDK at `tools/core/` (~2100 LOC, zero deps, 48-assertion self-test). The three duplicated impls (validate, render, astro-loader) now delegate to core. Net −1395 LOC across the repo.

---

## 0.8 — Folder-shape foundations (2026-05-14)

Closes the interop holes left in 0.7 and adds the three features 0.7 deferred. No more "globals/" folder; `mosaic.json` becomes a real manifest; design tokens, redirects, and a home-route lock are first-class.

The 17 axioms in [`TRUTHS.md`](TRUTHS.md) are the foundation. Every rule in the spec traces back to one. Every MIP records the decision behind one.

### Shipped MIPs (new)

- **MIP-0007** — Root-level singletons (replaces `globals/`)
- **MIP-0008** — `mosaic.json` as full manifest (identity, types, collections w/ defaults, singletons, redirects, tokens)
- **MIP-0009** — Writers preserve unknown fields
- **MIP-0010** — Required-title uses the resolved value (closes 0.7 hole)
- **MIP-0011** — Design tokens as a root singleton (DTCG-aligned)
- **MIP-0012** — Redirects (first-class)
- **MIP-0013** — Home is `/` (auto-redirect from `/home`)

### Breaking changes from 0.7

- `globals/` directory → root-level singletons. Refs: `ref:globals/site` → `ref:site`.
- `mosaic.json#globals` key → `mosaic.json#singletons`.
- `pages/home.*` is now structurally invalid (was silently accepted in 0.7).
- Frontmatter in a markdown file is now structural (was undefined behavior in 0.7).
- `array` field shape: `of` MUST be present; `of: "ref"` is invalid — use `of: { "kind": "ref", "to": "<collection>" }`.

### Established (carried forward from 0.7)

- Top-level layout: `mosaic.json`, `pages/`, `collections/`, `images/`, plus root singletons.
- Three record content combinations (md / json / both).
- Two record locations (direct file/pair or folder with `index.*`).
- Slug regex `^[a-z0-9][a-z0-9-]*$`.
- Frontmatter forbidden in markdown.
- Title precedence: JSON > markdown H1 > filename slug.
- Four ref forms: `ref:`, `asset:`, `./`, `@selector`.
- Index shape as a normative interchange format.
- Stable error codes.

### Spec tightenings (no MIP, listed for the record)

- ABNF grammar for refs restored as SPEC §5.2.
- Ref detection rule made explicit: engines scan every string value for the four prefixes (SPEC §5.7).
- Selector grammar pinned: JSON path uses dot notation with integer array indices; heading-slug algorithm spelled out (SPEC §5.6).
- Sort tiebreaker pinned: ties break by slug ascending (SPEC §4.1).
- `images/manifest.json` shape lifted into SPEC §1.6.
- Native vs embedded engine modes documented (SPEC §0.2).
- Versioning policy expanded with the three reader/site version-skew cases (SPEC §9).

### Tools

`validate`, `index`, `init`, `infer`, `migrate`, `fix`, `render` — contracts in `tools/`. Reference Node implementations for `validate` and `render` ship under `tools/validate/impl/` and `tools/render/`.

### Tests

- Conformance corpus expanded. The 0.7 corpus had 7 filled tests and 18 stubs; the 0.8 corpus fills the priority stubs and adds new tests covering the new MIPs.
- `tests/conformance/024-globals-ref-pass/` renamed to `024-singleton-ref-pass/`.
- New tests cover: singleton + collection same name; required-title resolved from H1; home-route reserved; redirect loop; redirect collision; tokens singleton; tokens ref via selector.

### Schema

`mosaic.schema.json` ships as a real JSON Schema 2020-12 document (the 0.7 reference to `https://mosaic.dev/schemas/0.7.json` was a vapor URL).

### Known unfinished

- Property-based tests (`tests/property/`) not yet written.
- SQLite index format documented only at the field level; SQL schema not yet pinned.
- Per-page / per-component / per-record design token overrides deferred; will land alongside layouts.
- Layouts themselves still deferred — content spec stabilises first.

---

## 0.7 — First public draft (2026-05-14)

First public draft. Shape settling toward 1.0.

### Shipped MIPs

- **MIP-0001** — Folder layout and record shapes
- **MIP-0002** — Ref grammar and selectors (`@selector` syntax)
- **MIP-0003** — Collection routing via `collection-list`
- **MIP-0004** — Stub-based ref expansion
- **MIP-0005** — Three-level validation severity (structural / drift / warning)
- **MIP-0006** — List-only mounts via `"routes": false`

---

## 0.5 — Name landed: Mosaic (approx 2026-04)

_TODO: user-provided summary. Bucket idea landed at the name "Mosaic" with first stable folder-shape conventions._

---

## 0.1–0.4 — Bucket revisions (approx 2026-02 to 2026-04)

_TODO: user-provided summary. Revisions of the "bucket" protocol idea before the rename._

---

## 0.0 — Bucket (approx 2026-01)

_TODO: user-provided summary. Original "website in a bucket" protocol sketch. Pre-Mosaic._

---

## Prior history (0.0–0.5, unrecorded in this repo)

Pre-0.7 versions lived in a different working tree and are not git-recoverable from this repo. Approximate dates come from author memory; one-liners above are placeholders pending fill-in by the author. The proper CHANGELOG starts at 0.7 (the imported baseline at commit `c621430`) and runs forward from there in git.

# Mosaic — session state

Working notes for picking up between sessions. **Not normative — see `spec/` for the actual format.** Update when state changes; otherwise rot.

Last updated by this session: 2026-05-19.
Main HEAD when written: `be6c3d5`.

---

## What landed this session (most recent first)

- **mosaic-design-tokens profile** + tokens flowing through both example sites — same content folder, Astro and Next render visually identical from one shared theme record. Cascade-driven hot-swap.
- **JSON-LD §6** clause added to mosaic-web profile. `@type` on every example record. Both layouts emit `<script type="application/ld+json">`.
- **Path A** — variants of an identity are first-class records. §7.1 + §11.4 patched. mosaic-core API: `Map<Identity, Record[]>` with `getPrimary(variants)` helper. Both adapters iterate variants. New fixture `spec/examples/E-variants/`. Locale demos: `about.fr.{json,md}` in both example sites.
- **@ssolu npm scope** locked in. `mosaic-core` → `@ssolu/mosaic-core`. `mosaic-astro` → `@ssolu/mosaic-astro`. New: `@ssolu/mosaic-next`.
- **Next.js adapter** + minimal-next-site example, deployed at `/next-example/`.
- **Astro adapter** at v6.3.5 peer (Astro 4.14+/5/6 supported). devDep on Astro 6.
- **Node CLI** in mosaic-core: `mosaic validate` / `mosaic read`.
- **Test workflow** (`.github/workflows/test.yml`) + **Dependabot** (`.github/dependabot.yml`) — weekly grouped npm updates + monthly Actions updates.
- **Index.json `.gitignore` bug fixed** — 0.5-era ignored `index.json` files (folder-form records). 9 formerly-ignored files added back.
- **Designer explainer rewrite** — `index.html` shrunk 611 → 361 words. Icon sprite at `brand/icons.svg`. Logo: `brand/logos/four-corners.svg` (the only one — copied to repo root `logo.svg` and both example sites' `public/logo.svg`).
- **UX polish** from live-site feedback — banner shortened to one line + horizontal scroll, logo added to each example's `public/`, lorem ipsum bodies, "(Resolved from ref)" inline annotation removed.

## Live URLs

| URL | What |
|---|---|
| https://slavasolutions.github.io/mosaic/ | Explainer (0.9.2, mobile-first, dark-mode) |
| https://slavasolutions.github.io/mosaic/example/ | Astro example — `@ssolu/mosaic-astro` |
| https://slavasolutions.github.io/mosaic/example/about/ | Sidecar pattern demo |
| https://slavasolutions.github.io/mosaic/example/blog/ | Blog index, sorted by date |
| https://slavasolutions.github.io/mosaic/example/blog/hello/ | Blog post — author resolved via `ref:/team/ada` |
| https://slavasolutions.github.io/mosaic/next-example/ | Next.js example — `@ssolu/mosaic-next` (same folder, different adapter) |

## Test count

`npm test` from the monorepo root → **151 tests passing** (31 astro + 75 core + 45 next).

## Architecture decisions (the important ones)

| Decision | Choice |
|---|---|
| Spec layering | Base format + separate profiles (mosaic-web for routing, mosaic-design-tokens for visual values). Each profile encodes ONE concern. |
| Tokens default storage | `tokens/` collection (file-level separation — strip-design = skip one directory; hot-swap = change one cascade line). Inline `tokens` field on records is permitted but discouraged. |
| Variant model | `(identity, modifier-set)` is the matching key. Same identity with different modifier-sets = distinct variants. Refs resolve to canonical (empty modifier-set). |
| npm scope | `@ssolu/*` (user owns the slavasolutions org on npm). Top-level `mosaic` is squatted (last touched 2023-06, reclaim candidate via npm dispute later). |
| Repo layout | One monorepo. Two standalone repos (mosaic-core, mosaic-astro) archived. |
| Branch strategy | Single main, force-push allowed during dev. `0.9.2-clean` is granular-history record (kept for now, can delete later). |
| Cross-folder design sharing | Not in spec. Convention only (copy tokens between Mosaic folders). Spec extensions (`mosaic.json#extends`, cross-folder refs) deferred. |
| Standalone renderer | Not building one. Astro / Next / future Vite adapters handle rendering via their framework. Standalone renderer queued if a real driver appears. |

## Queued — NOT done yet

### Surface-level
- **Re-tighten main branch protection** — untick "Allow force pushes" at https://github.com/slavasolutions/mosaic/settings/branches (your click).
- **Archive `packages/next-adapter` remote branch** — at https://github.com/slavasolutions/mosaic/branches (auto-mode blocked me from deleting).
- **Three Dependabot PRs sitting open** on GitHub — actions/upload-pages-artifact-5, astro-e102ea48d3, dev-tooling-a7a3a4bd79. Test workflow should run against them; merge or close.

### Substantial work
- **Gallery of examples** — vision: a Mosaic-shaped index page at `/mosaic/gallery/` listing 2-3 featured + a long list of edge-case Mosaic folders (empty, refs-heavy, variant-heavy, collision, opaque payloads). Each is its own deployed Mosaic. Needs design decision on multi-site design sharing: (A) copy tokens, (B) `mosaic.json#extends`, (C) cross-folder refs. Recommend A first.
- **Theme hot-swap demo** — duplicate `/example/` as `/example-dark/` with one cascade line changed (`defaults.theme: "ref:/tokens/dark"`). Proves hot-swap.
- **Web-based browser validator** — drag a folder onto the live explainer, runs validate.js client-side. Currently `_coming_` in the README table.
- **Spec flatten** — merge `format/01-format.md` + `02-references.md` → single `format.md`. Flatten one-file subdirs (`tools/`, `schemas/`, `profiles/` with only `mosaic-web.md` + `mosaic-design-tokens.md`). Risky refactor — needs your eyes. Big diff.
- **License consolidation** — three license files (stale MIT + Apache + CC BY) → one. Need your call on which (Apache 2.0 alone vs current dual). The user picked dual but the stale MIT was never deleted. Awaiting confirmation.
- **`rationale.md`** — the user's "I want to write the WHYs myself" doc. Skeleton headings only; user fills prose.
- **Tombstone READMEs on archived standalone repos** — user said "don't worry, we never popularized" — can skip unless adoption picks up.

### Open questions to resolve next session
1. Cross-folder design sharing approach — A/B/C.
2. Should the gallery be its own Mosaic folder (dogfood) or a hand-rolled static page?
3. License — keep current dual (Apache + CC BY + stale MIT to delete), or consolidate to Apache 2.0 only?
4. Render the spec text itself as a Mosaic site (deeper dogfood)?

## How to pick this up cleanly

```
cd /home/ms/active/mosaic-0.9.2
git pull
npm install
npm run build --workspace=packages/core
npm run build --workspace=packages/astro
npm run build --workspace=packages/next
npm test                                 # expect 151 passing
GITHUB_PAGES_DEPLOY=1 npx --workspace=packages/astro/examples/minimal-site astro build
GITHUB_PAGES_DEPLOY=1 npx --workspace=packages/next/examples/minimal-next-site next build
```

The example sites read from a single canonical content folder at `examples/content/`. Astro reads it via `mosaicLoader({ root: '../../../../examples/content' })` (src/content.config.ts) and Next via `join(process.cwd(), '..', '..', '..', '..', 'examples', 'content')` (src/lib/mosaic.ts). Edit content once, both sites pick it up.

The two live URLs should match what's in this file. If they don't, the Pages workflow at `.github/workflows/pages.yml` is the deploy mechanism — check Actions tab.

## Branches on remote (as of last update)

- `main` ← canonical
- `0.9.2-clean` ← granular history, kept for now
- `packages/next-adapter` ← stale, can delete
- `dependabot/*` ← active dep update PRs
- `path-a-and-profiles` ← merged to main, can delete
- Various pre-0.9 branches (`v0.6-mips`, `v0.8-draft`, `v0.2-draft`, `license-bump`, `0.9-realignment`, `mosaic-sites-prototype`, `readme-rewrite`, `stress-tests-scaffold`, `0.9.1-folderdb-app`, `0.9.1-spec`) — history record, low priority cleanup.

## Files to read first on next session

1. `README.md` — pitch + path map
2. `spec/README.md` — spec overview + two-layer model
3. `spec/format/01-format.md` — base spec, includes variant clause (§7.1)
4. `spec/format/02-references.md` — refs + cascade
5. `spec/profiles/mosaic-web.md` — web profile + JSON-LD §6
6. `spec/profiles/mosaic-design-tokens.md` — tokens profile
7. `packages/astro/examples/minimal-site/` — Astro reference impl
8. `packages/next/examples/minimal-next-site/` — Next reference impl
9. **This file (STATE.md)** — session continuity

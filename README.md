<h1 align="center">
  <img src="logo.svg" width="44" alt=""> &nbsp; Mosaic
</h1>

<p align="center"><strong>A folder format for structured content.</strong></p>

<p align="center">
  <a href="https://slavasolutions.github.io/mosaic/explore/">Live example site</a>
  ·
  <a href="https://slavasolutions.github.io/mosaic/">Explainer</a>
  ·
  <a href="./spec/README.md">Specification</a>
  ·
  <a href="./packages/core/">Reader</a>
  ·
  <a href="./packages/astro/">Astro adapter</a>
</p>

---

## The folder is the website

Your content is a directory tree. JSON files are records. Subfolders are collections. References between records are strings that start with `ref:`. Switch from Astro to Next to a custom Rust thing — the content stays.

No database. No daemon. No engine. The filesystem is the database; the spec is the contract.

**[Try the example site →](https://slavasolutions.github.io/mosaic/explore/)**

Each demo on that page is a real Mosaic folder at the repo root — [`examples/content-single/`](./examples/content-single/) (one page), [`examples/content-blog/`](./examples/content-blog/) (three pages plus a journal), [`examples/content-full/`](./examples/content-full/) (a dozen pages with nav, sub-pages, image URLs). Each shape is rendered twice — once by the Astro adapter, once by Next — so you can see the same folder under both frameworks.

### About the "website" framing

Mosaic is a folder format for **content**. Websites are the headline use case — the `mosaic-web` profile adds URL routing + HTML meta + JSON-LD on top of the base format. The base spec itself never mentions URLs. A reader that just wants the records (RSS index, AI ingest, static archive) doesn't need the web profile at all.

Today two profiles ship: **mosaic-web** (routing + meta + JSON-LD) and **mosaic-design-tokens** (theme cascade). New profiles get drafted through the MIP process when a real consumer needs one — we don't speculate.

---

## Principles

Three foundational claims. Every spec rule derives from one of them.

**The folder is the website.** The filesystem is the source of truth; nothing else is canonical. `.json` files are records, folders are collections, the root `mosaic.json` holds the manifest.

**Refs link records.** One `ref:` prefix, two anchor modes (absolute from root, `./` for relative), one optional JSON Pointer for inner values. Refs at any depth follow deeper-wins cascade plus deep-merge. Cycles are free.

**Forward-safe.** Engines decide URLs. Writers preserve unknown fields. Extensions namespace themselves with `x-`. Records MAY declare `@type` for Schema.org alignment; engines that emit JSON-LD use it automatically.

These hold; the rest is detail. See [`spec/format/01-format.md`](./spec/format/01-format.md) for the normative version.

---

## The three rules

| # | Rule | In English |
|---|---|---|
| 1 | A file is a record | `.json` files hold structure; `.md`/`.pdf`/`.png` are opaque payloads with optional `.json` sidecars. |
| 2 | A folder is a collection | Folders nest. `index.{json,md,…}` is the folder itself as a record. |
| 3 | The filename is the contract | `name[.modifier]*.ext`. Identity is form-independent — `about.json` and `about/index.json` are the same record. |

That's the base. [`spec/`](./spec/) extends these with refs (`ref:team/ada` and a JSON Pointer for inner values), a minimal cascade (one inheritable key — `locale` — plus profile-declared), and the optional [`mosaic-web` profile](./spec/profiles/mosaic-web.md) for routing. See [`mosaic-web-seo.md`](./spec/profiles/mosaic-web-seo.md) for how the web profile produces crawler-friendly output, and [`mosaic-web-migration.md`](./spec/profiles/mosaic-web-migration.md) for moving an existing site into Mosaic. All of it small and frozen.

---

## Validate a folder

Three ways to check a folder against the spec. Same answer from each — errors, warnings, exit code.

| | Command | Notes |
|---|---|---|
| **Node CLI** | `node packages/core/dist/cli.js validate <path>` | Once on npm: `npx @ssolu/mosaic-core validate <path>`. Covers §§5–9; also `mosaic read <path>` for the full pipeline (refs §11 + cascade §12). |
| **Python** | `python3 spec/tools/validate.py <path>` | Stdlib only. No install. Base §§5–9 only. |
| **Browser** | Drop a folder on the [live explainer](https://slavasolutions.github.io/mosaic/#validate) | Pure-client `@ssolu/mosaic-validator-web` (about 9 kB). Same rules, no terminal, nothing leaves the browser. |

Try it against the four spec examples:

```bash
node packages/core/dist/cli.js validate spec/examples/A-identity/content   # FAILS (intentional collision)
node packages/core/dist/cli.js validate spec/examples/B-sidecars/content   # OK + 1 warning
node packages/core/dist/cli.js validate spec/examples/C-cascade/content    # OK
node packages/core/dist/cli.js validate spec/examples/D-web/content        # OK
```

Both validators are 1:1 ports of the spec rules. Exit codes match. Either tool is a faithful read of §§5–9.

---

## Use it in code

**In an Astro site** (this is the entire integration):

```ts
import { defineCollection } from 'astro:content';
import { mosaicLoader } from '@ssolu/mosaic-astro';

export const collections = {
  pages: defineCollection({ loader: mosaicLoader({ root: './content' }) }),
};
```

Astro now reads `./content/mosaic.json`, walks the tree, resolves sidecars/refs/cascade, and hands you a normal Astro collection. A runnable demo lives at [`packages/astro/examples/minimal-site/`](./packages/astro/examples/minimal-site/).

**From any Node program** (filesystem):

```ts
import { readFolder } from '@ssolu/mosaic-core';
const { records, manifest } = await readFolder('./content');
```

**From any Node program** (S3 / R2 / MinIO / any S3-compatible store):

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { readBucket } from '@ssolu/mosaic-s3';

const client = new S3Client({ /* AWS, R2, MinIO, … */ });
const { records, manifest } = await readBucket({ client, bucket: 'my-content' });
```

`records` is a `Map<identity, Record[]>` in both cases — sidecars merged, cascade applied, refs resolved per the spec pipeline, variants of an identity surfaced separately (Path A). The shape is byte-identical regardless of source, so swapping adapters is a one-line change.

### Adapter ecosystem

Mosaic's pipeline is source-agnostic. Every adapter package supplies a source layer (a lister + a JSON fetcher) and routes through the same `runPipeline` in core. Switching adapters changes one import line; record shapes, URL derivation, refs, cascade — all identical.

| Package | What it reads from | Status |
|---|---|---|
| [`@ssolu/mosaic-core`](./packages/core/) (`readFolder`) | filesystem | ✅ shipped |
| [`@ssolu/mosaic-s3`](./packages/s3/) (`readBucket`) | S3-compatible object storage (AWS S3, R2, MinIO, B2, Wasabi, Spaces) | ✅ shipped |
| `@ssolu/mosaic-git` | git repository at any branch / commit / ref | 📝 proposed |
| `@ssolu/mosaic-memory` | in-memory fixtures (testing) | 📝 proposed |

The Astro loader accepts either form — `{ root: './content' }` for filesystem, or `{ source: () => readBucket(...) }` for any custom adapter.

---

## What's in this repository

| Path | Purpose |
|---|---|
| [`spec/`](./spec/) | The specification. Start at [`spec/README.md`](./spec/README.md). |
| [`spec/format/`](./spec/format/) | The base format (`01-format.md`) and references + cascade (`02-references.md`). |
| [`spec/examples/`](./spec/examples/) | Four worked examples: identity, sidecars, cascade, web profile. |
| [`spec/schemas/`](./spec/schemas/) | JSON Schema 2020-12 for `mosaic.json` manifests. |
| [`spec/tools/validate.py`](./spec/tools/validate.py) | Python reference validator. Stdlib only. |
| [`spec/profiles/mosaic-web.md`](./spec/profiles/mosaic-web.md) | Web profile (routing). One of N future profiles. |
| [`packages/core/`](./packages/core/) | Reference Node reader (`@ssolu/mosaic-core`). Zero-dep TypeScript. Exposes `readFolder`, `validate`, the `mosaic` CLI, and the source-agnostic `runPipeline` (re-exported under `@ssolu/mosaic-core/adapter` for backend adapters). |
| [`packages/astro/`](./packages/astro/) | Astro Content Layer loader (`@ssolu/mosaic-astro`). |
| [`packages/next/`](./packages/next/) | Next.js App Router adapter (`@ssolu/mosaic-next`). |
| [`packages/s3/`](./packages/s3/) | S3-compatible source layer (`@ssolu/mosaic-s3`). Reads a bucket+prefix as a Mosaic folder. Works against AWS S3, Cloudflare R2, MinIO, Backblaze B2, Wasabi, DigitalOcean Spaces. |
| [`packages/devtool/`](./packages/devtool/) | Astro dev-toolbar app for inspecting Mosaic records at edit time. |
| [`index.html`](./index.html) | Visual explainer (hosted at the [explainer link above](https://slavasolutions.github.io/mosaic/)). |

## Compared to other content tools

Mosaic is a **format**, not a CMS. Honest comparison vs the tools you might otherwise reach for:

| | Mosaic | Astro Content Collections | Contentlayer | Keystatic | Notion-as-CMS |
|---|---|---|---|---|---|
| What it is | Spec + reader libs | Astro feature | Library | CMS application | SaaS database |
| Content lives in | Any folder — FS, S3/R2, git (next) | Local FS | Local FS | GitHub repo | Notion |
| Editor UI | Not yet — Studio planned ([#11](https://github.com/slavasolutions/mosaic/issues/11)) | None | None | Yes, in-repo | Yes, Notion app |
| Framework | Any (adapter pattern) | Astro only | Astro / Next / Solid | Astro / Next | Any (via API) |
| Schema validation | Spec-defined, optional | Zod, required | Zod, required | Schema, required | None |
| Lock-in | None — files are yours | Tied to Astro | Tied to your build | Tied to GitHub | Tied to Notion |
| Switch frameworks | Yes — same folder, swap adapter | Migration job | Library swap | Re-platform | API rewrite |
| Open spec | Yes — `spec/` | No (impl-defined) | No | No | No |
| Reference impls | TS + Python (agree on §§5–9) | One (Astro) | One | One | Notion API client |
| AI / SEO baked in | JSON-LD + `meta:` per spec | DIY | DIY | DIY | DIY |
| License | Apache 2.0 (code) + CC BY 4.0 (spec) | MIT (Astro) | MIT | MIT | proprietary |
| Maturity | 0.9.4 working draft, pre-1.0 | Stable | Maintenance mode | Stable | Stable |

### Pick Mosaic if

- You're deciding *where content lives* — filesystem, git, S3/R2, or all three over time
- You want framework portability built-in (today: Astro + Next adapters; the same folder works in both, byte-identical)
- You want an open spec, not a library lock-in
- You want JSON-LD + OG meta out of the box
- You want the audit trail of git more than a slick editor

### Don't pick Mosaic (yet) if

- You need a polished WYSIWYG editor today — use Keystatic or wait for [Mosaic Studio](https://github.com/slavasolutions/mosaic/issues/11)
- You're happy in Astro forever and never plan to leave — Astro Content Collections gives you Zod schemas Mosaic doesn't
- You want a hosted service — Mosaic is plain files
- You're building multi-tenant user-generated content — Mosaic is for owned content, not user streams

### Not necessarily either/or

- **Mosaic + Astro Content Collections** — already paired in this repo. The Astro adapter plugs Mosaic into Astro's Content Layer API. You get Mosaic portability + Astro's collection-aware queries.
- **Mosaic + Keystatic / Decap** — both could read/write a Mosaic folder. Adapter is a future PR ([#11](https://github.com/slavasolutions/mosaic/issues/11)).
- **Mosaic + Notion** — export Notion to a Mosaic folder once, then never need the Notion API.

---

## Status

**Version 0.9.4** — working draft. The headline format is locked; details may still shift before 1.0. See [`spec/CHANGELOG.md`](./spec/CHANGELOG.md) for what changed since 0.9.2.

> **Pre-release notice.** Packages aren't on npm yet. The install snippets above use `@ssolu/*` names that will publish at 1.0. To evaluate today: visit the [live explainer](https://slavasolutions.github.io/mosaic/) or clone this repo + `npm install`.

## Roadmap

What's already shipped lives in the [CHANGELOG](./CHANGELOG.md). What's next:

- **1.0 stability lock** — once a real downstream adopter validates the §§5–12 surface for ~3 months without spec changes
- **npm publish** — coordinated `@ssolu/mosaic-*` 1.0 release; spec freezes at the same time
- **React adapter + non-web profile** — interactive editor use case ([#12](https://github.com/slavasolutions/mosaic/issues/12)). Surfaces write-back contract.
- **Mosaic Studio** — visual editor for the design-tokens profile ([#11](https://github.com/slavasolutions/mosaic/issues/11))
- **`@ssolu/mosaic-git`** — read content from any git branch/ref; adapter ecosystem expansion
- **More profiles** — when a real consumer demands one (feeds, archives, etc are NOT on the roadmap until a downstream project asks)

## License

- Specification text — [CC BY 4.0](./LICENSE-spec.md). Attribution required, derivatives permitted.
- Code (`spec/tools/`, `packages/`) — [Apache 2.0](./LICENSE-code), with explicit patent grant.
- Project marks — see [TRADEMARK.md](./TRADEMARK.md). Forks MUST rename; describe compatible implementations as *"compatible with Mosaic"*.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

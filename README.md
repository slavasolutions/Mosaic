<h1 align="center">
  <img src="logo.svg" width="44" alt=""> &nbsp; Mosaic
</h1>

<p align="center"><strong>A folder format for structured content.</strong></p>

<p align="center">
  <a href="https://slavasolutions.github.io/mosaic/example/">Live example site</a>
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

**[Try the example site →](https://slavasolutions.github.io/mosaic/example/)**

The pages you see there are literally the JSON files in [`examples/content/`](./examples/content/). Edit a file, the site updates. Move the folder anywhere — the site moves with it. Both the Astro and Next example apps read from this one folder — proof that the content is independent of the framework that renders it.

### About the "website" framing

Mosaic is a folder format for **content**. Websites are the headline use case — there's a small `mosaic-web` profile that adds URL routing for that case — but the base format is **web-agnostic**. The base spec never mentions URLs. A Mosaic folder is just as valid as a feed source, an AI ingest, or an archive; other profiles (feeds, archives) can layer on later.

Who needs the `mosaic-web` profile:

- ✅ Engines that turn a folder into a rendered site (Astro adapter, Next adapter, static-site generators)
- ✅ Validators that want to assert "this folder produces clean URLs"
- ❌ Anything that just reads records (RSS, indexers, AI tools) — they only need the base

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
| **Browser** | _coming_ | Drag a folder onto the live explainer. Same logic, no terminal. |

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

**From any Node program:**

```ts
import { readFolder } from '@ssolu/mosaic-core';
const { records, manifest } = await readFolder('./content');
```

`records` is a `Map<identity, ResolvedRecord>` — sidecars merged, cascade applied, refs resolved per the spec pipeline. Zero runtime deps.

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
| [`packages/core/`](./packages/core/) | Reference Node reader (`@ssolu/mosaic-core`). Zero-dep TypeScript. Exposes `readFolder`, `validate`, and the `mosaic` CLI. |
| [`packages/astro/`](./packages/astro/) | Astro Content Layer loader (`@ssolu/mosaic-astro`). |
| [`index.html`](./index.html) | Visual explainer (hosted at the [explainer link above](https://slavasolutions.github.io/mosaic/)). |

Historic and superseded material — pre-0.9 example sites, the 14 retired MIPs, the 0.8.x monolithic spec, session artefacts, heavier 0.9.1 fixtures — lives in a sibling folder at `../mosaic-archive/` (not part of this repository).

## Status

**Version 0.9.2** — working draft. The headline format is locked; details may still shift before 1.0. Packages aren't on npm yet; clone and `npm install` to use them. See [`spec/CHANGELOG.md`](./spec/CHANGELOG.md) for what changed since 0.9.1.

## License

- Specification text — [CC BY 4.0](./LICENSE-spec.md). Attribution required, derivatives permitted.
- Code (`spec/tools/`, `packages/`) — [Apache 2.0](./LICENSE-code), with explicit patent grant.
- Project marks — see [TRADEMARK.md](./TRADEMARK.md). Forks MUST rename; describe compatible implementations as *"compatible with Mosaic"*.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

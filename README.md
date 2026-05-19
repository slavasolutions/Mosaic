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

The pages you see there are literally the JSON files in [`packages/astro/examples/minimal-site/content/`](./packages/astro/examples/minimal-site/content/). Edit a file, the site updates. Move the folder anywhere — the site moves with it.

## Why does this exist

Every git-friendly content store reinvents the same handful of folder, naming, and metadata rules — incompatibly. Tools written against one set don't work against another. Authors get locked into a CMS that owns their schema.

Mosaic is that rule set, frozen and specified. Three structural rules, a naming grammar, a sidecar convention, and a small reference grammar — nothing more. Any tool that follows the rules can read any folder that follows them.

## The three rules

| # | Rule | In English |
|---|---|---|
| 1 | A file is a record | `.json` files hold structure; `.md`/`.pdf`/`.png` are opaque payloads with optional `.json` sidecars. |
| 2 | A folder is a collection | Folders nest. `index.{json,md,…}` is the folder itself as a record. |
| 3 | The filename is the contract | `name[.modifier]*.ext`. Identity is form-independent — `about.json` and `about/index.json` are the same record. |

That's the base. [`spec/`](./spec/) extends these with refs (`ref:team/ada` and a JSON Pointer for inner values), a minimal cascade (one inheritable key — `locale` — plus profile-declared), and a `web` profile for routing. All of it small and frozen.

## Use it

**In an Astro site** (this is the entire integration):

```ts
import { defineCollection } from 'astro:content';
import { mosaicLoader } from 'mosaic-astro';

export const collections = {
  pages: defineCollection({ loader: mosaicLoader({ root: './content' }) }),
};
```

Tell Astro that `./content/` is a Mosaic folder. Astro now reads its `mosaic.json`, walks the tree, resolves sidecars, refs, and cascade, and hands you a normal Astro content collection — query it with `getCollection('pages')`, render with any Astro template. A runnable demo lives at [`packages/astro/examples/minimal-site/`](./packages/astro/examples/minimal-site/).

**From the command line:**

```bash
git clone https://github.com/slavasolutions/mosaic && cd mosaic && npm install
node packages/core/dist/cli.js validate spec/examples/C-cascade/content
node packages/core/dist/cli.js read    spec/examples/D-web/content | jq '.records'
```

The `mosaic` binary will be the install once the packages are on npm; for now the local path above does the same thing. Outputs `OK` / `FAIL`, exits non-zero on error.

**From any Node program:**

```ts
import { readFolder } from 'mosaic-core';
const { records, manifest } = await readFolder('./content');
```

`records` is a `Map<identity, ResolvedRecord>` — sidecars merged, cascade applied, refs resolved per the spec pipeline.

## What's in this repository

| Path | Purpose |
|---|---|
| [`spec/`](./spec/) | The specification. Start at [`spec/README.md`](./spec/README.md). |
| [`spec/format/`](./spec/format/) | The base format (`01-format.md`) and references + cascade (`02-references.md`). |
| [`spec/examples/`](./spec/examples/) | Four worked examples: identity, sidecars, cascade, web profile. |
| [`spec/schemas/`](./spec/schemas/) | JSON Schema 2020-12 for `mosaic.json` manifests. |
| [`spec/tools/validate.py`](./spec/tools/validate.py) | Python reference validator. Stdlib only. |
| [`spec/profiles/mosaic-web.md`](./spec/profiles/mosaic-web.md) | Web profile (routing). |
| [`packages/core/`](./packages/core/) | Reference Node reader. Zero-dep TypeScript. Exposes `readFolder`, `validate`, and the `mosaic` CLI. |
| [`packages/astro/`](./packages/astro/) | Astro Content Layer loader. |
| [`index.html`](./index.html) | Visual explainer (hosted at the [explainer link above](https://slavasolutions.github.io/mosaic/)). |

Historic and superseded material — pre-0.9 example sites, the 14 retired MIPs, the 0.8.x monolithic spec, session artefacts, heavier 0.9.1 fixtures — lives in a sibling folder at `../mosaic-archive/` (not part of this repository).

## Status

**Version 0.9.2** — working draft. The headline format is locked; details may still shift before 1.0. Packages aren't on npm yet; clone and `npm install` to use them. See [`spec/CHANGELOG.md`](./spec/CHANGELOG.md) for what changed since 0.9.1.

## License

- Specification text — [CC BY 4.0](./LICENSE-spec.md). Attribution required, derivatives permitted.
- Code (`spec/tools/`, `packages/`) — [Apache 2.0](./LICENSE-code), with explicit patent grant.

Naming norm: describe implementations as *"compatible with Mosaic"*. Forks should use a different name. Community norm, not a trademark assertion.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

<p align="center">
  <img src="logo.svg" width="84" alt="Mosaic">
</p>

<h1 align="center">Mosaic</h1>

<p align="center">
  <strong>A folder format for structured content.</strong><br>
  Files are records. Folders are collections. References link records.<br>
  The filesystem is the database; the spec is the contract.
</p>

<p align="center">
  <a href="https://slavasolutions.github.io/mosaic/">Live explainer</a>
  ·
  <a href="./spec/README.md">Specification</a>
  ·
  <a href="./packages/core/">Reader (Node)</a>
  ·
  <a href="./packages/astro/">Astro adapter</a>
  ·
  <a href="./CHANGELOG.md">Changelog</a>
</p>

---

Any tool that follows the rules can read any folder that follows them. Switch tools, the content stays. No engine, no daemon, no required runtime.

## Try it in 30 seconds

**Validate a folder against the spec** — Python stdlib, no install:

```bash
python3 spec/tools/validate.py spec/examples/C-cascade/content
```

**Read a folder as resolved JSON from Node** — zero-dep TypeScript reader:

```bash
npm install
npm test     # 100 tests across packages/core and packages/astro
```

**Use it in an Astro site:**

```ts
import { defineCollection } from 'astro:content';
import { mosaicLoader } from 'mosaic-astro';

export const collections = {
  pages: defineCollection({ loader: mosaicLoader({ root: './content' }) }),
};
```

A runnable Astro demo lives at [`packages/astro/examples/minimal-site/`](./packages/astro/examples/minimal-site/).

## What's in this repository

| Path | Purpose |
|---|---|
| [`spec/`](./spec/) | The specification itself. Start at [`spec/README.md`](./spec/README.md). |
| [`spec/format/`](./spec/format/) | The base format (`01-format.md`) and references + cascade (`02-references.md`). |
| [`spec/examples/`](./spec/examples/) | Four worked examples: identity, sidecars, cascade, the web profile shape. |
| [`spec/schemas/`](./spec/schemas/) | JSON Schema 2020-12 for `mosaic.json` manifests. |
| [`spec/tools/`](./spec/tools/) | The reference validator (`validate.py`) — Python stdlib, ~280 lines. |
| [`spec/profiles/`](./spec/profiles/) | Profile specifications. First entry: `mosaic-web.md` (routing). |
| [`packages/core/`](./packages/core/) | Reference Node reader. Zero-dep TypeScript implementation of §§5–12. |
| [`packages/astro/`](./packages/astro/) | Astro Content Layer loader. Read a Mosaic folder as a content collection. |
| [`index.html`](./index.html) | Single-file visual explainer. Open locally, or visit the [live site](https://slavasolutions.github.io/mosaic/). |

Historic and superseded material — pre-0.9 example sites, the 14 retired MIPs, the 0.8.x monolithic spec, session artefacts, heavier 0.9.1 fixtures, and legal-protection drafts — lives in a sibling folder at `../mosaic-archive/` (not part of this repository). All recoverable from git history.

## Status

**Version 0.9.2** — working draft. The headline format is locked; details may still shift before 1.0. See [`spec/CHANGELOG.md`](./spec/CHANGELOG.md) for the path from 0.9.1.

## License

- **Specification text** — [Creative Commons Attribution 4.0 International](./LICENSE-spec.md). Attribution required; derivatives permitted.
- **Code** (`spec/tools/`, `packages/`) — [Apache License 2.0](./LICENSE-code), with explicit patent grant.

Naming norm: implementations are encouraged to describe themselves as *"compatible with Mosaic"* or *"Mosaic reader/writer"*. Forks should use a different name (e.g. *"BasedOnMosaic"*, *"MosaicLite"*). This is a community norm, not a trademark assertion.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

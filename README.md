<p align="center"><img src="logo.svg" width="72" alt="Mosaic logo"></p>

# Mosaic

**A folder format for structured content.** Files are records, folders are collections, references link records. The filesystem is the database; the spec is the contract.

Any tool that follows the rules can read any folder that follows them. Switch tools, the content stays. No engine, no daemon, no runtime.

## What's in this repository

| Path | Purpose |
|---|---|
| [`spec/`](./spec/) | The specification itself — start at [`spec/README.md`](./spec/README.md). |
| [`spec/format/`](./spec/format/) | The base format (`01-format.md`) and references + cascade (`02-references.md`). |
| [`spec/examples/`](./spec/examples/) | Four lightweight worked examples: identity, sidecars, cascade, and the web profile shape. |
| [`spec/schemas/`](./spec/schemas/) | JSON Schema 2020-12 for `mosaic.json` manifests. |
| [`spec/tools/`](./spec/tools/) | The reference validator (`validate.py`) — Python stdlib, ~280 lines, runs the spec rules against any folder. |
| [`spec/profiles/`](./spec/profiles/) | Profile specifications that layer on the base format. First entry: `mosaic-web.md` (routing for websites). |
| [`packages/core/`](./packages/core/) | Reference Node reader (`mosaic-core`). Zero-dep TypeScript implementation of §§5–12. Resolves a folder to its effective JSON. |
| [`packages/astro/`](./packages/astro/) | Astro Content Layer loader (`mosaic-astro`). Lets an Astro site read a Mosaic folder as a content collection. |
| `index.html` | A single-file visual explainer at the repo root, reusing the 0.8 showcase look. Open in any browser. |

Historic and superseded material — pre-0.9 example sites, the 14 retired MIPs, the 0.8.x monolithic spec, session artefacts, heavier 0.9.1 fixtures, and legal-protection drafts for the wider ecosystem — lives in a sibling folder at `../mosaic-archive/` (not part of this repository). Everything is also recoverable from git history.

## Status

**Version 0.9.2** — working draft. The headline format is locked; details may still shift before 1.0. Earlier 0.9.x drafts are in [`spec/CHANGELOG.md`](./spec/CHANGELOG.md).

## License

- **Specification text** (`spec/format/`, `PRINCIPLES.md`, prose in `spec/schemas/mosaic.schema.json`) — [Creative Commons Attribution 4.0 International](./LICENSE-spec.md).
- **Code** (`spec/tools/`, runnable examples) — [Apache License 2.0](./LICENSE-code), with explicit patent grant.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

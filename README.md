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
| [`archive/`](./archive/) | Earlier drafts, alternate fixtures, and pre-0.9 example sites. Kept for history; not normative. |

## Status

**Version 0.9.2** — working draft. The headline format is locked; details may still shift before 1.0. Earlier 0.9.x drafts are in [`spec/CHANGELOG.md`](./spec/CHANGELOG.md).

## License

- **Specification text** (`spec/format/`, `PRINCIPLES.md`, prose in `spec/schemas/mosaic.schema.json`) — [Creative Commons Attribution 4.0 International](./LICENSE-spec.md).
- **Code** (`spec/tools/`, runnable examples) — [Apache License 2.0](./LICENSE-code), with explicit patent grant.

## Trademark

"Mosaic" is a trademark. The format is open; the name is not. See [`TRADEMARK.md`](./TRADEMARK.md) before shipping a "Mosaic-something" product.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

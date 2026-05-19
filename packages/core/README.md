<p align="center"><img src="logo.svg" width="64" alt="Mosaic logo"></p>

# @ssolu/mosaic-core

Reference Mosaic reader for Node. Zero deps. Implements §§5–12 of the [Mosaic spec](https://github.com/slavasolutions/mosaic).

Mosaic is a folder-format spec for structured content: files are records, folders are collections, references link records. `@ssolu/mosaic-core` is the framework-agnostic TypeScript library that reads a Mosaic folder from disk and returns resolved JSON. Adapters for specific frameworks (Astro, Next, etc.) build on top of this library.

## Install

```sh
npm install @ssolu/mosaic-core
```

Requires Node 20+. ES modules only.

## Usage

```ts
import { readFolder, validate } from '@ssolu/mosaic-core';

const result = await readFolder('./content');
for (const [identity, record] of result.records) {
  console.log(identity, record.data);
}

const report = await validate('./content');
if (!report.ok) console.error(report.errors);
```

`readFolder` runs the §12.5 pipeline end-to-end: content → sidecar merge → cascade fill → references resolved. `validate` is the §§5–9 base-format conformance check — a 1:1 port of the reference `validate.py`.

By default only the base-blessed `locale` key cascades. Profile-declared keys go in `opts.cascadingKeys`:

```ts
await readFolder('./content', { cascadingKeys: ['theme', 'org'] });
```

## API

```ts
import type {
  Record,
  Collection,
  Identity,
  Manifest,
  RefValue,
  Resolution,
  ReadOptions,
  ValidationResult,
} from '@ssolu/mosaic-core';

export function readFolder(rootPath: string, opts?: ReadOptions): Promise<Resolution>;
export function validate(rootPath: string): Promise<ValidationResult>;
```

Helper exports for adapter authors: `parseRef`, `evaluatePointer`, `resolveIdentity`, `isRefString`, `applyCascade`, `mergeSidecar`, `identityOf`, `splitName`, `isHidden`.

## Implementation status

Mapped to the spec sections.

| Section | Topic | Status |
|---|---|---|
| §5    | Records (structured + opaque) | done |
| §5.1  | Markdown frontmatter — inert, warn | done |
| §6    | Collections | done |
| §7    | Naming + identity charset | done |
| §7.1  | Identity normalisation (`/index`, modifiers, ext) | done |
| §7.1  | File/folder form collision detection | done (`validate`) |
| §7.2  | Hidden entries (`_` / `.`) ignored | done |
| §7.3  | Permitted extensions; opaque payloads | done |
| §8    | Sidecar merge (shallow, sidecar wins) | done |
| §8.4  | Orphan modifier sidecar — warning | done |
| §9    | Unknown-field round-trip | preserved in resolved output |
| §11.2 | `ref:<identity>[#<json-pointer>]` grammar | done |
| §11.2 | `\ref:` escape | done |
| §11.3 | Absolute + relative anchors | done |
| §11.4 | Resolution against resolved target | done |
| §11.6 | Dangling refs — warning, not error | done |
| §11.7 | Hard ceiling — no wildcards / predicates | done (rejected) |
| §12.3 | Cascade — opt-in `defaults`, `locale` blessed | done |
| §12.3 | Profile-declared cascading keys | done (`opts.cascadingKeys`) |
| §12.5 | Resolution order (4-step pipeline) | done |
| —     | `mosaic.json` manifest verbatim preserve | done |

Not yet shipped: a Web-profile adapter (`mosaic.json#profiles.web.root` is read into `Resolution.manifest` but is not yet used to scope `readFolder`'s identity space — adapters consume the raw output for now). File-system watcher / incremental re-resolution. Bundling/transport.

## Tests

```sh
npm test
```

Fixtures live under `test/fixtures/`. They mirror the four worked examples in the spec repo plus an `appendix-c/` fixture that replicates the Appendix C of `02-references.md` (the upstream `C-cascade` example ships only the records, not the `themes/` folder needed to demonstrate the full resolution).

## Spec

This library tracks the Mosaic spec at version **0.9.4** (working draft). See <https://github.com/slavasolutions/mosaic>.

## License

Apache License 2.0. See [`LICENSE`](./LICENSE).

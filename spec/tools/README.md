# Reference validator (Python)

A **base-format validator** for Mosaic — implements §§5–9 of
[`../format/01-format.md`](../format/01-format.md). Single file, Python
stdlib, no third-party packages. Lives here as the language-neutral
companion to the spec: any reader with Python 3 on PATH can run it.

The Node reference reader at [`../../packages/core/`](../../packages/core/)
is the higher-fidelity implementation — it also resolves references (§11)
and applies cascade (§12), and ships a `mosaic` CLI with the same exit-code
behaviour. This Python script is the smaller, easier-to-audit cousin.

## What it covers

- §5 records / §7 naming and identity — full charset and modifier checks
- §6 collections + the file-form / folder-form collision rule
- §8 sidecar matching by base + modifier set
- §7.2 hidden-file and `mosaic.json` manifest handling
- §5.1 markdown frontmatter surfaced as a warning, not an error
- §9 unknown-field preservation is a *writer* obligation; this is a
  read-only validator and therefore does not exercise it

## What it does not cover (use the Node reader for these)

- Reference resolution (§11.4) — Node reader resolves; the §11.6 dangling
  warning and §11.7 hard-ceiling rejections are in `packages/core`
- Cascade resolution (§12) — Node reader walks the `defaults` chain
- JSON Schema validation against `mosaic.json` record types

## Usage

```bash
python3 validate.py ../examples/A-identity/content
python3 validate.py ../examples/B-sidecars/content
python3 validate.py ../examples/C-cascade/content
python3 validate.py ../examples/D-web/content
```

Expected results:

- `A-identity` — FAIL (the example deliberately contains a
  `collision/about` ambiguity)
- `B-sidecars` — PASS with 1 warning (orphan modifier sidecar by design)
- `C-cascade` — PASS clean
- `D-web` — PASS clean

These four outcomes match the Node CLI exactly. Either tool is a
faithful read of §§5–9.

## Why Python for this companion

Zero install on most Linux/macOS systems; readable in any language; ~280
lines, stdlib only. The point is that the spec is testable without
standing up a build chain. For everything else (resolution, integration
with Astro, etc.) use the Node reader.

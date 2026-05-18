# FolderDB — reference validator seed

A **base-format validator** for Mosaic (§§5–9 of `spec/format/01-format.md`).
Not a product — proves the base format is real and unambiguous by being a
small piece of code that any spec reader can run.

This is the seed for the FolderDB browse/edit app (see
`apps/folderdb-app/` on the `0.9.1-folderdb-app` branch). The Python
validator stays as the always-runnable reference any spec reader can
execute with nothing but a Python install. **Refs (§11) and cascade (§12)
resolution belong to the browser/Node build, not here.**

## Scope (what this validator covers)

- §5 records / §7 naming and identity — full charset and modifier checks
- §6 collections + the file-form / folder-form collision rule
- §8 sidecar matching by base + modifier set
- §7.2 hidden-file and `mosaic.json` manifest handling
- §5.1 markdown frontmatter surfaced as a warning, not an error
- §9 unknown-field preservation is a *writer* obligation; this is a
  read-only validator and therefore does not exercise it

## Out of scope (deferred to the browser/Node build)

- Reference resolution (`02-references.md` §11.4) including the §11.6
  dangling-reference warning and the §11.7 hard-ceiling rejections
- Cascade resolution (`02-references.md` §12) including `defaults` chain
  walking and the §12.5 fixed pipeline
- JSON Schema validation against `mosaic.json` record types
- Bundle / unbundle (`.mosaic`, `.mosaic.html`)
- Browse / edit / save UI

## Usage

```
python3 validate.py ../../spec/examples/A-identity/content
python3 validate.py ../../spec/examples/B-sidecars/content
python3 validate.py ../../spec/examples/C-cascade/content
python3 validate.py ../../spec/examples/D-web/content
python3 validate.py ../../spec/examples/E-spec-as-mosaic/content
python3 validate.py ../../spec/examples/F-opaque-payloads/content
python3 validate.py ../../spec/examples/G-name-violations/content
```

Expected: A and G fail (both intentionally — A is a collision fixture,
G is a §7 name-violation fixture). B/C/D/E/F pass; B emits one warning
(intentional orphan-modifier sidecar).

## Why Python for the seed

Zero install on most Linux/macOS systems; readable by anyone who knows any
language; ~250 lines, stdlib only, no third-party packages. The point is
to make the spec testable without standing up a build chain.

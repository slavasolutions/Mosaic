# FolderDB — reference implementation seed

A **reference validator** for the Mosaic base format. Not a product — proves the spec is real and unambiguous by being a small piece of code that any spec reader can run.

This is the seed for the future **FolderDB** Node/TypeScript implementation (CLI + library + minimal viewer). The Python validator stays as the always-runnable reference any spec reader can execute with nothing but a Python install.

## What it does

- Walks a Mosaic content folder
- Resolves identities per `01-format.md` §7.1
- Detects file-form/folder-form collisions
- Detects orphan modifier sidecars
- Reports a pass/fail with errors and warnings

## Usage

```
python3 validate.py ../../spec/examples/A-identity/content
python3 validate.py ../../spec/examples/B-sidecars/content
python3 validate.py ../../spec/examples/C-cascade/content
python3 validate.py ../../spec/examples/D-web/content
```

Expected: A fails (intentional collision example); B/C/D pass.

## What it does NOT do yet

- Cascade resolution (§12)
- Reference resolution (§11)
- JSON Schema validation against `mosaic.json`
- Bundle / unbundle
- Browse / edit UI

These come with the Node/TS FolderDB build, not this seed.

## Why Python for the seed

Zero install on most Linux/macOS systems; readable by anyone who knows any language; ~250 lines. The point is to make the spec testable without standing up a build chain.

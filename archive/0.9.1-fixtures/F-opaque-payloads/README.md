# F — Opaque payloads, multi-dot names, and `\ref:` escape

Fixture for the Phase 2 validator fix: prove that opaque payloads (`.pdf`,
`.png`, `.csv`) with matching `.json` sidecars resolve correctly **by rule**
per §7, and that multi-dot names work end-to-end.

## Expected validator output

```
RESOLVED RECORDS
  brochure              <- brochure.pdf
  data                  <- data.csv
  escape-demo           <- escape-demo.json
  logo                  <- logo.png
  report                <- report.csv.notes.md

RESULT: PASS  (0 errors, 0 warnings)
```

Each opaque payload is the record's content; its `.json` sidebar (same base
and modifier set) merges onto its metadata per §8 and is not listed
separately. `escape-demo.json` has no content sibling so it IS the content
(the degenerate structured case per §5.1).

## What this fixture covers

- **Opaque payloads with sidecars** (§5, §7.3, §8): `brochure.pdf` +
  `brochure.json`; `logo.png` + `logo.json`; `data.csv` + `data.json`.
  Each pair resolves to a single identity.
- **Multi-dot names** (§7): `report.csv.notes.md` parses as base=`report`,
  modifiers=`[csv, notes]`, ext=`md`. Identity = `report`. Sidecar
  `report.csv.notes.json` matches the same base + modifier set per §8.
- **`\ref:` escape** (§11.2): `escape-demo.json` contains a real `ref:` and
  a `\ref:` literal. The validator doesn't yet resolve references, but the
  fixture documents the escape's normative behaviour for any consumer that
  does.

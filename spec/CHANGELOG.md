# Mosaic Spec Changelog

## 0.9.1 (2026-05-17) — format lock

Fresh, much tighter rewrite. Supersedes the 0.8.x spec and the 14 MIPs.

### Changed

- **Restructured.** Spec collapsed to two short documents: `format/01-format.md` (the base) and `format/02-references.md` (refs + cascade). Three structural rules + consequences.
- **Framing pivot.** A record is an **identity**; the JSON file *describes* it. This single sentence resolves the file-form vs folder-form discussion.
- **Cascade reduced.** Only declared keys cascade. `defaults` lives on collection records (`index.json`). Shallow key-level only — no deep merge, no array concat, no implicit "all fields cascade".
- **References.** Two anchors only (absolute, relative); no cascade anchor. Grammar is `ref:<identity>[#<json-pointer>]`. Nothing else.
- **Locale.** Base format blesses `locale` as the single inheritable key (PRAGMATIC choice over STRICT). Locale *syntax* (`name.fr.json`) is in the base; locale *resolution* is in the i18n/web profile.
- **Variant sidecars are sparse.** Restate only the fields that differ from the canonical sidecar.

### Cut

- Cascade as a reference anchor (`ref:foo` walking ancestors)
- Deep merge / array concatenation in cascade
- Implicit "everything cascades" mode
- Sidecar participation in cascade chain
- Cascading into opaque content
- Wildcards, predicates, content-queries in references (the "hard ceiling" — these will never be in scope)
- The MIP-as-spec-source process; MIPs archived to `archive/0.9-old-mips/`
- The monolithic `SPEC.md`; archived to `archive/0.9-old-spec.md`

### Decisions (locked)

See `format/DECISIONS-locked.md` for the full text of each decision and what was rejected.

| # | Decision | Pick |
|---|---|---|
| 0 | Framing: record = identity, file = description | **confirmed** |
| 1 | File-form vs folder-form coexistence | **two spellings of one identity; both-at-once = error** |
| 2 | Cascade scope (STRICT vs PRAGMATIC) | **PRAGMATIC** |
| 3 | Variant sidecars (sparse vs complete) | **sparse** |
| 4 | Web profile routing root | **configurable, default `pages/`** |
| 5 | Locale: base or profile? | **follows #2 — base blesses `locale`** |

### Validator

`apps/folderdb/validate.py` is the reference validator. Runs against the four examples in `spec/examples/`.

## 0.9 (earlier 2026-05) — realignment

Pre-rewrite. See `archive/0.9-old-mips/` for the 14 MIPs and `archive/0.9-old-spec.md` for the 0.8.x-style monolithic spec that fed into the 0.9.1 lock.

## 0.8.1 and earlier

See `archive/0.8.1/` for snapshots.

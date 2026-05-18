# Mosaic Spec Changelog

## 0.9.1 (2026-05-17/18) — format lock + hardening pass

Fresh, much tighter rewrite plus a four-phase hardening pass. Supersedes
the 0.8.x spec and the 14 MIPs.

### Hardening pass (Phases 1–4)

The format is unchanged. Spec text only got clearer; the validator gained
a rule-by-rule name parser; the example corpus gained three fixtures
(opaque payloads, name violations, and the dogfood spec-as-Mosaic);
nothing was added that the spec doesn't already require.

| Phase | Commit | What changed |
|---|---|---|
| 1 | `3af28d3` | Cascade-scope contradiction resolved across §12, the README, CHANGELOG, and DECISIONS-locked.md — PRAGMATIC is consistent everywhere. |
| 2 | `3f5a678` | Validator now implements §7 directly: extension required, base+modifier charset enforced inside `split_name()`. `\ref:` escape pinned down in §11.2 (single sentence). F-opaque-payloads + G-name-violations fixtures added. |
| 3 | `2c1a26b` | `E-spec-as-mosaic` — the spec encoded as a Mosaic folder (~30 records, 4 chapters, one French sparse variant). Surfaces the §12.4 "collection-record sidecar participation in cascade" ambiguity as a finding to escalate, not a rule to add. |
| 4 | (this commit) | README pain-first lead; identity pivot promoted to §1.1; resolution pipeline added as §1.2 forward reference; `profile` defined in terminology; `02-references.md` opening tightened (no more "promotes itself"); validator scope honest in both READMEs. |

### Changed

- **Restructured.** Spec collapsed to two short documents: `format/01-format.md` (the base) and `format/02-references.md` (refs + cascade). Three structural rules + consequences.
- **Framing pivot.** A record is an **identity**; the JSON file *describes* it. This single sentence resolves the file-form vs folder-form discussion.
- **Cascade reduced.** Only the base-blessed key `locale` and keys explicitly declared by a profile or schema cascade. `defaults` lives on collection records (`index.json`). Shallow key-level only — no deep merge, no array concat, no implicit "all fields cascade".
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

### Validator + reference app

`apps/folderdb/validate.py` is the reference base-format validator (§§5–9).
Stdlib Python, ~280 lines after Phase 2. Covers naming, identity, sidecar
matching, file/folder collisions, frontmatter-as-inert. Does NOT yet
implement reference resolution (§11.4) or cascade (§12) — those land in
the browser/Node FolderDB app at `apps/folderdb-app/` on branch
`0.9.1-folderdb-app`.

The FolderDB app (built by a teammate session) is a 0-dependency single-page
PWA that ports the validator to JavaScript and adds record browsing, tree
view, refs/cascade visualisation, and PWA-install / Vercel-host capability.
All 6 spec example fixtures (A through G excluding E) validate to identical
counts in both the Python and JS implementations.

### Example fixtures

- `A-identity` — file/folder collision (intentional FAIL)
- `B-sidecars` — orphan modifier sidecar warning
- `C-cascade` — collection records with `defaults`
- `D-web` — `pages/` routing shape (no base-format change)
- `E-spec-as-mosaic` — the spec, encoded as a Mosaic folder; ~30 records,
  4 chapters, one French sparse variant; the dogfood acceptance test
- `F-opaque-payloads` — `.pdf` / `.png` / `.csv` + sidecars + multi-dot
  names + `\ref:` escape demonstration
- `G-name-violations` — §7 charset violations (intentional FAIL, 4 errors)

## 0.9 (earlier 2026-05) — realignment

Pre-rewrite. See `archive/0.9-old-mips/` for the 14 MIPs and `archive/0.9-old-spec.md` for the 0.8.x-style monolithic spec that fed into the 0.9.1 lock.

## 0.8.1 and earlier

See `archive/0.8.1/` for snapshots.

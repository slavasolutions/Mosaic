# Mosaic Specification

**Version:** 0.9.1 (draft — format locked, not 1.0)
**Status:** Working Draft
**Scope:** the base format only. Mosaic Web and other separate specifications layer on top.

---

## Why Mosaic exists

Git-friendly content stores keep reinventing the same handful of folder,
naming, and metadata rules — incompatibly. Every CMS that wants to "just be
files" ends up improvising its own version of identity, sidecars, variants,
inheritance, and cross-references. The decisions are usually reasonable
in isolation and almost never the same. Tools written against one set don't
work against another. Authors learn the local dialect, get locked in to
it, and lose the very portability that "just files" was supposed to grant.

**Mosaic is that rule set, frozen and specified.** Three structural rules,
a naming grammar, a sidecar convention, and a small reference grammar —
nothing more. Any tool that follows the rules can read any folder that
follows them. The filesystem is the database; the spec is the contract.

## What it actually is

1. A convention for using a plain folder as a structured content store —
   files are records, folders are collections.
2. The filesystem is the source of truth; no database engine, no daemon,
   no required runtime.
3. The base format is small on purpose: three structural rules plus
   naming, sidecar, and unknown-field follow-ons.
4. Anything web-shaped (pages, routes, design tokens, redirects) lives in
   a separate specification, not in the base.
5. Tools (validators, editors, renderers) consume the format; nothing in
   the format depends on a particular tool.

## What's in this folder

| File | Purpose |
|---|---|
| `format/01-format.md` | The base format. Three structural rules + sidecars + unknown-field preservation. |
| `format/02-references.md` | Content references (`ref:`) and the minimal cascade definition. Hard ceiling against XPath re-derivation. |
| `format/DECISIONS-locked.md` | The 5 decision forks resolved on 2026-05-17 and what each one cut. |
| `schemas/mosaic.schema.json` | JSON Schema 2020-12 for `mosaic.json` manifests. |
| `examples/` | Four worked examples (identity, sidecars, cascade, web-profile shape) used by the validator. |
| `CHANGELOG.md` | What changed between drafts. |

## The three structural rules (headline)

| # | Rule | Plain English |
|---|---|---|
| 1 | A file is a record | `.json` files hold structure directly; non-`.json` files (`.md`, `.pdf`, …) are opaque payloads with optional `.json` sidecars. |
| 2 | A folder is a collection | Folders nest; an `index.{json,md,…}` file represents the folder itself as a record. |
| 3 | The filename is the contract | `name[.modifier]*.ext`; identity is form-independent (`about.json` and `about/index.json` resolve to the same identity `about`). |

**Sidecars** (§8 of `01-format.md`) and **unknown-field preservation** (§9) follow from these three; they are consequences, not separate rules.

## What's deliberately **out of scope** in the base

- References between records (defined separately in `02-references.md` so the base stays portable for non-linking uses)
- Routing / URLs (web profile, future doc)
- Validation schemas beyond manifest structure (consumer concern)
- Bundling / transport (consumer concern)

A consumer **MAY** implement any of these; doing so **MUST NOT** require deviating from the base.

## Locked decisions (2026-05-17)

See `format/DECISIONS-locked.md` for the full reasoning. Headline:

1. **Framing.** A record is an identity; the JSON describes it.
2. **Identity forms.** `about.json` and `about/index.json` are two spellings of one identity; both-at-once is the one collision error.
3. **Cascade scope: PRAGMATIC.** The base format blesses `locale` as the single inheritable key; everything else is profile/schema-declared.
4. **Sparse variant sidecars.** Variants restate only the fields that differ.
5. **Web profile routing.** Configurable root (default `pages/`), specified in the web profile doc — not the base.

## How to verify the spec is real

```
python3 ../apps/folderdb/validate.py spec/examples/A-identity/content
python3 ../apps/folderdb/validate.py spec/examples/B-sidecars/content
python3 ../apps/folderdb/validate.py spec/examples/C-cascade/content
python3 ../apps/folderdb/validate.py spec/examples/D-web/content
python3 ../apps/folderdb/validate.py spec/examples/E-spec-as-mosaic/content
python3 ../apps/folderdb/validate.py spec/examples/F-opaque-payloads/content
python3 ../apps/folderdb/validate.py spec/examples/G-name-violations/content
```

`A-identity` and `G-name-violations` are the only examples that fail (both
intentionally — `A` contains a `collision/about` ambiguity, `G` is a
deliberate fixture of §7 name-rule violations).

### What the validator does and does NOT cover

The Python validator at `apps/folderdb/validate.py` is the executable
companion to §§5–9 of the base format only: it enforces names, identity,
sidecar matching, file-form/folder-form collisions, frontmatter-as-inert,
and manifest preservation. It does **not** yet resolve references
(`format/02-references.md` §11) or apply cascade (§12); those normative
rules are documented in the spec and will land in the Node/TS FolderDB
build at `apps/folderdb-app/`. The four examples that exercise refs and
cascade pass structurally; runtime resolution is the next implementation
beat, not a spec gap.

## What's next (not in this draft)

- Mosaic Web profile (a separate spec doc, after the base is stable for a beat)
- FolderDB reference implementation polish (the `apps/folderdb/validate.py` is the seed; CLI + browse UI come after)
- Mosaic Studio (Tauri + Svelte editor; later)
- Clear (commercial CMS; separate repo, closed)

This is **0.9.1**, not 1.0. The format is locked at the headline; details may still shift before 1.0 based on real-world consumer feedback.

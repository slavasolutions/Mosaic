<p align="center"><img src="../logo.svg" width="64" alt="Mosaic logo"></p>

# Mosaic Specification

**Version:** 0.9.2 (draft — format locked, not 1.0)
**Status:** Working Draft
**Scope:** the base format. Profiles (e.g. the `mosaic-web` profile for routing) layer on top in separate documents and never modify the base.

### Two-layer model

The spec is organised in **two layers** so each consumer pays only for what it needs:

```
   ┌──────────────────────────────────────────────────────┐
   │  Profiles   →  mosaic-web (routing), future feed,    │
   │                future archive…                        │
   ├──────────────────────────────────────────────────────┤
   │  Base       →  records, collections, identity,        │
   │                sidecars, refs, cascade (§§5–12)       │
   └──────────────────────────────────────────────────────┘
```

A folder MUST conform to the base. Profiles are OPTIONAL — they add per-domain rules (URL derivation, feed-shape, etc.) that domain-specific consumers care about. The base spec never mentions URLs; that talk lives entirely in the web profile.

Concrete: an RSS reader, an AI ingest tool, or an archive index only needs the base. An Astro/Next/static-site-generator engine needs the base plus `mosaic-web`.

---

## Why Mosaic exists

Git-friendly content stores keep reinventing the same handful of folder, naming, and metadata rules — incompatibly. Every CMS that wants to "just be files" ends up improvising its own version of identity, sidecars, variants, inheritance, and cross-references. The decisions are usually reasonable in isolation and almost never the same. Tools written against one set don't work against another. Authors learn the local dialect, get locked in, and lose the very portability that "just files" was supposed to grant.

**Mosaic is that rule set, frozen and specified.** Three structural rules, a naming grammar, a sidecar convention, and a small reference grammar — nothing more. Any tool that follows the rules can read any folder that follows them. The filesystem is the database; the spec is the contract.

## What it actually is

1. A convention for using a plain folder as a structured content store — files are records, folders are collections.
2. The filesystem is the source of truth; no database engine, no daemon, no required runtime.
3. The base format is small on purpose: three structural rules plus naming, sidecar, and unknown-field follow-ons.
4. Anything web-shaped (pages, routes, design tokens, redirects) lives in a separate specification, not in the base.
5. Tools (validators, editors, renderers) consume the format; nothing in the format depends on a particular tool.

## What's in this folder

| File | Purpose |
|---|---|
| `format/01-format.md` | The base format. Three structural rules + sidecars + unknown-field preservation. |
| `format/02-references.md` | Content references (`ref:`) and the minimal cascade definition. Hard ceiling against XPath re-derivation. |
| `format/DECISIONS-locked.md` | The five decisions resolved during the 0.9.1 draft and what each one cut. |
| `schemas/mosaic.schema.json` | JSON Schema 2020-12 for `mosaic.json` manifests. |
| `tools/validate.py` | Reference validator — Python stdlib, runs the spec rules against any folder. |
| `examples/` | Four worked examples (identity, sidecars, cascade, the Mosaic Web profile shape). |
| `profiles/mosaic-web.md` | The first profile spec — routing, configurable root, URL derivation. Layers on the base; does not change it. |
| `profiles/mosaic-web-seo.md` | Non-normative explainer — how URL derivation, Schema.org JSON-LD, and HTML meta tags combine for SEO. |
| `profiles/mosaic-web-migration.md` | Non-normative explainer — moving an existing site (HTML, CMS, SSG, JSX) into Mosaic. Pairs with `@ssolu/mosaic-migrate`. |
| `CHANGELOG.md` | What changed between drafts. |

## The three structural rules (headline)

| # | Rule | Plain English |
|---|---|---|
| 1 | A file is a record | `.json` files hold structure directly; non-`.json` files (`.md`, `.pdf`, …) are opaque payloads with optional `.json` sidecars. |
| 2 | A folder is a collection | Folders nest; an `index.{json,md,…}` file represents the folder itself as a record. |
| 3 | The filename is the contract | `name[.modifier]*.ext`; identity is form-independent (`about.json` and `about/index.json` resolve to the same identity `about`). |

**Sidecars** (§8 of `01-format.md`) and **unknown-field preservation** (§9) follow from these three; they are consequences, not separate rules.

## What's deliberately **out of scope** in the base

- Routing / URLs (web profile, future doc)
- Validation schemas beyond manifest structure (consumer concern)
- Bundling / transport (consumer concern)

A consumer **MAY** implement any of these; doing so **MUST NOT** require deviating from the base.

## Locked decisions

See `format/DECISIONS-locked.md` for full reasoning. Headline:

1. **Framing.** A record is an identity; the JSON describes it.
2. **Identity forms.** `about.json` and `about/index.json` are two spellings of one identity; both-at-once is the one collision error.
3. **Cascade scope: PRAGMATIC.** The base format blesses `locale` as the single inheritable key; everything else is profile/schema-declared.
4. **Sparse variant sidecars.** Variants restate only the fields that differ from the canonical sidecar.
5. **Web profile routing.** Configurable root (default `pages/`), specified in a future web-profile doc — not the base.

## How to verify the spec is real

```
python3 spec/tools/validate.py spec/examples/A-identity/content
python3 spec/tools/validate.py spec/examples/B-sidecars/content
python3 spec/tools/validate.py spec/examples/C-cascade/content
python3 spec/tools/validate.py spec/examples/D-web/content
```

`A-identity` is the only example that fails (intentionally — it contains a deliberate `collision/about` ambiguity that the spec forbids). `B-sidecars` passes with one intentional warning (orphan modifier sidecar). `C-cascade` and `D-web` pass clean.

### What the validator covers

The Python validator at `tools/validate.py` is the executable companion to §§5–9 of the base format: names, identity, sidecar matching, file-form / folder-form collisions, frontmatter-as-inert, manifest preservation. It does **not** yet resolve references (§11) or apply cascade (§12) at runtime; those normative rules are documented in the spec and will be implemented by downstream consumers (editors, renderers). The four examples that exercise refs and cascade pass structurally; runtime resolution is the next implementation beat, not a spec gap.

## What's deferred to future versions

- **Mosaic Web profile** is in 0.9.2 (`profiles/mosaic-web.md`) — but covers only routing for now. Design tokens, redirects, sitemaps come in a later iteration.
- Profile mechanism clauses in the base (§5.2 extraction rule, §7.2 profile-visible carve-out) — drafted in 0.9.1; rolled back here pending a real consumer
- Heavier example fixtures (spec-as-Mosaic dogfood, opaque payloads, name-violation negative test) — preserved in the sibling `../mosaic-archive/0.9.1-fixtures/` folder for whoever needs them

This is **0.9.2**, not 1.0. The format is locked at the headline; details may still shift before 1.0 based on real-world consumer feedback.

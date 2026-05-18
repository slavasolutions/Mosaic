# E — Spec as Mosaic (dogfood)

**The Mosaic spec, encoded as a Mosaic folder.** Every numbered section of
the spec (`01-format.md` §1–§10, `02-references.md` §11–§12) is a record.
Every cross-reference between sections is a `ref:` string. Cascade carries
`locale` and `spec_version`. One French variant proves sparse sidecar
overrides.

## Why this exists

If the spec cannot describe the shape of a document like itself, the spec
is incomplete. This folder is the strongest possible acceptance test: a
realistic, long-form, cross-referenced document — namely, *this very
specification* — fitting through the format's rules without any new rule,
profile, or escape hatch.

## Structure

```
content/
  mosaic.json                  # manifest: record types, cascading keys
  index.{json,md}              # the spec root
  format/                      # §1–§10
    index.{json,md}            # "Base format" chapter intro
    notation.{json,md}         # §2
    terminology.{json,md}      # §3
    conformance.{json,md}      # §4
    records.{json,md}          # §5 (+ §5.1 inline)
    collections.{json,md}      # §6
    naming.{json,md}           # §7 (+ §7.1, §7.2, §7.3 inline)
    naming.fr.{json,md}        # French variant — sparse sidecar
    sidecars.{json,md}         # §8
    unknown-fields.{json,md}   # §9
    out-of-scope.{json,md}     # §10
  references/                  # §11
    index.{json,md}
    value.{json,md}            # §11.2 (includes \ref: escape)
    grammar.{json,md}          # §11.3
    resolution.{json,md}       # §11.4
    typing.{json,md}           # §11.5
    dangling.{json,md}         # §11.6
    hard-ceiling.{json,md}     # §11.7 — the XPath ceiling
  cascade/                     # §12
    index.{json,md}
    problem.{json,md}          # §12.1
    danger.{json,md}           # §12.2
    minimal-definition.{json,md}  # §12.3 — the cascade rules
    what-was-cut.{json,md}     # §12.4
    resolution-order.{json,md} # §12.5 — the fixed pipeline
  decisions/                   # the 5 locked decisions
    index.{json,md}
    framing.{json,md}          # Decision 0
    identity-forms.{json,md}   # Decision 1
    cascade-scope.{json,md}    # Decision 2 (PRAGMATIC)
    sidecar-variants.{json,md} # Decision 3
    web-routing.{json,md}      # Decision 4
```

**~32 records total.** Each carries a `.md` body (the prose) plus a `.json`
sidecar (title, section number, `see_also` cross-references).

## What it demonstrates, mapped to spec sections

| Demo | Spec | Where in this fixture |
|---|---|---|
| File-form record | §7.1 | every leaf section (e.g. `format/notation.{json,md}`) |
| Folder-form record (`index.*`) | §6 | each chapter folder root (`format/`, `references/`, `cascade/`, `decisions/`) |
| Sidecar matching modifier set | §8 | `format/naming.fr.json` ↔ `format/naming.fr.md` |
| Sparse variant override | Decision 3 | `format/naming.fr.json` restates only `title` and `locale` |
| Locale cascade (base-blessed) | §12.3 + Decision 2 | root `defaults.locale = "en"`; every record inherits |
| Profile-declared cascade key | §12.3.5 + `mosaic.json` | manifest declares `spec_version` cascading for `spec-section` records |
| `defaults` on collection record | §12.3.1 | every `format/index.json`, `references/index.json`, etc. |
| Cross-reference between records | §11.2, §11.3 | every `see_also` array and every inline `ref:` in prose |
| Manifest preserved verbatim | §7.2 | `mosaic.json` declares record types; not enumerated as a record |

## Acceptance criterion

This fixture validates **with zero errors and zero warnings** under the
Phase 1+2 validator. If any new spec rule were needed to make this work,
the spec would be wrong; the spec is right; therefore this works.

See `EXPECTED.md` for the resolved-records listing.

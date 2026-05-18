# E — Expected validator output

Self-check for the spec-as-Mosaic dogfood fixture.

## Expected: PASS (0 errors, 0 warnings)

```
RESOLVED RECORDS
  (root)                       <- index.md
  cascade                      <- cascade/index.md
  cascade/danger               <- cascade/danger.md
  cascade/minimal-definition   <- cascade/minimal-definition.md
  cascade/problem              <- cascade/problem.md
  cascade/resolution-order     <- cascade/resolution-order.md
  cascade/what-was-cut         <- cascade/what-was-cut.md
  decisions                    <- decisions/index.md
  decisions/cascade-scope      <- decisions/cascade-scope.md
  decisions/framing            <- decisions/framing.md
  decisions/identity-forms     <- decisions/identity-forms.md
  decisions/sidecar-variants   <- decisions/sidecar-variants.md
  decisions/web-routing        <- decisions/web-routing.md
  format                       <- format/index.md
  format/collections           <- format/collections.md
  format/conformance           <- format/conformance.md
  format/naming                <- format/naming.fr.md, format/naming.md
  format/notation              <- format/notation.md
  format/out-of-scope          <- format/out-of-scope.md
  format/records               <- format/records.md
  format/sidecars              <- format/sidecars.md
  format/terminology           <- format/terminology.md
  format/unknown-fields        <- format/unknown-fields.md
  references                   <- references/index.md
  references/dangling          <- references/dangling.md
  references/grammar           <- references/grammar.md
  references/hard-ceiling      <- references/hard-ceiling.md
  references/resolution        <- references/resolution.md
  references/typing            <- references/typing.md
  references/value             <- references/value.md

RESULT: PASS  (0 errors, 0 warning(s))
```

The listing shows the **content** file for each record (the `.md`). The
matching `.json` sibling is recognised as the record's **sidecar** per §8
and merged onto the record's metadata; sidecars are not listed separately
because they share the record's identity. The `format/naming` record is the
one with two listed sources — the canonical content plus the `.fr` variant.

## What this fixture proves

1. **The spec describes its own document shape.** Each §-numbered section
   is a record. Each cross-reference is a `ref:` string. Each chapter is a
   collection with `index.{md,json}` describing it.

2. **Sparse variant sidecars work.** `format/naming.fr.md` is a French
   translation; its companion `format/naming.fr.json` restates only `title`
   and `locale`. Every other field (section_number, see_also) falls back to
   the canonical sidecar per Decision 3.

3. **Folder form and file form coexist without collision.** Every leaf
   section is a file-form record under its chapter folder; each chapter
   folder has an `index.{md,json}` (the folder as a record). Different
   identities — no collision.

4. **`mosaic.json` is the manifest, not a record.** Validator handles it
   per §7.2: parses, preserves, does NOT enumerate as a record.

## Finding surfaced — §12.4 needs clarification (critic finding #5)

The fixture surfaces a real spec ambiguity. Each chapter folder has both
`index.json` (with `defaults`) and `index.md` (prose). Under §8 the
`index.json` is the **sidecar** for `index.md`. Under §12.4 sidecars are
**cut** from cascade participation. So the §12.3.1 statement that
"a collection record (`index.json` per §6) MAY contain a top-level object
field named `defaults`" runs into the sidecar-cut at §12.4 when an
`index.md` also exists.

Two equally consistent readings:

- **Reading A** — when `index.json` IS the collection record (i.e. the folder
  has a `defaults`-bearing `index.json`), it participates in the cascade
  chain *even if* an `index.md` sibling makes it formally a sidecar.
  Cascade reads the merged effective JSON for the collection record.
- **Reading B** — `defaults` blocks only cascade when the collection record
  is structured-only (no opaque `index.md` sibling). Folders that want
  prose AND cascade must put prose into a different record, not `index.md`.

This fixture validates structurally under either reading; it does NOT yet
exercise cascade at runtime because the validator does not resolve cascade
(deferred to FolderDB Node/TS build). When cascade resolution lands, the
choice between Reading A and Reading B becomes observable. **Per the Phase
3 acceptance criterion, this is a finding to escalate, not a rule to add.**

Recommended resolution: Reading A (collection-record sidecars contribute
their `defaults` to the chain). It preserves the natural pattern of pairing
chapter prose with chapter structure. The spec should state this in §12.4
explicitly.

## What this fixture does NOT yet prove

- **Reference resolution and dangling-ref warnings** (§11.4, §11.6). The
  current validator parses identities and modifiers but does NOT walk
  `ref:` strings. A dedicated dangling-ref fixture lands when the Node/TS
  FolderDB build implements ref resolution.
- **Cascade resolution at runtime.** Declared in the spec, not yet
  executed. The structural shape is correct; the runtime semantics await
  the next implementation — and the choice between Reading A and Reading B
  above.

## How to run

```
python3 ../../../apps/folderdb/validate.py spec/examples/E-spec-as-mosaic/content
```

(from the repository root)

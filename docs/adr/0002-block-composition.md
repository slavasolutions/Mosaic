# ADR 0002 — Block composition via section refs

**Status:** Accepted
**Date:** 2026-05-19

## Context

Real pages on real sites are not one body of text. They are a stack of
distinct sections — a hero, a mission statement, a featured-story
grid, an upcoming-events block, a CTA. Each section has its own
content, its own attributes, and is often reused across pages.

A Mosaic-native pattern needs to support:

1. **Reuse** — the same section block appearing on multiple pages.
2. **Reordering** — changing the visual stack without touching markup.
3. **Per-section attributes** — alignment, theme, variant, etc.
4. **Future visual editing** — a drag-and-drop editor writes the same
   shape an author writes by hand.
5. **No new spec primitive** — solve this with the rules already
   shipped (records, refs, cascade, variants).

The base format gives us all the parts already. This ADR codifies the
canonical assembly.

## Decision

Each block is its own record under a snippets collection
(conventionally `/snippets/<name>.json`, but the name is up to the
site). The page record holds an **ordered array of refs** in a
reserved field named `sections`:

```json
{
  "@type": "WebPage",
  "title": "Home",
  "sections": [
    "ref:/snippets/hero-home",
    "ref:/snippets/mission",
    "ref:/snippets/featured-stories"
  ]
}
```

At read time the ref resolution pipeline (`02-references.md` §11.4)
inlines each referenced record. The adapter iterates the resolved
array and renders each section by its `@type` (or any other
shape-discriminating field), looking up a component in its own
section-type map.

The three referenced snippet records are ordinary Mosaic records:

```json
// /snippets/hero-home.json
{ "@type": "Hero", "title": "Welcome", "image": "/hero.jpg", "align": "center" }

// /snippets/mission.json
{ "@type": "MissionStatement", "body": "Build small, ship often." }

// /snippets/featured-stories.json
{ "@type": "Grid", "items": ["ref:/blog/hello", "ref:/blog/refs-explained"] }
```

Rendered HTML stack (adapter-defined; illustrative):

```html
<section class="hero hero--center">
  <h1>Welcome</h1><img src="/hero.jpg">
</section>
<section class="mission"><p>Build small, ship often.</p></section>
<section class="grid">…two BlogPosting cards…</section>
```

The field name `sections` is a convention (not yet a reserved name in
the spec). When this pattern proves out in production adapters, the
mosaic-web profile MAY add a normative clause reserving the name; for
now it works as a plain Mosaic field.

## Consequences

- **Reordering a page is editing one JSON array.** No markup change,
  no layout file change. The adapter loop is the same.
- **Reuse is free.** The same `ref:/snippets/mission` appears in any
  page that wants it. Edit the snippet once; every page updates.
- **Per-section variants use Path A.** A `hero-home.fr.json` sidecar
  gives the hero a French variant; the page's ref still says
  `ref:/snippets/hero-home`, the consumer picks the right modifier-set
  per locale. A/B variants use empty-but-named modifier sets the same
  way.
- **Visual editor parity.** A future drag-and-drop editor produces
  the same `sections: [ref:…, …]` array a hand author writes. There
  is no special "block schema" — every block is just a record.
- **Section-type registry is an adapter concern.** Each adapter
  maintains its own map from `@type` (or whatever
  shape-discriminating key it picks) to a component / template. The
  spec does not enumerate section types; the same Mosaic folder can
  render through different adapters with different component sets.
- **Schema.org friendly.** Because each section record can declare an
  `@type`, the JSON-LD output (mosaic-web §6) naturally produces a
  nested graph: a `WebPage` containing `Hero`, `MissionStatement`,
  etc. as `mainEntityOfPage` children when the adapter chooses to
  embed them.

## Alternatives considered

- **(A) Inline section data on page records** — e.g. `sections: [{ type: "Hero", title: "…" }, …]`.
  Rejected: no reuse across pages, no variants per section, no
  identity for a block (so refs can't point at it), and an editor
  needs a parallel "block schema" that diverges from records.
- **(B) New `Block` primitive in the spec** — a reserved record kind
  with its own merge rules. Rejected: the existing record + ref +
  cascade primitives already do this. Adding a primitive grows the
  base format for a problem the base format already solves.
- **(C, chosen) Each block is a record; pages hold ordered refs.**
  Reuses the spec we already have. Refs already resolve at build
  time; identity already gives blocks stable names; variants already
  give per-locale and per-context blocks; the pipeline ordering
  (content → body → sidecar → cascade → refs) means the resolved
  page comes with sections inlined.

## Cross-references

- `spec/format/01-format.md` §5 — Records (each block is a record).
- `spec/format/02-references.md` §11 / §11.4 — ref grammar and
  resolved-reference embedding.
- `spec/profiles/mosaic-web.md` §6 — Schema.org structured data
  (section `@type`s produce a nested JSON-LD graph).
- `docs/adr/0001-body-format-agnosticism.md` — pairs with this ADR:
  the body of a section block follows §5.2 and ADR 0001 like any
  other record.

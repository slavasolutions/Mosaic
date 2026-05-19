# Mosaic Web — Migration explainer (non-normative)

**Status:** Explainer. Companion to `mosaic-web.md` and
`mosaic-web-seo.md`. Pointer doc — links to the spec clauses, ADRs,
and the migration scanner. Adds no normative requirements.

**Audience:** someone with an existing site — hand-rolled HTML, a
classic CMS, a static-site generator output, a JSX-based app — who
wants to move into Mosaic without rewriting everything in one sitting.
This document maps the parts of your existing site to the Mosaic
shapes that absorb them.

---

## 1. Who this is for

You have content today. It might be:

- A folder of `.html` files behind a deploy pipeline.
- A WordPress / Ghost / Drupal export.
- A static-site-generator project (Eleventy, Hugo, Jekyll) you want to
  move off.
- A JSX/MDX-based site whose authoring shape has drifted.

You do not want to throw it away. You want to **ramp into Mosaic** —
get the structural benefits (stable URLs, ref resolution, JSON-LD,
meta tags, theme tokens) without losing what already works. This
explainer is the map.

The first thing to know: Mosaic does not require any single migration
path. Everything below is a *menu*. Pick the items that match your
existing site; skip the rest.

## 2. HTML bodies — keep what you have

If your existing content is HTML, you do not need to convert it to
markdown. Base format §5.2 (`format/01-format.md`) recognises `.html`
as a body extension alongside `.md`, `.txt`, and `.adoc` — the full
`TEXT_BODY_EXTENSIONS` set. ADR 0001
(`docs/adr/0001-body-format-agnosticism.md`) records the position:
markdown is one popular convention, not the convention.

The migration shape:

```
old-site/about.html
   ↓  (move into the Mosaic folder, add a JSON sidecar)
content/pages/about.html        ← the body, as-is
content/pages/about.json        ← title, @type, meta, …
```

A conforming adapter renders the `.html` body through a sanitiser
(rehype-sanitize is the convention) and passes it through to the
rendered page. Your existing markup keeps working; the JSON sidecar
adds the structured metadata Mosaic needs.

If your site mixes HTML and markdown bodies in the same folder, the
adapter dispatches by file extension. No flag, no config — Mosaic
already handles both.

## 3. External assets — your bucket stays put

Mosaic does not require you to move images, videos, or PDFs into the
Mosaic folder. A record references an external asset the same way a
modern web page does — by URL.

```json
{
  "@type": "BlogPosting",
  "title": "Hello",
  "hero": "https://assets.example.com/hero.png",
  "meta": {
    "og": { "image": "https://assets.example.com/hero.png" }
  }
}
```

R2, S3, a CDN, GitHub Pages on a different repo — any URL works.
`meta.og.image` (mosaic-web §7) reuses the same URL the page's
markup uses. The base format never mandates a colocated assets
directory.

Two patterns work in practice:

- **External-only.** All assets live in a bucket. Records carry
  URLs. Easiest migration; nothing to move.
- **Mixed.** Big assets in the bucket, small per-page assets
  colocated in the Mosaic folder. The adapter resolves both — local
  paths become rooted URLs, external URLs pass through.

A future profile MAY codify a preferred shape; today both are
conforming.

## 4. Block composition — turn layout into data

A page that today looks like a hand-stacked layout — hero, mission,
grid, CTA, footer — becomes a Mosaic page record holding an ordered
array of refs to section blocks. ADR 0002
(`docs/adr/0002-block-composition.md`) is the recorded pattern.

```json
// content/pages/index.json
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

Each `ref:/snippets/...` resolves to a snippet record that holds the
block's content + attributes. The adapter iterates the resolved
`sections` array and renders each block by its `@type`.

What you gain:

- **Reordering** is editing one JSON array, not a layout file.
- **Reuse** is a ref. The same mission snippet drops into any page
  that wants it.
- **Per-section variants** (locale, A/B) use the standard
  variant-modifier model from base §7.1 — no new mechanism.

What you lose: the layout file as the source of truth. A page's
visual stack now lives in its `sections` array, not in HTML.

## 5. Tokens — extract repeated styles once

If your existing CSS repeats colours, font families, or spacing
values, the **mosaic-design-tokens** profile gives them an
addressable home. Move them into `tokens/index.json`:

```json
{
  "color": {
    "primary":   "#0b6efd",
    "ink":       "#222222",
    "paper":     "#f7f7f8"
  },
  "font": { "sans": "Inter, sans-serif" },
  "space": { "sm": "0.5rem", "md": "1rem", "lg": "2rem" }
}
```

Adapters that load the tokens profile inject these into the rendered
output (CSS custom properties is the common shape). Changing one
token in `tokens/index.json` flows through every page.

See `spec/profiles/mosaic-design-tokens.md` for the normative profile.

## 6. Repeated content — CTAs, footers, headers

Strings that appear on every page (a footer disclaimer, a header
nav, a CTA copy block) become records under `/snippets/`:

```
content/snippets/footer.json
content/snippets/header-nav.json
content/snippets/cta-newsletter.json
```

Pages reference them by ref. Edit the snippet record once; every
referencing page updates. This is the §4 block-composition pattern
applied to small repeated pieces rather than full sections.

If a CTA needs per-locale copy, give the snippet a variant
(`cta-newsletter.fr.json`). The ref doesn't change; the consumer
picks the right variant.

## 7. Tooling — the scanner

`@ssolu/mosaic-migrate` is a scanner that walks an existing site and
reports opportunities to extract the shapes above. Read-only — it
never rewrites your files.

```
npx @ssolu/mosaic-migrate scan ./path/to/your/site
```

The output is a markdown report (and a JSON companion) listing
findings per detector: hardcoded colours that look like tokens,
strings that repeat across files (likely snippet candidates), HTML
`<meta>` tags that would become record-level `meta` blocks, CTA
patterns ripe for the block-composition treatment, and image URLs
grouped by external vs local. Each finding includes the file paths
and lines so you can decide what to extract first.

The scanner is heuristic. It surfaces candidates; you decide which
ones to act on. See `packages/migrate/` for the implementation and
the v1 detector list.

## 8. What this explainer does NOT do

To calibrate expectations:

- It does **not** move your data. You move records, snippets,
  tokens, and asset URLs into the Mosaic folder. The scanner
  suggests; you choose.
- It does **not** pick names. Snippet identifiers, token names, and
  block `@type`s are your call. The format treats them as opaque.
- It does **not** preserve your URL structure automatically. URLs
  come from filesystem identity (mosaic-web §3) — if you keep your
  existing folder shape under the configured `root`, URLs match.
  Otherwise, you choose.
- It does **not** handle redirects. The mosaic-web profile
  explicitly defers redirects (§8 — out of scope) until a consumer
  demands them.
- It does **not** rewrite your CMS. If your existing system has
  features Mosaic doesn't (workflow, multi-author review, editor UI),
  evaluate before committing. Mosaic is a folder format, not a CMS
  replacement.

---

## Cross-references

- `format/01-format.md` §5.2 — the `body` field (text extensions
  `{.md, .txt, .html, .adoc}`).
- `format/01-format.md` §7.1 — variants for locale / A/B.
- `profiles/mosaic-web.md` §3 — URL derivation from identity.
- `profiles/mosaic-web.md` §6 / §7 — JSON-LD + meta tags.
- `profiles/mosaic-design-tokens.md` — tokens profile.
- `profiles/mosaic-web-seo.md` — SEO surfaces produced by the above.
- `../../docs/adr/0001-body-format-agnosticism.md` — why HTML bodies
  are first-class.
- `../../docs/adr/0002-block-composition.md` — the `sections: [ref:…]`
  pattern.
- `packages/migrate/` — the `@ssolu/mosaic-migrate` scanner.

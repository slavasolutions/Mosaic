# Mosaic Web — SEO context (non-normative)

**Status:** Explainer. Companion to `mosaic-web.md`. Nothing in this
document creates new normative requirements; it links to the normative
clauses in `mosaic-web.md` and explains how a real adopter gets good
SEO out of them.

**Audience:** a developer or technical author evaluating whether a
Mosaic folder is a sensible home for a content site that needs to rank
in search results and unfurl cleanly on social platforms.

---

## 1. What Mosaic gives you for free

Three properties of the base format do most of the SEO work before
anyone writes a `meta` block:

1. **Content lives in plain JSON.** Every field is a string in a file
   on disk. There is no CMS database that can normalise away a
   character, no rich-text blob whose plain-text projection is a
   guess. What the author wrote is what the crawler gets.
2. **Identity → URL is deterministic.** The `mosaic-web` profile
   (`mosaic-web.md` §3) derives URLs purely from filesystem identity.
   `pages/blog/hello.json` is `/blog/hello`, today and a year from now,
   regardless of which adapter renders it. No slug drift, no CMS GUID
   in the URL, no opaque routing layer to break the link.
3. **Refs resolve at build time.** A blog post that references
   `ref:/team/ada` as its author resolves to the actual Person record
   when the page is built. The author's name and bio are present in
   the static HTML — not fetched at runtime, not behind JavaScript.

Net effect: every page has a stable URL, every field is addressable,
and every value reaches the crawler as text in the response body. This
is the floor; the next sections are what you build on top.

### A note on body format

A record's main prose lives in its `body` field (`format/01-format.md`
§5.2). The base format treats `body` as **opaque UTF-8 text** and
assigns it no meaning — markdown, HTML, plaintext, and AsciiDoc are
all equally valid contents. Rendering markdown to HTML is an *adapter
convention*, not a spec requirement; the Astro and Next adapters that
ship with Mosaic happen to render `body` through a markdown processor
because that is the most common authoring choice, but a Mosaic folder
whose `body` fields are HTML or plaintext is equally conforming. The
SEO surfaces below — JSON-LD, meta tags, sitemap — are independent of
which text format you choose for `body`. See
`../../docs/adr/0001-body-format-agnosticism.md` for the recorded
rationale.

## 2. Structured data — Schema.org via `@type`

`mosaic-web.md` §6 reserves the field name `@type` on records. When
present, an adapter SHOULD emit a `<script type="application/ld+json">`
block in `<head>` carrying the record as schema.org JSON-LD.

```json
{
  "@type": "BlogPosting",
  "title": "Hello",
  "datePublished": "2026-04-12",
  "author": "ref:/team/ada"
}
```

A conforming adapter resolves the `author` ref inline and emits a
nested graph in one JSON-LD block:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Hello",
  "datePublished": "2026-04-12",
  "author": {
    "@type": "Person",
    "name": "Ada Lovelace",
    "jobTitle": "Founding engineer"
  }
}
</script>
```

This is the surface Google, Bing, and most knowledge-graph consumers
read. Field-name mapping (Mosaic `title` → schema.org `headline`) is
the adapter's responsibility; the spec does not codify a single map
because the right map depends on the `@type`.

The mosaic-internal `meta` field (§7, next section) is HTML metadata,
not schema.org data, and MUST be stripped from this JSON-LD block per
§6.

## 3. HTML meta + OpenGraph + Twitter Card

`mosaic-web.md` §7 reserves the field name `meta` on records. When
present, an adapter SHOULD emit standard `<meta>` tags in `<head>`:

```json
{
  "title": "Hello",
  "meta": {
    "description": "First post on the new site.",
    "og": { "image": "/blog/hello-hero.png", "type": "article" },
    "twitter": { "card": "summary_large_image", "creator": "@ada" }
  }
}
```

Rendered:

```html
<meta name="description" content="First post on the new site.">
<meta property="og:title" content="Hello">
<meta property="og:description" content="First post on the new site.">
<meta property="og:image" content="/blog/hello-hero.png">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Hello">
<meta name="twitter:image" content="/blog/hello-hero.png">
<meta name="twitter:creator" content="@ada">
```

The `og:title`, `twitter:title`, derived `description` lines, and the
twitter image are the adapter's sensible-default derivations from the
record's `title` and the OpenGraph block (§7.1). An adapter that emits
only the literally-declared sub-fields is equally conforming.

OpenGraph and Twitter Card are what unfurls a link when it is pasted
into Slack, Discord, iMessage, Twitter, Mastodon, LinkedIn. JSON-LD
(§6) covers the knowledge-graph side; `meta` (§7) covers the
crawler-and-unfurler side. Most pages want both.

## 4. Canonical URLs and locale variants

The base format (`format/01-format.md` §7.1) supports modifier
sidecars: `about.json` is the canonical record, `about.fr.json` is its
French variant. Under the `mosaic-web` profile both yield the URL
`/about` — distinguished by their negotiated locale.

For SEO this means:

- The **canonical variant** (no modifier) is the default URL the
  crawler indexes. Add `meta.canonical` if your adapter serves the
  variants at different URLs (e.g. `/about` vs `/fr/about`).
- The **locale variants** SHOULD be advertised via
  `<link rel="alternate" hreflang="fr" href="/fr/about">` between
  siblings. This is currently an adapter implementation note — a
  normative clause may land in a later draft of `mosaic-web.md`. Until
  then, adapters that serve multi-locale sites SHOULD emit `hreflang`
  themselves; the data is already there in the variant set.
- `meta.og.locale` per variant (e.g. `fr_FR` on `about.fr.json`)
  ensures the right social-card language is offered when the variant
  itself is shared.

The D-web fixture (`spec/examples/D-web/content/`) demonstrates this
with `pages/blog/hello.fr.json`, which carries its own `meta` block
with `og.locale: "fr_FR"`.

## 5. Sitemap synthesis

`mosaic-web.md` §8 lists sitemap synthesis as out of scope for the
profile NORMATIVELY — but an adapter can produce one trivially from §3.
The URL set is the set of every record's URL.

Pseudocode:

```
records = readFolder('./content').records
urls    = [ webUrl(r) for r in records if r.identity startsWith root ]

for url in urls:
  emit "<url><loc>{site}{url}</loc></url>"
```

That is the entire sitemap. The adapter knows every URL at build time
because §3 is a pure function of identity. There is no crawl step, no
"discover hidden routes" step, no fallback for dynamic routes the build
did not see.

`lastmod`, `changefreq`, and `priority` are adapter choices — Mosaic
does not require fields for them. A common pattern is to use the
record's `datePublished` / `dateModified` (also visible to JSON-LD) for
`lastmod`.

## 6. Static output, no runtime

Every adapter that ships with Mosaic (Astro, Next, the Python
validator) produces static HTML at build time. JSON-LD is rendered
into `<head>`. `meta` is rendered into `<head>`. Body content is in
the response body. Refs are already resolved.

Googlebot does not need to execute JavaScript to see your title,
description, author, dates, or social card. That is the difference
between "indexed in days" and "indexed in months" for a new site.
Lighthouse scores follow from the same property: there is nothing to
hydrate, no client-side rendering blocking first paint, no
data-fetching round trip after the HTML loads.

This is not a Mosaic-specific innovation — every static-site generator
gets you there — but it is preserved by Mosaic. A folder of JSON is a
strictly easier input to render statically than a remote CMS with a
network boundary.

## 7. What Mosaic does NOT do

To calibrate expectations. The format gives you a clean substrate; it
does not write your content for you.

- Mosaic does **not** write copy, pick keywords, or balance reading
  level. The strings in your JSON are the strings the crawler sees.
- Mosaic does **not** infer `@type`. You declare it. An adapter MAY
  default an `@type` for a known collection (a `blog/` folder ↦
  `BlogPosting`) but the spec does not require it.
- Mosaic does **not** generate alt text, image dimensions, or social
  card images. `meta.og.image` is a URL to an asset you provide.
- Mosaic does **not** ping search engines, manage robots.txt, run a
  redirect map, or maintain a backlink graph. Those are deployment
  concerns, not format concerns.

The format's job is to make sure that when you DO write a title, a
description, an `@type`, an author ref, or a social card image, that
data arrives at the crawler intact, at a stable URL, with no
intermediate layer to lose it. The rest is yours.

---

## Cross-references

- `mosaic-web.md` §3 — URL derivation.
- `mosaic-web.md` §6 — Schema.org JSON-LD emission (RECOMMENDED).
- `mosaic-web.md` §7 — HTML meta / OpenGraph / Twitter Card
  (RECOMMENDED).
- `mosaic-web.md` §8 — explicit non-goals (incl. sitemap).
- `format/01-format.md` §7.1 — identity, file-form / folder-form,
  variants.
- `format/02-references.md` §11.4 — resolved refs (used by §6 to
  emit nested graphs).
- `examples/D-web/content/` — fixture exercising §3, §6, §7 end-to-end.

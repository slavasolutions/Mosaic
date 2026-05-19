# Mosaic Web — Profile Specification

**Version:** 0.9.2 (draft, companion to the base format)
**Status:** Working Draft
**Layer:** Profile. Depends on `../format/01-format.md` (the base) and
`../format/02-references.md` (refs + cascade).
**Scope:** routing only in this draft. Design tokens, redirects, sitemaps,
locales-as-prefix folders, and image-asset rules are explicitly deferred to
later iterations of this profile.

---

## 1. Purpose

Mosaic Web describes how a Mosaic folder is read as a **website**. It defines:

- How to detect that a folder participates in this profile
- Which records become URL routes and what those URLs are
- The reserved name `index` in the context of routing
- A small set of conformance constraints for consumers (renderers,
  editors, static-site generators)

It does **not** redefine any base-format rule. It adds a single conceptual
layer — *identity → URL* — and otherwise leaves the folder alone.

## 2. Detection

A consumer MAY treat a folder as a Mosaic Web site when its root
`mosaic.json` manifest declares either:

```json
{ "profiles": { "web": { "root": "pages" } } }
```

or the long-form profile name:

```json
{ "profiles": { "mosaic-web": { "root": "pages" } } }
```

Both forms are equivalent. The value of `root` is a path relative to the
Mosaic root and MUST identify a directory inside the folder. If the
declared root does not exist, the folder is non-conforming **for this
profile**; it MAY still be a conforming plain Mosaic folder.

If neither form is present in the manifest, the folder is simply not a
Mosaic Web site; this profile is inactive and no routing applies.

## 3. URL derivation

For every record whose identity is rooted within the configured `root`:

1. Compute the record's identity per `../format/01-format.md` §7.1.
2. Strip the configured root prefix from the front of the identity.
3. If the remaining segments end in `index`, strip the trailing `index`
   segment (collapsing to the folder URL).
4. The resulting path, prefixed with `/`, is the record's **URL**.

If a step leaves an empty path, the URL is `/` (the site root).

### 3.1 Worked examples

Given `mosaic.json` declaring `profiles.web.root = "pages"`:

| Source files | Identity | URL |
|---|---|---|
| `pages/index.json` | `pages` | `/` |
| `pages/about.json` | `pages/about` | `/about` |
| `pages/about/index.json` | `pages/about` | `/about` |
| `pages/about/team.md` + `pages/about/team.json` | `pages/about/team` | `/about/team` |
| `pages/blog/index.json` | `pages/blog` | `/blog` |
| `pages/blog/hello.md` + `pages/blog/hello.json` | `pages/blog/hello` | `/blog/hello` |
| `team/ada.json` | `team/ada` | (no URL — outside `pages/`) |
| `mosaic.json` | (manifest) | (no URL — not a record) |

`pages/about.json` and `pages/about/index.json` resolve to the **same**
identity per base §7.1 (the file-form / folder-form equivalence). They are
two spellings of the same URL. Per base §7.1 the spec forbids both
spellings coexisting at the same identity — that error is unchanged here.

## 4. Conformance

A consumer that supports this profile MUST:

1. Detect the profile per §2.
2. Compute URLs per §3 for every record under the configured root.
3. Refrain from assigning URLs to records outside the configured root.
4. Treat collision between two records whose URLs are identical as an
   **error**, surfaced to the user; do not silently shadow one with the
   other. (The base format's §7.1 file-form / folder-form collision rule
   already prevents the most common case; profile consumers should catch
   any further URL-level collision that survives.)
5. Refuse to modify files as a side effect of routing. Routing is a read
   operation.

A consumer MAY:

1. Synthesise a top-level navigation from the direct children of the
   configured root (informative — UI choice).
2. Treat `index.{md,json}` records at any depth as the "default" record of
   their folder when rendering nav menus.
3. Surface records outside the configured root in the UI as "non-route
   records" (e.g. data referenced by routes, but not themselves URLs).

## 5. The home route

The URL `/` is derived solely from the collapse of `pages/index` (or
`<root>/index`) per §3 step 3. There is no separate `home` record name and
no auto-aliasing of `/home` to `/` in this draft. (Earlier 0.8.x drafts
reserved the slug `home`; that rule has been dropped pending a real-world
case that needs it.)

## 6. Schema.org structured data (RECOMMENDED)

A consumer that supports this profile SHOULD emit JSON-LD in the
`<head>` of every rendered page when the corresponding record declares
an `@type` field. The value of `@type` MUST be a schema.org type
identifier (`Article`, `Person`, `Event`, `WebSite`, `BlogPosting`, …).

The field name `@type` is reserved on records when this profile is
active; it carries the schema.org type for that record. The field name
`@context` is reserved likewise; absent on a record, consumers SHOULD
use `https://schema.org` as the default JSON-LD context.

This profile RECOMMENDS but does not REQUIRE structured-data emission.
A renderer that emits valid JSON-LD when `@type` is present conforms;
one that omits it also conforms. Records without `@type` MUST NOT
trigger structured-data emission.

Resolved references inside a record (per `../format/02-references.md`
§11.4) MAY be embedded directly in the JSON-LD output. For example, a
`BlogPosting` whose `author` field resolves to a `Person` record can
emit the resolved Person inline as the `author` value, producing a
nested schema.org graph in one JSON-LD block.

Field-name mapping (Mosaic record fields → schema.org properties) is
consumer-defined; profiles MAY codify common mappings. Consumers SHOULD
strip Mosaic-internal fields (`slug`, `url`, `modifiers`, etc.) from
the emitted JSON-LD. The `meta` field (see §7) is HTML metadata, not
schema.org data, and MUST be stripped from JSON-LD output likewise.

Schema.org structured data (this section) and HTML meta tags (§7) are
complementary, not alternatives. A page MAY emit both; one carries
machine-readable type information for search/social knowledge graphs,
the other carries the legacy `<meta>` / OpenGraph / Twitter Card surface
that crawlers and unfurlers still consume directly.

## 7. HTML meta tags (RECOMMENDED)

A consumer that supports this profile SHOULD emit HTML `<meta>` tags in
the `<head>` of every rendered page when the corresponding record
declares a `meta` field. The field name `meta` is reserved on records
when this profile is active; it carries page-level HTML metadata
(description, OpenGraph, Twitter Card, robots, canonical).

The `meta` field is an object with the following recognised sub-fields.
All are OPTIONAL. Unknown sub-fields MUST be preserved per base §9 and
MAY be emitted by consumers that understand them.

| Sub-field | Type | Emitted as |
|---|---|---|
| `meta.description` | string | `<meta name="description" content="…">` |
| `meta.robots` | string | `<meta name="robots" content="…">` |
| `meta.canonical` | string | `<link rel="canonical" href="…">` |
| `meta.og.title` | string | `<meta property="og:title" content="…">` |
| `meta.og.description` | string | `<meta property="og:description" content="…">` |
| `meta.og.image` | string | `<meta property="og:image" content="…">` |
| `meta.og.type` | string | `<meta property="og:type" content="…">` |
| `meta.og.url` | string | `<meta property="og:url" content="…">` |
| `meta.og.locale` | string | `<meta property="og:locale" content="…">` |
| `meta.og.siteName` | string | `<meta property="og:site_name" content="…">` |
| `meta.twitter.card` | string | `<meta name="twitter:card" content="…">` |
| `meta.twitter.title` | string | `<meta name="twitter:title" content="…">` |
| `meta.twitter.description` | string | `<meta name="twitter:description" content="…">` |
| `meta.twitter.image` | string | `<meta name="twitter:image" content="…">` |
| `meta.twitter.creator` | string | `<meta name="twitter:creator" content="…">` |
| `meta.twitter.site` | string | `<meta name="twitter:site" content="…">` |

This profile RECOMMENDS but does not REQUIRE meta-tag emission. A
renderer that emits valid `<meta>` tags when `meta` is present
conforms; one that omits them also conforms. Records without a `meta`
field MUST NOT trigger meta-tag emission for that record.

### 7.1 Sensible defaults (informative)

Consumers MAY derive omitted values from sibling fields when natural:

- `meta.og.title` MAY default to the record's `title` field.
- `meta.twitter.title` MAY default to `meta.og.title` (then to `title`).
- `meta.description` MAY default to `meta.og.description`, or vice
  versa.
- `meta.twitter.description` MAY default to `meta.og.description`, then
  to `meta.description`.
- `meta.twitter.card` MAY default to `"summary_large_image"` when
  `meta.og.image` (or `meta.twitter.image`) is present, otherwise to
  `"summary"`.
- `meta.og.url` MAY default to the page's computed URL per §3.

These defaults are consumer-defined. The profile does not require any
specific fallback chain; a consumer that emits only what the record
literally declares is conforming.

### 7.2 Worked example

A blog post record at `pages/blog/hello.json`:

```json
{
  "@type": "BlogPosting",
  "title": "Hello",
  "meta": {
    "description": "First post on the new site.",
    "og": {
      "image": "/blog/hello-hero.png",
      "type": "article"
    },
    "twitter": {
      "card": "summary_large_image",
      "creator": "@ada"
    }
  }
}
```

A conforming renderer emits (in `<head>`):

```html
<meta name="description" content="First post on the new site.">
<meta property="og:title" content="Hello">
<meta property="og:description" content="First post on the new site.">
<meta property="og:image" content="/blog/hello-hero.png">
<meta property="og:type" content="article">
<meta property="og:url" content="https://example.com/blog/hello">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Hello">
<meta name="twitter:description" content="First post on the new site.">
<meta name="twitter:image" content="/blog/hello-hero.png">
<meta name="twitter:creator" content="@ada">
```

The `og:title`, `og:description`, `og:url`, `twitter:title`,
`twitter:description`, and `twitter:image` lines are the consumer's
sensible-default derivations per §7.1; an equally conforming renderer
that emits only the literally-declared sub-fields is also valid.

### 7.3 Relationship to §6

`meta` is HTML metadata for crawlers and unfurlers. `@type` and the
JSON-LD output of §6 are schema.org structured data for knowledge
graphs. A page MAY carry both, neither, or either. Consumers MUST NOT
copy `meta` sub-fields into the JSON-LD block; consumers MUST NOT copy
`@type` / `@context` into `<meta>` tags. The two surfaces serve
different audiences and remain independent.

## 8. What this profile does NOT define

Out of scope for 0.9.2 of this profile. Each MAY return in a later draft:

- **Redirects.** Older drafts declared redirects in the manifest with
  loop detection and 301 hints. Defer until a consumer needs them.
- **Design tokens.** Older drafts reserved a root singleton for DTCG-shape
  design tokens. Defer.
- **Sitemap synthesis.** A consumer MAY synthesise a sitemap from §3; the
  profile does not normatively define one.
- **Locale-as-prefix folders.** Mosaic supports `name.locale.ext` variants
  per the base format (`team.fr.json`). A future variant — locale-as-folder
  (`fr/about.json` mapping to `/fr/about`) — is documented as a known
  request and deferred to a later draft of this profile.
- **Image / asset URLs.** Mosaic itself does not constrain where binary
  payloads live or how their URLs derive. A profile-aware consumer MAY
  surface images at predictable URLs (e.g. `pages/images/hero.png` at
  `/images/hero.png`) but this profile does not normatively require it.

## 9. Relationship to the base format

This profile **layers**. It adds the identity → URL map; it does not change
any base rule. The base format's three structural rules — file is record,
folder is collection, filename is contract — apply unchanged. References,
cascade, sidecars, unknown-field preservation, the reserved-name list — all
unchanged.

If a folder fails base-format validation, this profile considers it
non-conforming. There is no looser "web-compatible" mode.

## 10. Status

This is a 0.9.2 working draft. It deliberately covers the bare minimum
required for a consumer (an editor, a renderer, a static-site generator)
to produce predictable URLs from a Mosaic folder. The deferred items in §8
will return as the profile matures.

The example fixture at `../examples/D-web/content/` exercises this profile
end-to-end with a small set of pages, a nested blog, and one non-route
record (`team/ada.json`) — read it as the canonical demo.

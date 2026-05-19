# ADR 0001 — Body-format agnosticism

**Status:** Accepted
**Date:** 2026-05-19

## Context

Base format §5.2 reserves the field name `body` on a merged Record and
defines it as the bytes of a paired text content file (UTF-8). The
recognised text-extension set is `{.md, .txt, .html, .adoc}`
(`TEXT_BODY_EXTENSIONS` in `@ssolu/mosaic-core`). The spec deliberately
stops there: it names the field, says where the bytes come from, and
says nothing about how the bytes should be parsed or rendered.

That silence is a position, not an omission. The SEO explainer
(`spec/profiles/mosaic-web-seo.md` §1, "A note on body format") states
it explicitly: markdown, HTML, plaintext, and AsciiDoc are equally
valid contents for `body`. The #10 markdown renderer wired into the
Astro and Next adapters defaults to treating `.md` bodies as markdown
because that is the most common authoring choice — not because the
spec requires it.

We need a recorded decision so future spec changes do not accidentally
privilege one format.

## Decision

The base format remains format-agnostic about `body`. Bytes inside
`body` are opaque UTF-8 text. Format dispatch — choosing markdown vs
HTML vs plaintext vs AsciiDoc — is an **adapter or profile concern**,
not a base-format concern.

Two dispatch mechanisms are blessed by convention, neither by the
base spec:

1. **Extension-based.** The file extension that produced the body
   (`.md`, `.html`, `.adoc`, `.txt`) drives the adapter's choice of
   renderer. This is what `@ssolu/mosaic-astro` and
   `@ssolu/mosaic-next` do today.
2. **Discriminator-based.** A record MAY carry an optional
   `bodyFormat` field (string) when the extension is ambiguous or
   when the author wants to override. This is a profile/adapter
   field; the base spec does not enumerate its values or require its
   presence.

The base spec MUST NOT enumerate body formats beyond
`TEXT_BODY_EXTENSIONS`, and MUST NOT mark one as default. Profiles
and adapters declare which formats they support and what their
default dispatch is.

## Consequences

- **Adapters own format support.** An Astro adapter that only handles
  markdown is conforming; one that also handles AsciiDoc is also
  conforming; one that handles only plaintext is also conforming.
  Each adapter publishes its supported set.
- **No privileged format in spec text.** The format-agnostic position
  is load-bearing for the spec's identity (a folder convention, not a
  CMS). Documentation that introduces examples MUST use whichever
  format the example needs; it MUST NOT imply markdown is required.
- **Future ambiguity is opt-in.** When a record carries an HTML body
  in a `.txt` file (no extension hint), `bodyFormat: "html"` resolves
  it without spec growth.
- **No format-extension to the spec is needed.** Adding support for a
  new text format means updating an adapter, not the base format.
  `TEXT_BODY_EXTENSIONS` may grow if a new extension becomes
  widespread, but that is a small additive change to a single list,
  not a new clause.

## Alternatives considered

- **(A) Spec mandates markdown as the default.** Rejected — picks a
  side, breaks format-agnosticism, locks adopters who prefer HTML or
  AsciiDoc into a second-class path.
- **(B) Spec requires `bodyFormat` on every record with a body.**
  Rejected — noisy, redundant when the extension already discloses
  the format, hurts the "filesystem is the database" feel.
- **(C, chosen) Silent default to adapter convention, optional
  `bodyFormat` discriminator.** Lets the common case stay quiet and
  the unusual case stay explicit. No spec-level enumeration.

## Cross-references

- `spec/format/01-format.md` §5.2 — the `body` field.
- `spec/profiles/mosaic-web-seo.md` §1 — "A note on body format".
- `@ssolu/mosaic-core` exports `TEXT_BODY_EXTENSIONS` (re-exported
  from `reader.ts`).

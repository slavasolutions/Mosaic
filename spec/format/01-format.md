# Mosaic Format Specification

**Version:** 0.9 (draft)
**Status:** Working Draft
**Layer:** Base format (substrate). Profiles such as Mosaic Web are specified
separately and MUST NOT alter the rules below.

---

## 1. Introduction

Mosaic is a convention for using an ordinary directory tree as a structured
content store. It defines what a *Mosaic folder* is and nothing more. It does
not define queries, routing, rendering, transport, or storage engines. A
conforming Mosaic folder is readable with nothing but a filesystem and a JSON
parser.

This document specifies the base format. It is deliberately small: three
structural rules plus naming constraints.

### 1.1 The framing pivot — a record is an identity

A **record** is not a file; it is an *identity*. The JSON describes that
identity; the content file is its body. This single distinction makes the
file-form / folder-form question disappear:

```
about.json                  ─┐
                              ├──→  identity:  about
about/index.json            ─┘
```

`about.json` today; `about/index.json` tomorrow when `about` grows children.
Same identity. No reference breaks. No rename. The full identity rules are
in §7.1.

### 1.2 The resolution pipeline (forward reference)

The effective JSON of any record is computed in exactly this order, once:

```
content (.json) or empty       (§5)
  → + sidecar merge             (§8, shallow; sidecar wins on collision)
    → + cascade fill            (02-references.md §12.3, locale or declared)
      → + references resolved   (02-references.md §11.4, against the above)
```

§5–§9 in this document define steps 1 and 2 plus the rules that govern
them. Steps 3 and 4 are specified in the companion document
`02-references.md`. The pipeline is fixed, single-pass, and never re-enters
a step; this predictability is what keeps the format from growing an
evaluator.

## 2. Notation

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be
interpreted as described in RFC 2119 and RFC 8174 when, and only when, they
appear in all capitals.

## 3. Terminology

- **Root** — the top-level directory of a Mosaic folder.
- **Record** — the addressable unit of content (Section 5).
- **Collection** — a directory containing records and/or other collections
  (Section 6).
- **Structured content** — a `.json` file, whose keys the format reads
  directly.
- **Opaque content** — any non-`.json` file (`.md`, `.pdf`, `.png`, …). The
  format does not parse it for fields; its bytes are the record's payload and
  its structured metadata, if any, comes from a sidecar.
- **Sidecar** — a JSON file supplying metadata for a sibling content file
  (Section 8).
- **Identity** — the stable, path-derived name of a record (Section 7.1).
- **Consumer** — any tool that reads a Mosaic folder.
- **Writer** — any tool that produces or modifies a Mosaic folder.
- **Profile** — a separate specification layered on the base (for example,
  Mosaic Web). A profile defines additional domain-specific rules and keys;
  it MAY add but MUST NOT contradict the base (§4).

## 4. Conformance

A directory tree is a **conforming Mosaic folder** if every record, collection,
and name within it satisfies Sections 5–9. A tool is a **conforming consumer**
if it resolves identity, collections, and sidecars as specified and preserves
unknown fields (Section 9). Profiles MAY add rules but MUST NOT contradict this
document.

---

## 5. Records (Rule 1)

A **record** is a content file together with OPTIONAL structured metadata.

1. The content file MAY be of any type. A `.json` file is *structured
   content*: the format reads its keys, and it is the degenerate case where the
   metadata *is* the content.
2. Any non-`.json` file is *opaque content*. Consumers MUST NOT attempt to
   interpret opaque content as structured data. `.md` is opaque content that
   happens to be human-readable text; `.pdf`, `.png`, `.csv`, etc. are opaque
   payloads.
3. Structured metadata for an opaque content file, if any, is carried by a
   sidecar (Section 8). JSON is the single source of truth for structured
   fields.
4. A consumer MAY derive convenience values from opaque content (for example, a
   display title from a Markdown file's first heading). Such derived values
   MUST NOT override explicit JSON fields and are not part of this format.
5. A consumer that does not understand a record's content type MUST still be
   able to address the record and read its sidecar metadata.

### 5.1 Markdown frontmatter

The base format assigns **no meaning** to frontmatter (a leading `---` block)
in Markdown content.

1. A conforming consumer MUST NOT interpret frontmatter as record metadata; it
   is inert text.
2. A conforming writer SHOULD NOT emit frontmatter; structured fields belong in
   a JSON sidecar.
3. The presence of frontmatter MUST NOT, by itself, make a folder
   non-conforming. Consumers MAY surface it as a warning.

## 6. Collections (Rule 2)

A **collection** is a directory.

1. Any directory under the root is a collection. Collections MAY nest to any
   depth.
2. A file named `index` (with any permitted extension) within a directory
   represents that directory itself as a record — the **collection record**.
3. A collection MAY exist without a collection record. A collection record MAY
   exist without sibling members. Neither implies the other.
4. There is no reserved parent directory for collections; a collection is any
   directory, anywhere in the tree.

## 7. Naming and Identity (Rule 3)

Every record name **MUST** match:

```
name[.modifier]*.ext
```

1. **`name`** — the local identifier. MUST consist only of lowercase ASCII
   letters, digits, and hyphen (`-`), and MUST NOT begin with `_` or `.`.
2. **`.modifier`** — zero or more variant selectors (e.g. a language tag).
   Their meaning is defined by the consumer or a profile; the base format only
   reserves the slot and its syntax. Each modifier follows the same charset as
   `name`.
3. **`.ext`** — the content extension.
4. All path segments MUST be UTF-8 and MUST be lowercase. Consumers SHOULD
   reject mixed-case names rather than normalize them silently.

### 7.1 Identity

A record's **identity** is its path from the root, normalized in order:

1. Remove the trailing `.ext`.
2. Remove all `.modifier` segments.
3. Remove a trailing `/index` segment.

Therefore `about.json`, `about.fr.json`, and `about/index.json` all resolve to
the same identity `about`.

A writer MAY convert a record between file form (`about.json`) and folder form
(`about/index.json`). This MUST NOT change identity and MUST NOT be treated as
a rename. Folder form is REQUIRED only when the record must contain nested
members. A single identity reachable as **both** a file form and a folder form
is an error.

### 7.2 Reserved Names

- `index` (Section 6).
- `mosaic.json` at the root is the manifest where present. Its contents are out
  of scope here; consumers MUST preserve it verbatim.
- Any name beginning with `_` or `.` is hidden/consumer-private and MUST be
  ignored by conforming consumers when enumerating records (not an error).

### 7.3 Permitted Extensions

`.json` (structured) and `.md` (opaque text) are defined here. Any other
extension is permitted as opaque content and MUST carry its structured
metadata, if any, in a sidecar.

## 8. Sidecars

Sidecars follow from Sections 5 and 7; they are not a separate structural rule.

1. A `.json` file whose `name` **and modifier set** match a sibling content
   file is that file's **sidecar**.
2. A sidecar's top-level object MUST be merged onto the content file's
   metadata; on key collision the sidecar value takes precedence.
3. Merge is shallow at the top level unless a profile specifies otherwise.
4. Modifiers participate in matching: `about.fr.json` is the sidecar for
   `about.fr.md`, not for `about.md`. A modifier sidecar with no matching
   content sibling SHOULD be surfaced as a warning.

## 9. Unknown Fields

A conforming writer MUST round-trip JSON fields it does not recognize, and MUST
NOT drop or destructively rewrite them when saving a record it has read. This
guarantees forward compatibility across tool and profile versions.

## 10. Out of Scope

Explicitly **not** defined by the base format (left to a profile or consumer):
references between records, cascade/inheritance, routing/URLs, validation
schemas, manifest contents, bundling/transport. A consumer MAY implement any of
these; doing so MUST NOT require deviating from Sections 5–9.

---

## Appendix A. Example

```
content/
  mosaic.json
  index.md            index.json   # collection record: opaque text + sidecar
  about.md                          # pure content, no sidecar
  about.fr.md                       # variant, same identity 'about'
  pricing.json                      # structured == content
  brochure.pdf        brochure.json # opaque payload + describing sidecar
  team/
    index.json                      # the 'team' record
    ada.json
    grace.md          grace.json    # content + sidecar
```

Resolved identities: `(root)`, `about`, `pricing`, `brochure`, `team`,
`team/ada`, `team/grace`.

## Appendix B. Summary of Rules

| Rule | Statement |
|------|-----------|
| 1 | A file is a record: content (structured `.json` or opaque) plus optional JSON metadata. |
| 2 | A folder is a collection; `index.*` is the folder as a record. |
| 3 | The filename is the contract: `name[.modifier]*.ext`; identity is form-independent. |

Sidecars (§8) and unknown-field preservation (§9) follow from these three.

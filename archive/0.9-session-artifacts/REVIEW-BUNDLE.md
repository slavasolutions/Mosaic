# Mosaic 0.9.1 Spec Review Bundle

**For:** Claude (web) — second-pass review and fix-drafting
**Date:** 2026-05-17
**From session:** Claude Code working on `/home/ms/active/mosaic-reframe-0.9.1/`
**Branch:** `0.9.1-spec` (commit `77058e7`)

---

## What this bundle is

This is a self-contained review packet. It contains:

1. **Context** — what Mosaic is, where it's at, what we're trying to do
2. **The spec text** — `01-format.md` and `02-references.md` (the entire base format)
3. **The decisions log** — the 5 forks we resolved and how
4. **The reference validator** — `validate.py` (~250 LOC Python)
5. **Three independent review reports** — from a structural critic, a spec↔impl reviewer, and a fresh-eye reader
6. **Merged findings** — ranked, with proposed fixes
7. **Your job** — what we'd like you to do with this

Everything is inlined so you don't need filesystem access. If you want to run code, the validator is in §4.

---

## 1. Context

Mosaic is a convention for using a plain folder as a structured content store. Like Markdown, EPUB, STAC, BagIt — a **format**, not a database, not an engine.

**Three layers (locked):**
- **Mosaic** = the format spec (this bundle)
- **FolderDB** = a reference implementation (the `validate.py` is the seed; a Node/TS build comes later)
- **Mosaic Studio** = future polished editor (Tauri + Svelte, not started)
- **Clear** = commercial CMS on top (private, separate repo, out of scope here)

**This work supersedes** 14 prior "MIP" proposals and a monolithic `SPEC.md`. Those are archived. The fresh restart was done because the prior spec was sprawling and unclear. The goal of 0.9.1 is: **tight, short, RFC-style, three structural rules.**

**Framing pivot we locked:** *"A record is an identity; the JSON file describes it."* This single sentence is what makes `about.json` and `about/index.json` cleanly equivalent.

**Hard ceiling we locked:** No wildcards, predicates, or content-queries in references — ever. The discipline is to prevent re-deriving XPath.

**Versioning:** This is **0.9.1**, deliberately NOT 1.0. Format is locked at the headline but the spec text needs another pass (which is why we're asking for review).

---

## 2. Spec — `01-format.md` (base format)

```markdown
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
```

---

## 3. Spec — `02-references.md` (refs + cascade)

```markdown
# Mosaic Format — References

**Version:** 0.9 (draft) · companion to `01-format.md`
**Status:** Working Draft
**Layer:** Base format. This document promotes *content references* from
out-of-scope (§10 of `01-format.md`) to a defined Section 11. *Structural*
relationships remain implicit and undefined — they are free from layout.

---

## 11. References

### 11.1 Scope

This section defines **content references** only: a value in one record that
names another record. It does **not** define:

- Parent/child or membership relationships — these are derived from the
  directory tree at zero cost and MUST NOT be expressed as references.
- Referential integrity — the format defines resolution, not enforcement
  (§11.6).
- Query expressions of any kind (§11.7).

### 11.2 Reference value

A **reference** is a JSON string of the form:

```
ref:<identity>[#<json-pointer>]
```

1. The string MUST begin with the sentinel `ref:`.
2. `<identity>` MUST be a record identity as defined in `01-format.md` §7.1.
   It is the path-derived, form-independent name of the target — never a file
   path, file name, array index, or position.
3. `<json-pointer>`, if present, MUST be a JSON Pointer (RFC 6901) evaluated
   against the *resolved* target record (§11.4). It addresses a value *inside*
   the target.
4. A reference MUST NOT contain any expression, wildcard, predicate, or axis.
   The grammar is exactly: sentinel, identity, optional JSON Pointer. Nothing
   else is permitted (§11.7).

A consumer MUST treat a string beginning with `ref:` as a reference. A literal
string value that must begin with the characters `ref:` MUST be escaped as
`\ref:`; a leading `\` is otherwise reserved.

### 11.3 Identity grammar for references

`<identity>` is one of:

| Form | Meaning |
|------|---------|
| `team/ada` | **Absolute.** Resolved from the root, regardless of where the reference appears. |
| `./ada` or `../team/ada` | **Relative.** Resolved against the *collection* containing the referring record. |

There are exactly two anchor forms: absolute and relative. There is no third
("cascade") anchor form for references (§12.4). Absolute is RECOMMENDED;
relative is permitted for intra-collection links that should survive the
collection being moved as a whole.

### 11.4 Resolution

To resolve a reference:

1. Compute the target identity (absolute, or relative to the referrer's
   collection).
2. Locate the record with that identity per `01-format.md` §7.1, applying
   sidecar merge (§8) to obtain the **resolved target**: a single JSON object.
3. If a JSON Pointer is present, evaluate it against the resolved target and
   yield that value. Otherwise yield the whole resolved target.

Resolution is **pure**: it depends only on the folder contents, not on
consumer state, time, or order. Two conforming consumers MUST resolve the same
reference to the same value.

### 11.5 Typing references

The base format does not type references. A profile or schema MAY constrain
what a given field's reference must point to (e.g. "`author` MUST reference a
record of type `person`"). Such constraints are validated by the schema layer
(`01-format.md` §6), not by this section. The reference *value* carries no type
marker; the field carries the expectation.

### 11.6 Dangling references

A reference whose target identity does not resolve is **dangling**.

1. A dangling reference MUST NOT, by itself, make a folder non-conforming.
2. A conforming validator MUST report a dangling reference as a **warning**.
3. A consumer MAY treat a dangling reference as null, omit it, or surface it;
   the format does not prescribe behaviour, only that it is not an error.

Rationale: enforcement requires a process that watches every write. The
filesystem never guaranteed symlink validity and remained useful. Promising
integrity here would re-introduce the engine the format exists to avoid.

### 11.7 Hard ceiling

The following are permanently **out of scope** and a conforming consumer MUST
reject them rather than interpret them:

- Path expressions, wildcards, globs, or predicates in an identity.
- Selectors other than a single RFC 6901 JSON Pointer.
- References that resolve by querying record *contents* (e.g. "the person
  whose `email` is X"). Such lookups are a consumer concern, never a format
  primitive.

This ceiling is the line that keeps Mosaic from re-deriving XPath.

---

## 12. Cascade — review and minimal definition

> This section is under deliberate scrutiny. Cascade is the single most likely
> feature to over-grow the spec. What follows is the tightened proposal, the
> reasoning, and what was cut.

### 12.1 The problem cascade solves

Some values are shared by every record in a subtree: a default `theme`, a
`locale`, an owning `org`. Without cascade, every record repeats them, and
changing one means editing all. Cascade lets a record inherit a value from an
ancestor instead of restating it.

### 12.2 Why it is dangerous

Cascade makes a record's effective value depend on its *position* in the tree
and on the *contents of its ancestors*. This is the hierarchical model's
original brittleness (the XPath problem) re-entering through a side door:

- Resolution is no longer local — you cannot understand a record by reading it.
- Moving a record can silently change its values.
- Unbounded cascade (any field, any depth, any merge) is indistinguishable
  from a small inheritance language.

### 12.3 Minimal definition (proposed, rigid)

Cascade is restricted to a **single, explicit, opt-in mechanism**:

1. A collection record (`index.json` per `01-format.md` §6) MAY contain a
   top-level object field named `defaults`.
2. For a record `R`, its **cascade chain** is the ordered list of collection
   records from the root down to `R`'s own collection.
3. A record's effective value for a key is resolved as: the record's own
   value if present; otherwise the nearest `defaults[key]` walking *up* the
   chain; otherwise absent.
4. Cascade is **shallow and key-level only**. It selects a whole value by key.
   It MUST NOT deep-merge objects or concatenate arrays. A present key on the
   record fully shadows all ancestor defaults for that key.
5. Cascade applies only to keys a profile or schema explicitly marks as
   cascading. A key not declared cascading is never inherited. There is no
   "cascade everything" mode.
6. References (§11) are resolved **after** cascade, against the effective
   record. A cascaded value MAY itself be a reference.

### 12.4 What was cut (and why)

| Cut | Reason |
|-----|--------|
| Cascade as a reference *anchor* (`ref:foo` searching ancestors) | Two mechanisms doing one job. References are absolute/relative only (§11.3). Cascade is inheritance, not addressing. Keeping them separate is the rigidity win. |
| Deep merge / array concat | That is a merge language. Shallow key-level only. |
| Implicit "all fields cascade" | Action-at-a-distance with no opt-in. Must be schema-declared. |
| Sidecar participation in cascade | Sidecars override locally (§8); mixing them into the chain creates a 2-axis resolution order. Sidecar first, then cascade — never interleaved. |
| Cascading into opaque content | Cascade is JSON-only; opaque payloads have no keys to inherit. |

### 12.5 Resolution order (normative)

For any record, the effective JSON is computed in exactly this order, once:

```
1. content (.json) or empty object for opaque records
2. + sidecar merge            (01-format.md §8, shallow, sidecar wins)
3. + cascade fill             (§12.3, only for declared keys, only if absent)
4. references resolved        (§11.4, against the result of step 3)
```

No step may be re-entered. This fixed pipeline is what keeps resolution
predictable and prevents the spec from growing an evaluator.

---

## Appendix C. Worked examples

### Folder

```
content/
  mosaic.json
  index.json                     # root collection record
  blog/
    index.json                   # { "defaults": { "theme": "ref:../themes/light" } }
    hello.md
    hello.json                   # { "title":"Hello", "author":"ref:/team/ada" }
  team/
    index.json
    ada.json                     # { "name":"Ada Lovelace", "email":"ada@x.io" }
  themes/
    light.json                   # { "bg":"#fff", "fg":"#111" }
```

### Records, with annotations

**`team/ada.json`** — a plain record, the reference target.

```json
{ "name": "Ada Lovelace", "email": "ada@x.io" }
```

**`blog/hello.json`** — sidecar for `hello.md`. Two references: an absolute
one, and (via cascade) an inherited theme.

```json
{ "title": "Hello", "author": "ref:/team/ada" }
```

**`blog/index.json`** — declares a default that cascades to members.

```json
{ "defaults": { "theme": "ref:../themes/light" } }
```

### Resolution of `blog/hello`

```
step 1  content        : (hello.md body is opaque -> {})
step 2  + sidecar       : { title:"Hello", author:"ref:/team/ada" }
step 3  + cascade       : theme not on record; nearest defaults.theme
                          is blog/index.json -> "ref:../themes/light"
                          (only because a profile declared `theme` cascading)
        effective json  : { title:"Hello",
                            author:"ref:/team/ada",
                            theme:"ref:../themes/light" }
step 4  refs resolved   :
          author  -> /team/ada            -> { name:"Ada Lovelace",
                                               email:"ada@x.io" }
          theme   -> blog/../themes/light -> { bg:"#fff", fg:"#111" }
```

### Reference with a JSON Pointer

```json
{ "byline": "ref:/team/ada#/name" }
```

Resolves to the string `"Ada Lovelace"` — the `/name` pointer evaluated
against the resolved `team/ada` record.

### Dangling reference (warning, not error)

```json
{ "author": "ref:/team/nobody" }
```

`team/nobody` does not resolve. Validator emits **WARNING**; folder still
conforms; consumer decides how to render.

### Rejected (hard ceiling, §11.7)

```json
{ "author": "ref:/team/*",
  "editor": "ref:/team[email='ada@x.io']",
  "owner":  "ref:/team/ada#/projects/*/lead" }
```

All three MUST be rejected: wildcard, predicate, and a non-JSON-Pointer
selector respectively.

---

## Appendix D. Summary

| Element | Rule |
|---------|------|
| Reference syntax | `ref:<identity>[#<json-pointer>]`, sentinel + RFC 6901 only |
| Anchors | absolute or relative — **no** cascade anchor |
| Resolution | pure; folder contents only; same input → same output |
| Integrity | dangling = warning, never error; format never enforces |
| Cascade | opt-in `defaults` on collection records; shallow; declared keys only |
| Pipeline | content → sidecar → cascade → refs; fixed, single pass |
| Ceiling | no expressions, no predicates, no content-queries — ever |
```

---

## 4. Decisions log — `DECISIONS-locked.md`

```markdown
# Mosaic — settle the spec

Five open forks. Each one below: the question in one line, what each option
*looks like as files*, what it resolves to, my recommendation, and a line for
your call. The matching folders are in `examples/`.

You can run `python3 validate.py examples/A-identity/content` etc. to see
behaviour live.

---

## Decision 0 — the framing (not a fork, a definition to confirm)

**A record is an identity. The JSON describes it. The content file is its body.**

`about.json` is not "the about record" — it is *the JSON that describes the
record at identity `about`*. This single sentence is what makes everything
below consistent. Confirm this framing and most confusion disappears.

**LOCKED: confirmed.**

---

## Decision 1 — identity forms  (`about.json` vs `about/index.json`)

**Question:** can a record exist both as a file *and* as a folder, and is that
a problem?

See `examples/A-identity/`.

- `about.json` → identity `about` (file form — use when no children).
- `blog/index.json` + `blog/hello.json` → identity `blog` with a child
  (folder form — use *only* when it must contain members).
- `team.json` sitting **next to** `team/` → **no collision.** `team.json`
  describes the record `team`; `team/` just holds its children. A folder is
  never itself a record.
- `collision/about.json` **and** `collision/about/index.json` → the **one**
  error: same identity, two forms at once.

**LOCKED: recommended.** File form and folder form are two spellings of one identity;
converting between them is never a rename; both-at-once is a validator error.

---

## Decision 2 — cascade scope  (the one you couldn't see before)

**Question:** which fields are allowed to inherit from a parent folder?

See `examples/C-cascade/`. `blog/hello` sets no `theme` and no `locale`.
Parents declare `defaults`.

| | STRICT | PRAGMATIC |
|---|---|---|
| `theme` (schema-declared) | inherits → `"light"` (from `/blog`) | inherits → `"light"` |
| `locale` (NOT declared) | **stays absent** | inherits → `"en"` (from root) |
| base format knows `locale`? | no — profile must declare it | yes — one blessed exception |
| purity | maximum | one pragmatic carve-out |

Plain version: **should the base format know the single word `locale`?**

**LOCKED: PRAGMATIC.** `locale` is needed by every realistic profile;
forcing each to re-declare it is boilerplate with no upside.

---

## Decision 3 — unified sidecar + sparse variant override

**Question:** does a variant sidecar restate everything, or only the diff?

See `examples/B-sidecars/`.

- `team.json` (canonical) = `{ title, layout, locale, cta }`
- `team.fr.json` (variant) = `{ title, cta }` — **only the two fields that
  differ.** `layout` and `locale` fall back to canonical.

Resolved for locale = fr:
```
{ title:"Notre Équipe", layout:"wide", locale:"en", cta:"Rejoignez-nous" }
```

This is not a new mechanism — it is cascade applied to the sidecar axis.
Resolution order stays the fixed pipeline:
`canonical sidecar → variant override → cascade fill → refs`.

**LOCKED: recommended.** One canonical sidecar per record; variants are sparse
overrides only.

---

## Decision 4 — web profile routing

**Question:** what makes a record a URL?

See `examples/D-web/`. `mosaic.json` declares `profiles.web.root = "pages"`.

- `pages/index.json` → `/`
- `pages/about.json` → `/about`  (file form — no folder required)
- `pages/blog/index.json` → `/blog`
- `pages/blog/hello.md` + `hello.json` → `/blog/hello`
- `team/ada.json` → a valid record, **not a route** (outside `pages/`)

Rule: URL = identity minus the configured root; `index` collapses to the
folder URL. The base format never knows about routes — the web profile only
adds the identity→URL map. Root name is configurable, default `pages`.

**LOCKED: recommended.** Root configurable in `mosaic.json`, default `pages`.

---

## Decision 5 — locale: base or profile? (rolls up from #2)

Since Decision 2 = **PRAGMATIC**: variant *syntax* (`name.fr.json`) lives
in the base; locale *resolution* (which variant wins, fallback order) lives in
the i18n/web profile; and the base blesses `locale` as the one cascading key.

**LOCKED: follows #2.**
```

---

## 5. Reference validator — `apps/folderdb/validate.py`

The full Python source (~250 lines) — the only piece of executable code in this bundle. Run against `examples/A-identity/content` to see a fail; `B-sidecars/content`, `C-cascade/content`, `D-web/content` all pass.

```python
#!/usr/bin/env python3
"""
Mosaic reference validator (seed for FolderDB).

Walks a folder; resolves identities per 01-format.md §7.1; flags
file-form/folder-form collisions and orphan modifier sidecars.

Does NOT implement: cascade (§12), references (§11), JSON Schema validation
against the manifest, bundle/unbundle, or any UI. Those come with the Node/TS
FolderDB build.

Usage:
    python3 validate.py <path-to-content-folder>
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from typing import Iterable

NAME_CHARSET = re.compile(r'^[a-z0-9-]+$')


def split_name(name: str):
    """Split 'foo.bar.baz.json' into (base='foo', modifiers=('bar','baz'), ext='json').

    For a name with no dots, returns (name, (), '').
    """
    parts = name.split('.')
    if len(parts) == 1:
        return parts[0], (), ''
    base = parts[0]
    ext = parts[-1]
    modifiers = tuple(parts[1:-1])
    return base, modifiers, ext


def is_hidden(name: str) -> bool:
    return name.startswith('_') or name.startswith('.')


def is_folder_form(p: Path) -> bool:
    return p.name.startswith('index.')


def walk_records(root: Path) -> Iterable[Path]:
    """Yield all non-hidden files under root, skipping hidden dirs."""
    for child in sorted(root.iterdir()):
        if is_hidden(child.name):
            continue
        if child.is_dir():
            yield from walk_records(child)
        else:
            yield child


def identity_of(p: Path, root: Path) -> str:
    """Compute the record's identity from its path per §7.1."""
    rel = p.relative_to(root)
    parts = list(rel.parts)
    last = parts[-1]
    base, _mods, _ext = split_name(last)
    if base == 'index':
        # collapse trailing /index
        parts = parts[:-1]
    else:
        parts[-1] = base
    return '/'.join(parts) if parts else '(root)'


def validate(root: Path):
    errors = []
    warnings = []

    # collect all files
    files = list(walk_records(root))

    # check manifest if present
    manifest_path = root / 'mosaic.json'
    if manifest_path.exists():
        try:
            manifest_path.read_text(encoding='utf-8')
            json.loads(manifest_path.read_text())
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            errors.append(('mosaic.json', f'manifest is invalid: {e}'))

    # check naming charset on every file
    for f in files:
        name = f.name
        base, mods, ext = split_name(name)
        if not NAME_CHARSET.match(base):
            errors.append((str(f.relative_to(root)), f'name "{base}" must be lowercase a-z 0-9 -'))
        for m in mods:
            if not NAME_CHARSET.match(m):
                errors.append((str(f.relative_to(root)), f'modifier "{m}" must be lowercase a-z 0-9 -'))

    # group files by their (collection_path, base_name) for collision detection
    # collect identities
    by_identity = defaultdict(list)
    for f in files:
        ident = identity_of(f, root)
        by_identity[ident].append(f)

    # detect file-form/folder-form collision: same identity reachable via both
    for ident, fs in by_identity.items():
        file_forms = [f for f in fs if not is_folder_form(f)]
        folder_forms = [f for f in fs if is_folder_form(f)]
        if file_forms and folder_forms:
            errors.append((ident, f"ambiguous identity '{ident}': exists as both a file form and a folder (index.*) form. Pick one."))

    # detect orphan modifier sidecars
    # group siblings by directory
    by_dir = defaultdict(list)
    for f in files:
        by_dir[f.parent].append(f)
    for d, siblings in by_dir.items():
        # collect (base, modifier_set) -> list of files
        content_keys = set()
        json_files = []
        for s in siblings:
            base, mods, ext = split_name(s.name)
            if ext == 'json':
                json_files.append((base, mods, s))
            else:
                content_keys.add((base, mods))
        # for each .json with modifiers, check if matching modifier-set content sibling exists
        for base, mods, s in json_files:
            if not mods:
                continue
            # the json is itself a candidate for "is content" if it has no content sibling
            if (base, mods) in content_keys:
                continue
            elif mods and (base, ()) in content_keys:
                # we have a base sibling but no modifier-set sibling
                rel = s.relative_to(root)
                warnings.append((str(rel), f"orphan modifier sidecar: '.{'.'.join(mods)}' has no matching content sibling for '{base}'."))

    # print results
    print('=' * 64)
    print('RESOLVED RECORDS')
    print('=' * 64)
    for ident in sorted(by_identity.keys()):
        fs = by_identity[ident]
        srcs = ', '.join(str(f.relative_to(root)) for f in fs)
        print(f'  {ident:<28} <- {srcs}')
    print()

    if errors:
        print('=' * 64)
        print(f'ERRORS ({len(errors)})  — folder is NON-conforming')
        print('=' * 64)
        for path, msg in errors:
            print(f'  [ERR ] {path}')
            print(f'         {msg}')
        print()

    if warnings:
        print('=' * 64)
        print(f'WARNINGS ({len(warnings)})  — folder still conforms')
        print('=' * 64)
        for path, msg in warnings:
            print(f'  [warn] {path}')
            print(f'         {msg}')
        print()

    print('-' * 64)
    if errors:
        print(f'RESULT: FAIL  ({len(errors)} error(s), {len(warnings)} warning(s))')
        return 1
    else:
        print(f'RESULT: PASS  (0 errors, {len(warnings)} warning(s))')
        return 0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: validate.py <path-to-content-folder>', file=sys.stderr)
        sys.exit(2)
    root = Path(sys.argv[1]).resolve()
    if not root.is_dir():
        print(f'Not a directory: {root}', file=sys.stderr)
        sys.exit(2)
    sys.exit(validate(root))
```

---

## 6. Three review reports (verbatim)

### 6.1 Critic (structural critique)

**VERDICT: REVISE**

**Top 5 Issues**

**1. CRITICAL — Cascade key declaration mechanism is undefined (§12.3 vs README "headline")**
README says `locale` is "the single inheritable key" the base blesses; §12.3.5 says cascade applies only to keys "a profile or schema explicitly marks as cascading" — base format declares nothing. Two implementers will disagree on whether `locale` cascades out-of-the-box. `examples/C-cascade` will validate differently depending on which doc wins.
*Fix:* Pick one. Either §12.3 normatively lists `locale` as base-declared, or strike the README claim.

**2. CRITICAL — `\ref:` escape is underspecified (§11.2)**
"A leading `\` is otherwise reserved" — reserved for what? Is `\\ref:` literal `\ref:`? Does `\foo` (no `ref:`) error, pass through, or strip the backslash? Round-tripping (§9) collides: a writer that preserves unknown fields containing `\x` strings doesn't know if `\` is data or sentinel.
*Fix:* Define: only `\ref:` is meaningful; all other leading `\` are literal data. Or use a non-collision sentinel.

**3. HIGH — "Both file form and folder form" collision rule is silent on modifiers (§7.1)**
`about.fr.json` + `about/index.fr.json` — same identity `about`, same modifier set, both forms present. Is this the §7.1 collision? What about `about.json` (file form, no modifier) + `about/index.fr.json` (folder form, fr modifier)? The spec says "single identity reachable as both" but identity-resolution strips modifiers, so the conflict matrix is ambiguous.
*Fix:* State explicitly: collision is per-(identity, modifier-set) tuple, and enumerate the cases.

**4. HIGH — Case-sensitivity rule contradicts portability (§7-§7.1)**
§7.4 mandates lowercase UTF-8 and SHOULD-reject mixed case. But on case-insensitive filesystems (macOS default, Windows, exFAT), `about.json` and `About.json` cannot coexist, and a writer cannot reliably *create* a lowercase-only tree from a mixed-case source without OS cooperation. Spec gives no guidance on what a consumer on a case-insensitive FS does when reading a tree authored on Linux with edge-case collisions.
*Fix:* Add normative note: conformance is defined against the byte-level names; tools on case-insensitive FS MUST surface this as a portability error.

**5. MEDIUM — Sidecar merge + cascade ordering has a quiet hole (§8 + §12.5)**
Pipeline says `content → sidecar → cascade → refs`. But §8.2 says sidecar values *override* content on collision. §12.3.3 says cascade fills *only if absent*. Question: if content is `{}`, sidecar sets `theme:"dark"`, and a cascading `theme` default exists — sidecar wins (correct). But §12.4 cuts "sidecar participation in cascade" — what about a sidecar on an `index.json` *collection record*? Does that sidecar's `defaults` block participate in the cascade chain? Unspecified.
*Fix:* State whether collection-record sidecars contribute `defaults` to the chain. Recommend: yes, merged into the index before chain construction.

**Ready to ship at 0.9.1?**
Almost. The framing is genuinely tight and the hard ceiling (§11.7) is the right call — that work landed. But two doc-internal contradictions (cascade key declaration; sidecar-on-index participation) and one underspecified escape (`\ref:`) will cause the first two real implementations to disagree on day one. None require structural change; all are clarification-level. Fix issues 1, 2, and 3 before publishing 0.9.1; 4 and 5 can ride the next draft. The format is sound; the spec text needs one more pass.

---

### 6.2 Code-reviewer (spec ↔ validator)

**Validator:** `apps/folderdb/validate.py`
**Examples:** all four run as documented (A fails on collision, B passes with 1 warning, C/D pass clean).

**Divergences**

**1. [CRITICAL] Unknown extensions silently become modifiers.** §7.3 says `.pdf`, `.png`, `.csv` are valid opaque payloads carrying metadata via a sidecar. `split_name()` (validate.py:41-49) splits on `.` and treats only the *last* segment as ext. So `brochure.pdf` parses as base=`brochure`, modifiers=`['pdf']`, ext=`""`, and its sidecar `brochure.pdf.json` parses as base=`brochure`, modifiers=`['pdf']`, ext=`json`. They match by coincidence so the sidecar test passes — but then `brochure.pdf.json` is flagged as an "orphan modifier sidecar" (validate.py:146-152) because the lookup table also contains `(brochure, ('pdf',))` ↔ itself, and the `mods and (base, ()) in content_keys` branch fires against the (nonexistent) base sibling logic loosely. Net effect: legal `.pdf` + `.pdf.json` pairs emit a bogus warning, and identity of `brochure.pdf` is just `brochure` (correct only by accident). Need an extension whitelist or a "last segment is always ext" rule that distinguishes known modifier tokens from content extensions — likely: ext is always the final segment, modifiers are everything between base and ext, AND if the file has only one dot the segment after is ext (not modifier). Spec example in §Appendix A explicitly relies on this: `brochure.pdf  brochure.json` resolves to identity `brochure`.

**2. [CRITICAL] Files with no extension silently accepted as records.** `noext` resolves to identity `noext`. §7 mandates `name[.modifier]*.ext` — `.ext` is required. `split_name` returns ext="" without complaint and the validator builds an identity from it. Should be an error.

**3. [HIGH] `split_name` mis-parses deep dot chains.** `a.b.c.d.e.json` parses as base=`a`, modifiers=`['b','c','d']`, ext=`json` and resolves to identity `a`. Per §7 each `.modifier` follows the same charset, which `b/c/d` satisfy, so this is technically legal — but combined with finding #1 it means `report.pdf.backup.json` would silently shadow identity `report` rather than be flagged.

**4. [HIGH] Standalone modifier-bearing `.json` orphans go unwarned.** §8.4 says "a modifier sidecar with no matching content sibling SHOULD be surfaced as a warning." `orphan.de.json` with no `orphan.*` siblings emits no warning — the `elif mods and (base, ()) in content_keys` branch (validate.py:146) requires a *base* sibling to fire. Per spec it should warn whenever a modifier-bearing JSON has no matching modifier-set sibling, regardless of whether the base exists.

**5. [MEDIUM] UTF-8 lowercase rule under-enforced.** §7 says all segments MUST be UTF-8 AND lowercase. Validator catches mixed-case and ASCII-charset violations, but `wéird.json` (lowercase, valid UTF-8, non-ASCII) is rejected via the charset regex — correct outcome, wrong message ("lowercase a-z 0-9 -" implies the issue is case, not ASCII). Cosmetic.

**6. [MEDIUM] Directory names not validated.** Naming rules in §7 apply to "all path segments." Validator only parses leaf filenames; `MyDir/file.json` or `My Dir/file.json` would skip directory-name checks. Did not test directly but `by_dir` keys are never charset-checked.

**7. [LOW] `is_folder_form` test is brittle.** validate.py:168 uses `s.name.startswith("index.")` — correct in practice, but a file literally named `index` (no ext) would slip through both as a record and as a non-folder-form. Tied to finding #2.

**8. [LOW] Manifest read twice.** validate.py:117 calls `p.read_text` twice for every `.json` (once for UTF-8 check, once for JSON parse). Functional, but UnicodeDecodeError from the second call won't be caught as UTF-8 (it raises before json.loads sees it). Minor.

**9. [OUT-OF-SCOPE-ACCEPTABLE] No references or cascade enforcement.** README explicitly defers §11/§12 to the Node/TS build. C-cascade and D-web examples pass with zero introspection of `defaults` or `ref:` strings. The spec uses MUST/MUST NOT/SHOULD in §11 and §12 (e.g. §11.6 "a conforming validator MUST report a dangling reference as a warning"; §11.7 hard-ceiling MUST-rejects). Documented gap, not a bug — but the README's "reference validator" claim is stronger than what the code delivers. Suggest tightening README wording: "base-format validator (§§5-9); §11-§12 deferred to the Node/TS FolderDB build."

**Verdict: REQUEST CHANGES.** The validator is a credible seed for the Node/TS port — pass 1-4 structure, identity resolution, collision detection, and hidden-name handling all match the spec's intent and the four examples behave as documented. But the extension-handling bugs (#1, #2, #3) mean any folder containing `.pdf`, `.png`, `.csv`, or extensionless files — i.e. the everyday case the spec elevates as a first-class opaque-content scenario in §5/§7.3 and Appendix A — gets wrong identities and spurious sidecar warnings. That is the spec's headline use case, not an edge case. Fix the `split_name` extension rule (last dot-segment is always ext; reject zero-dot files), make orphan-modifier warning trigger on missing modifier-set sibling regardless of base presence, and extend charset validation to directory segments. With those four changes plus a README scope-narrowing, this is a faithful executable companion to the §§5-9 base format. Until then, calling it "*the* reference validator" overpromises against §7.3 and §8.

---

### 6.3 Fresh-eye reader (first-read comprehension)

**Top 5 confusing moments (first-read)**

**1. The pitch never lands the "why."**
README §1 says *"convention for using a plain folder as a structured content store — files are records, folders are collections."* That's the *what*, not the *why*. Nowhere do you tell me what problem this solves that I don't already solve with "dump JSON files in folders + a README." No before/after, no failure mode of the naive approach. I have to infer the value (git-friendly CMS? portable headless content? alternative to Contentful?) from the "Clear (commercial CMS)" mention at the bottom. **Fix:** open with one concrete pain ("Git-friendly content stores keep reinventing the same five rules — sidecars, variants, identity, cascade, refs — incompatibly. Mosaic is that set, frozen.").

**2. "Identity" is the load-bearing concept and it ambushes you.**
§7.1: *"`about.json`, `about.fr.json`, and `about/index.json` all resolve to the same identity `about`."* This is the single cleverest idea in the spec and it's buried mid-section. I had to backtrack twice — first to figure out why `about.json` and `about/index.json` being "the same thing" is desirable (answer: so you can grow a leaf into a subtree without renaming refs), second to realize the whole ref system depends on it. **Fix:** lead §1 with a one-line example: *"`about.json` today, `about/index.json` tomorrow when it grows children — same identity, no broken links."*

**3. "Profile" is used before defined.**
README mentions "web profile" in sentence 4. 01-format §1 mentions "Profiles such as Mosaic Web." §4 says *"Profiles MAY add rules but MUST NOT contradict."* But "profile" is never in the Terminology section (§3). A first reader guesses it means "extension pack" but isn't sure if it's a config file, a schema, a separate spec doc, or all three. **Fix:** add to §3: *"Profile — a separate spec layered on the base, e.g. Mosaic Web, defining domain-specific keys."*

**4. The examples folder is anemic and abstract.**
Four examples, all named `A/B/C/D-feature`. Each contains 2–4 files testing one rule. No example is a recognizable *thing* — no blog, no docs site, no recipe book. After reading the spec I cannot confidently answer: "Where do tags go? Where does an author bio with a photo live? How do I model a tag-to-post many-to-many?" The C-cascade example has *one file* (`index.json`) — that's not a worked example, it's a fixture. **Fix:** one full example that's a 10-file blog with tags, authors, drafts, and i18n. Let the validator examples stay minimal; add a "cookbook" alongside.

**5. The refs/cascade doc feels bolted on — and §12.5's pipeline should be in §1.**
§11 opens by *promoting itself* from out-of-scope: *"This document promotes content references from out-of-scope to a defined Section 11."* That's spec-internal politics leaking to the reader. Worse, the four-step resolution pipeline in §12.5 (content → sidecar → cascade → refs) is the mental model the whole spec hinges on, and it's in an appendix-adjacent subsection of doc 2. I didn't know cascade happened *before* ref resolution until line 170 of file 3. **Fix:** put the 4-step pipeline diagram in 01-format §1, even as a forward reference. Drop the "promotes itself" framing.

**Would I build on it?**

Probably yes — but only after squinting. The locked decisions are genuinely impressive (the XPath-ceiling discipline in §11.7 is the most reassuring thing in the spec; cascade-as-anchor being explicitly *cut* tells me the author has fought this fight). But the README sells none of that. As written, a HN reader skims it, sees "folder convention + JSON," thinks "so… JSON Schema + a naming rule?" and closes the tab. The substance is 1.0-grade; the framing is still pre-alpha. Lead with the pain, lead with identity, lead with the pipeline — and the rest reads like the considered work it is.

---

## 7. Merged findings (ranked)

### 🔴 Must-fix before publishing 0.9.1

| # | Where | Issue | Source |
|---|---|---|---|
| 1 | `01-format.md` §12.3 vs spec README | README says `locale` is the base's one blessed cascading key. §12.3.5 says cascade only applies to schema-declared keys. Pick one. | Critic #1 |
| 2 | `validate.py` `split_name` | `.pdf`, `.png`, `.csv` mis-parse as modifiers. `brochure.pdf` resolves to identity `brochure` only by accident. Spec's headline opaque-payload case is broken in the validator. | Reviewer #1 |
| 3 | `validate.py` | Files with no extension silently accepted as records. §7 requires `.ext`. | Reviewer #2 |
| 4 | `02-references.md` §11.2 | `\ref:` escape underspecified. What is `\foo`? Round-tripping (§9) collides. | Critic #2 |

### 🟡 Should-fix before 0.9.2

| # | Where | Issue |
|---|---|---|
| 5 | `01-format.md` §7.1 | Collision rule silent on modifier sets. Need per-(identity, modifier-set) tuple. |
| 6 | `01-format.md` §7.4 + new | Case-insensitive filesystem portability rule missing. |
| 7 | `02-references.md` §12.4 | Sidecar-on-index participation in cascade chain unspecified. |
| 8 | `validate.py` | Orphan modifier sidecar warning only fires if base sibling exists. Per §8.4 should fire when modifier-set sibling missing. |
| 9 | `validate.py` | Directory-name charset not validated; only leaf filenames. |
| 10 | `spec/README.md` | Overpromises validator scope (refs/cascade not implemented). |

### 🟢 README rewrites (impact > effort)

| # | Fix |
|---|---|
| 11 | Lead README §1 with the **pain** ("git-friendly content stores keep reinventing the same five rules incompatibly; Mosaic is that set, frozen") not the *what* |
| 12 | Surface the **identity pivot** in §1 of `01-format.md` with the `about.json → about/index.json same-identity` example (currently buried in §7.1) |
| 13 | Add **"profile"** to terminology §3 (used before defined) |
| 14 | Add **one real-world cookbook example** — a blog with tags, authors, drafts, i18n — alongside the abstract A/B/C/D fixtures |
| 15 | Move the **4-step pipeline** (content → sidecar → cascade → refs) into `01-format.md` §1 as forward reference; currently it's in §12.5 of doc 2 |
| 16 | Drop §11 opening "promotes itself from out-of-scope" — spec-internal politics leaking to reader |

---

## 8. Your job, Claude (web)

I'd like you to do **one of these** and tell us which you picked:

**Option A — Independent second-pass review.** Read the spec text in §2 and §3 above. Forget the three reviews in §6. Tell us what *you* find. If you converge on the same findings, that's signal. If you find something the three missed, that's gold.

**Option B — Draft the must-fix patches (🔴).** For each of the 4 critical items in §7, write the exact text change as a unified diff against the spec docs in §2/§3. Don't change format; just produce the minimal edits.

**Option C — Draft the README rewrites (🟢).** Rewrite the spec README opener so it leads with the pain, surfaces the identity pivot, and includes the 4-step pipeline. Show a before/after. Plus draft a short cookbook example (a blog with i18n) using the spec.

**Option D — Stress-test the spec.** Invent 10 edge-case folder shapes that the spec doesn't explicitly address. For each, tell us what you think the spec implies, where it's ambiguous, and what a one-line spec addition would resolve it. (Examples to consider: symlinks, files with no body, identical content under different identities, very deep modifier chains, mixed locale + opaque payload.)

Pick whichever you can do best in one focused pass. Don't try to do all four; depth beats breadth.

---

## 9. Provenance

- **This bundle was generated** on 2026-05-17 by Claude Code (Opus 4.7) running on `/home/ms/active/mosaic-reframe-0.9.1/` (branch `0.9.1-spec`, commit `77058e7`).
- **The spec text in §2/§3/§4** is the verbatim file content of the corresponding files in `spec/format/`.
- **The validator in §5** is the verbatim file content of `apps/folderdb/validate.py`.
- **The three reviews in §6** are the verbatim outputs of three independent subagents (oh-my-claudecode:critic, oh-my-claudecode:code-reviewer, general-purpose), each given only the spec files + the explicit role I prompted them with. They did not see each other's output.
- **The merged findings in §7** are my synthesis of the three reviews; the ranking is my judgment.

If you want the raw files instead of the inlined text, the worktree is at `/home/ms/active/mosaic-reframe-0.9.1/` and the branch `0.9.1-spec` lives in `slavasolutions/mosaic` (not yet pushed to origin as of this bundle).

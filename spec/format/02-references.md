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
>
> The base format blesses exactly one key as cascading by default: `locale`.
> This single exception exists so every i18n-aware profile inherits the active
> locale without having to re-declare it. All other cascading keys MUST be
> declared by a profile or schema (§12.3 clause 5). There is no other
> base-blessed key, and none will be added.

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
5. Cascade applies to (a) the single base-blessed key `locale`, and (b) any
   additional keys a profile or schema explicitly declares cascading. No
   other keys cascade. A key that is neither `locale` nor declared cascading
   is never inherited. There is no "cascade everything" mode.
6. References (§11) are resolved **after** cascade, against the effective
   record. A cascaded value MAY itself be a reference.

### 12.4 What was cut (and why)

| Cut | Reason |
|-----|--------|
| Cascade as a reference *anchor* (`ref:foo` searching ancestors) | Two mechanisms doing one job. References are absolute/relative only (§11.3). Cascade is inheritance, not addressing. Keeping them separate is the rigidity win. |
| Deep merge / array concat | That is a merge language. Shallow key-level only. |
| Implicit "all fields cascade" | Action-at-a-distance with no opt-in. Only `locale` is base-blessed; all other cascading keys MUST be profile/schema-declared. |
| Sidecar participation in cascade | Sidecars override locally (§8); mixing them into the chain creates a 2-axis resolution order. Sidecar first, then cascade — never interleaved. |
| Cascading into opaque content | Cascade is JSON-only; opaque payloads have no keys to inherit. |

### 12.5 Resolution order (normative)

For any record, the effective JSON is computed in exactly this order, once:

```
1. content (.json) or empty object for opaque records
2. + sidecar merge            (01-format.md §8, shallow, sidecar wins)
3. + cascade fill             (§12.3, only for `locale` or declared keys, only if absent)
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
| Cascade | opt-in `defaults` on collection records; shallow; base-blessed `locale` plus declared keys only |
| Pipeline | content → sidecar → cascade → refs; fixed, single pass |
| Ceiling | no expressions, no predicates, no content-queries — ever |

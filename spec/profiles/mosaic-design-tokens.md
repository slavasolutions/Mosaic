# Mosaic Design Tokens — Profile Specification

**Version:** 0.9.4 (draft, companion to the base format)
**Status:** Working Draft
**Layer:** Profile. Depends on `../format/01-format.md` and
`../format/02-references.md`. Independent of `mosaic-web.md`.
**Scope:** the shape and propagation of design tokens. Defines how
visual values (colours, fonts, spacing, etc.) attach to records and
flow through the tree. Does not define rendering — engines map tokens
to CSS, native style systems, PDF, etc. as they see fit.

---

## 1. Purpose

Multiple consumers of the same folder need to render content with a
consistent visual identity — and to swap that identity without
re-editing every record. Mosaic Design Tokens defines a tiny vocabulary
for that: a folder declares its tokens once, records reference an
active theme, and any compliant renderer produces the same visual
result from the same folder.

This profile is independent of the Web profile on purpose. PDF
generators, native mobile renderers, design-system documentation tools,
and email-template engines all want tokens without URL routing. Keeping
tokens in their own profile lets those consumers adopt without
declaring conformance to a profile they don't need.

## 2. Detection

A consumer MAY treat a folder as a Mosaic Design Tokens site when its
root `mosaic.json` declares either:

```json
{ "profiles": { "design-tokens": {} } }
```

or the long-form profile name:

```json
{ "profiles": { "mosaic-design-tokens": {} } }
```

Both forms are equivalent. If neither form is present, this profile is
inactive.

## 3. Reserved field names

When this profile is active, two field names are reserved on records:

- **`tokens`** — a JSON object whose keys are flat dotted token names
  (`color.brand.primary`, `font.body`, `space.gutter`) and whose values
  are token values (strings, or DTCG-style typed value objects).
  Records inside a `tokens/` collection MAY set this field directly;
  other records SHOULD NOT.
- **`theme`** — a `ref:` value pointing at a token record (a record
  whose data contains a `tokens` field). The referenced record's
  `tokens` object is the active theme for the referring record.

A record's "active tokens" are determined by following its `theme` ref
(after refs are resolved per `../format/02-references.md` §11.4) and
reading the resolved target's `tokens` field.

## 4. Cascade declaration

This profile declares the field name **`theme`** as a cascading key per
`../format/02-references.md` §12.3 clause 5.

That means: if a record does not have its own `theme` field, the engine
fills it from the nearest collection record's `defaults.theme` walking
up the tree, per the base cascade rules.

The `tokens` field itself does NOT cascade. Tokens live on token records;
records reference a theme rather than carrying tokens inline.

## 5. Recommended organisation

The RECOMMENDED convention is a `tokens/` collection at the root:

```
content/
  mosaic.json                  { "profiles": { "design-tokens": {} } }
  tokens/
    index.json                 { "tokens": { "color.bg": "#faf6ee", ... } }
    dark.json                  { "tokens": { "color.bg": "#15130f", ... } }
  pages/
    index.json                 { "defaults": { "theme": "ref:/tokens" } }
    about.json
    night.json                 { "theme": "ref:/tokens/dark" }
```

Benefits of this convention:

- **Strip design easily** — a consumer that doesn't render (RSS, search
  index, AI ingest) skips the `tokens/` directory and the records carry
  no design data.
- **Hot-swap themes** — change one `defaults.theme` line to point at a
  different theme record; rebuild; the whole site re-themes. No record
  content touched.
- **Per-record override** — set `theme:` on a single record to override
  the cascaded default for that record (§12.3 clause 3 — record's own
  value wins over cascaded value).
- **Designer / content separation** — designers edit files under
  `tokens/`, content editors edit everything else. Zero file overlap.

Inline tokens on records (placing a `tokens` field directly on a
non-token record) is permitted but discouraged. It mixes visual data
into content records, hurts strippability, and bypasses the cascade.
Use it only for rare per-record one-off overrides.

## 6. Rendering

This profile does not require any particular rendering. A consumer
that does render MAY map tokens to its target medium however it sees
fit. The following is RECOMMENDED for CSS-emitting consumers (web,
email):

- Emit one CSS custom property per token, on `:root`.
- Naming: replace each `.` in the token name with `-` and prefix with
  `--`. Examples:
  - `color.brand.primary` → `--color-brand-primary`
  - `font.body` → `--font-body`
  - `space.gutter` → `--space-gutter`

Native renderers (mobile, PDF, native desktop) define their own
mapping. The point is that the token NAMES are stable across mediums
even when the rendering differs.

## 7. Token value shapes

Token values are strings by default (`"#faf6ee"`, `"system-ui"`).

Consumers and profiles MAY define richer typed value objects following
the Design Tokens Community Group (DTCG) format:

```json
{
  "$value": "#faf6ee",
  "$type": "color",
  "$description": "Warm cream page background"
}
```

The base profile MUST accept both flat string values and DTCG-typed
objects; engines that recognize only flat strings SHOULD silently fall
back to `$value` when encountering DTCG-typed objects.

## 8. What this profile does NOT define

Out of scope for 0.9.4 of this profile. Each MAY return in a later
draft:

- **Per-component overrides.** A record can have its own `theme` ref,
  but the profile defines no way to override individual tokens piecemeal
  on a record.
- **Layout, spacing scales, type scales.** These are downstream concerns.
- **Runtime token mutation.** Switching themes at runtime (e.g. a
  "dark mode" toggle in the browser) is a consumer concern; the profile
  defines static design-time tokens.
- **Validation of token names.** Engines MAY warn on unknown token
  categories; the profile does not list a fixed taxonomy.
- **Inheritance between theme records.** A theme record CANNOT extend
  another theme record in this draft. Each theme record is a complete
  set of tokens.

## 9. Relationship to other profiles

This profile is independent. A folder MAY declare design-tokens
without declaring mosaic-web (a token-only folder, e.g. for PDF
generation). A folder MAY declare both (the typical web site).
The two profiles do not interact at the spec level.

## 10. Status

This is a 0.9.4 working draft. The headline concepts (a `tokens/`
collection, `theme` as a cascading ref field, the strippability and
hot-swap properties) are intended to be stable. The DTCG-typed value
shapes in §7 may evolve as DTCG itself stabilises.

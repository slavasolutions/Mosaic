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

`[ ] confirm`   `[ ] reject (and tell me why)`

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

**Recommended:** file form and folder form are two spellings of one identity;
converting between them is never a rename; both-at-once is a validator error.
This makes your `about.json` shortcut safe forever and needs no new rule.

`[ ] accept recommended`   `[ ] discuss`

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

That is the **entire** difference: in STRICT the base format inherits nothing
unless a schema explicitly declares the key. In PRAGMATIC it does the same,
*plus* it always lets `locale` inherit, so every translation profile gets it
free instead of re-declaring it.

Plain version: **should the base format know the single word `locale`?**

**Recommended:** PRAGMATIC. `locale` is needed by every realistic profile;
forcing each to re-declare it is boilerplate with no upside. One exception,
clearly named, is cheaper than the purity.

`[ ] STRICT`   `[ ] PRAGMATIC (recommended)`

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

**Recommended:** yes — one canonical sidecar per record; variants are sparse
overrides only. Less duplication, no new concept.

`[ ] accept recommended`   `[ ] variants must be complete`

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

**Recommended:** accept as written; root configurable in `mosaic.json`,
default `pages`. (Web profile is a *later* document — this only confirms the
shape so the base doesn't accidentally bake in web assumptions.)

`[ ] accept recommended`   `[ ] discuss`

---

## Decision 5 — locale: base or profile? (rolls up from #2)

If Decision 2 = **PRAGMATIC**, then: variant *syntax* (`name.fr.json`) lives
in the base; locale *resolution* (which variant wins, fallback order) lives in
the i18n/web profile; and the base blesses `locale` as the one cascading key.
That is the consistent package.

If Decision 2 = **STRICT**, the base knows `locale` not at all and the profile
owns everything including declaring it cascading.

**Recommended:** follows your Decision 2 answer. No separate choice needed if
you pick PRAGMATIC.

`[ ] follows #2`

---

## Once you mark these

Reply with just the picks (e.g. "0 confirm, 1 rec, 2 pragmatic, 3 rec, 4 rec").
I will then produce the final `01-format.md` + `02-references.md` with every
decision locked, the testkit regenerated to match, and a one-page changelog of
what each decision removed from the spec.

The spec only ever gets *smaller* from here.

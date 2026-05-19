A *reference* is a string that starts with `ref:` and names another record by its identity. Wherever it appears in a record's data, the framework resolves it before the page renders.

## The shape

```
ref:<identity>[#<json-pointer>]
```

- `ref:/team/ada` — the whole record at `team/ada`.
- `ref:/team/ada#/name` — just the `name` field.
- `ref:../tokens/light` — relative, resolved from the folder of the referring record.

The leading `ref:` is a sentinel. If you actually need a literal string starting with those four characters, escape it as `\ref:`.

## Why this matters in practice

We use it for two things every day in this shop:

1. **Authors.** A blog post says `"author": "ref:/team/ada"`. The page renders the Person card. When Ada updates her bio, every post she's written follows along.
2. **Themes.** The root sets `"defaults": { "theme": "ref:/tokens" }`. Every page in the site cascades that reference down. Swapping themes is one line.

## A worked resolution

Take the sidecar for the previous post:

```json
{
  "@type": "BlogPosting",
  "title": "Hello, world",
  "author": "ref:/team/ada"
}
```

After resolution, the `author` field is no longer a string — it is the Person record:

```json
{
  "@type": "Person",
  "name": "Ada Lovelace",
  "role": "Pattern-maker",
  "bio": "Joined Acme in 2018. Restorer of brass, painter of moths."
}
```

The layout reads `author.name`, `author.role`, `author.bio` and is none the wiser that any indirection happened.

## What happens if the target is missing

Per the spec, a dangling reference does not break the build. The validator emits a **WARNING** and the field stays as the literal `ref:` string. We have found this much friendlier than a hard error during a restore-from-backup.

> **In short:** references are how a folder of records becomes a small linked graph instead of a pile of duplicated JSON.

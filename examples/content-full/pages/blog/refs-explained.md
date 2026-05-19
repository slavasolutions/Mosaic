A *reference* is a string that starts with `ref:` and names another record by its identity. Wherever it appears in a record's data, the framework resolves it before the page renders.

## The shape

```
ref:<identity>[#<json-pointer>]
```

- `ref:/team/ada` — the whole record at `team/ada`.
- `ref:/team/ada#/name` — just the `name` field.
- `ref:../tokens/light` — relative, resolved from the folder of the referring record.

## Why it matters in this shop

We use it for two things:

1. **Authors.** A blog post says `"author": "ref:/team/ada"`. The post page renders Ada's Person card.
2. **Themes.** The root sets `"defaults": { "theme": "ref:/tokens" }`. Every page cascades that reference down. Swapping themes is one line.

If the target is missing, the validator warns; the build still completes. Friendlier than a hard error during a restore-from-backup.

This is the first post in our journal. We will use it mostly to write down the things we keep forgetting between pours, and occasionally to show a finished piece.

## Why we're keeping a journal

Every shop has a notebook somewhere, half full of grease. Ours is on a shelf above the burnout kiln and has been there since 2017. Half of what is in it is wrong and the other half is illegible. So we are doing it again, in public, with dates.

Three things will live here:

- **Process notes** — small fixes that took us a week to find.
- **Casting logs** — what we poured, what it weighed, what failed.
- **Sourcing** — where the wax, the sand, and the bronze are coming from this season.

## A worked example

Last Thursday we poured a run of six escutcheons in C932. The shop notes are short:

| Piece | Wax (g) | Cast (g) | Notes |
|-------|---------|----------|-------|
| 1     | 18.4    | 184.0    | Clean. |
| 2     | 18.2    | 183.1    | Tiny shrink behind the boss. Filed out. |
| 3     | 18.5    | —        | Cold shut on the lip. Re-melted. |
| 4     | 18.3    | 183.6    | Clean. |
| 5     | 18.4    | 184.2    | Clean. |
| 6     | 18.4    | 183.9    | Faint flash along the parting line. |

Five out of six is a fine yield for this pattern. The cold shut on #3 was the gate — we had it at the top of the lip instead of the side, and the metal hit the wall before it filled the detail.

### Code in the body

The markdown renderer also handles inline code like `pages/blog/hello.md` and fenced blocks. Here is the sidecar that wraps this very page:

```json
{
  "@type": "BlogPosting",
  "title": "Hello, world",
  "publishedAt": "2026-05-14",
  "author": "ref:/team/ada"
}
```

The `author` field is a *reference*. The framework resolves it against the folder before the page renders, so the layout sees the full Person record, not the literal string.

> If you want the long version of how that works, the next post is the one to read.

That's enough for a first entry. Back to the shed.

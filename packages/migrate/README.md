# @ssolu/mosaic-migrate

Adoption-ramp scanner for [Mosaic](https://github.com/slavasolutions/mosaic). Reads an existing site (HTML / JSX / MDX / CSS) and outputs a markdown report of opportunities to extract Mosaic shapes: design tokens, snippet records, block records, per-record meta.

Read-only. No auto-rewriting. Heuristic — review every finding before extracting.

## Install

```sh
npm i -D @ssolu/mosaic-migrate
```

Or run without installing:

```sh
npx @ssolu/mosaic-migrate scan ./path/to/site
```

## Usage

```sh
mosaic-migrate scan ./my-site
# writes mosaic-migration-report.md and mosaic-migration-report.json
```

Flags:

| Flag | Default | Meaning |
|---|---|---|
| `-o, --out-md <file>` | `mosaic-migration-report.md` | Markdown output path |
| `-j, --out-json <file>` | `mosaic-migration-report.json` | JSON output path |
| `--stdout` | _off_ | Print markdown to stdout, skip file writes |

## What it detects

| Detector | Looks for | Recommends |
|---|---|---|
| Hardcoded colors | `#hex`, `rgb()`, `rgba()`, `hsl()`, named CSS colors | Extract as `color.swatch-N` tokens in `tokens/index.json` (rename slugs) |
| Repeated text | Text nodes ≥3 chars repeating ≥3 times | Extract as `/snippets/<slug>` global records, ref each occurrence |
| Meta tags | `<meta>` + `<link rel>` in HTML `<head>` | Migrate to record-level `meta:` block (mosaic-web §7) |
| CTA / buttons | `<a class="button|btn|cta|action">`, `<button>` with action-verb text | Extract as `/snippets/cta-<slug>` block records, compose via section refs (ADR 0002) |
| Image URLs | `src=`, `srcset=`, `background-image: url()`, `og:image` | External URLs stay; local images need per-image decision |

## Programmatic API

```ts
import { scan, toMarkdown, toJson } from '@ssolu/mosaic-migrate';

const result = await scan('./my-site');
console.log(toMarkdown(result));
console.log(result.findings);
```

## False positives

Heuristic by design. Common gotchas:

- A hex value in code (`#fff` in a hash key, `#FF00FF` in a regex test) is flagged.
- JSX text extraction uses a regex fallback — multi-line text spans and prop-embedded text can be missed.
- CTA detection keys on class names and verb-prefix text. A `<button>Submit</button>` without "Get/Sign/Try/Buy/Contact/…" prefix won't fire.
- Color name detection is restricted to CSS files with a preceding `:` to keep noise down. `<span>red</span>` will not be flagged.

Re-run, eyeball the report, ignore what doesn't make sense.

## Scope

V1 is the five detectors above. Future:

- PostCSS-backed proper parsing (vs regex) for CSS.
- `@babel/parser`-backed JSX scanning for higher-fidelity text node and prop scanning.
- MDX-aware extraction of frontmatter + body shapes.
- Form-field grouping suggestions.
- Side-effect-free patch suggestions (write tokens + snippets stubs, never touch source).

## License

Apache-2.0

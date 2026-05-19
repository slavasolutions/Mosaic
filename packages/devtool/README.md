# @ssolu/mosaic-devtool

A small browser-side inspector for pages rendered from a [Mosaic](https://github.com/slavasolutions/mosaic) folder. Drop the script in, get a floating button that opens a panel with four tabs:

- **Resolved** — the resolved record the page was rendered from.
- **Raw** — the original JSON file content, pre-cascade (optional).
- **JSON-LD** — the schema.org subset emitted to crawlers, stripped of Mosaic-internal fields per [mosaic-web §6](../../spec/profiles/mosaic-web.md).
- **HTML head** — the rendered `<head>` content, so you can see what social cards and crawlers see.

Zero runtime dependencies. ~3-4 kB minified. Shadow-DOM isolated — does not inherit from or leak to your page styles.

## Drop-in install

Copy `dist/mosaic-devtool.js` into your site's public assets, then:

```html
<script type="application/json" id="mosaic-record">…resolved-record JSON…</script>
<!-- optional, only if your adapter exposes the pre-cascade record -->
<script type="application/json" id="mosaic-raw-record">…raw JSON…</script>

<script src="/mosaic-devtool.js" defer></script>
```

The IIFE mounts on `DOMContentLoaded`. Calling the script twice is fine — it replaces the existing UI.

## Production toggle

The devtool mounts unconditionally if its script is loaded. The convention is for adapters and example sites to gate the `<script src>` injection behind dev mode or a `?debug=1` query, e.g.:

```astro
{(import.meta.env.DEV || Astro.url.searchParams.has('debug')) && (
  <script src={href('/mosaic-devtool.js')} defer></script>
)}
```

## ESM API

For tests or tooling that wants to call the devtool directly:

```ts
import { mount, buildJsonLd } from '@ssolu/mosaic-devtool';
mount(); // attach the UI to document.body
const ld = buildJsonLd(record); // null when @type missing
```

## Development

```bash
npm run build --workspace=packages/devtool   # tsc → dist/esm + esbuild → dist/mosaic-devtool.js
npm test --workspace=packages/devtool        # vitest in jsdom
```

License: Apache-2.0.

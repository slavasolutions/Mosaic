# @ssolu/mosaic-devtool

A small browser-side inspector for pages rendered from a [Mosaic](https://github.com/slavasolutions/mosaic) folder. Drop the script in, get a floating button that opens a panel with up to six tabs:

- **Resolved** — the resolved record the page was rendered from.
- **Raw** — the original JSON file content, pre-cascade (optional).
- **JSON-LD** — the schema.org subset emitted to crawlers, stripped of Mosaic-internal fields per [mosaic-web §6](../../spec/profiles/mosaic-web.md).
- **HTML head** — the rendered `<head>` content, so you can see what social cards and crawlers see.
- **Tree** — the Mosaic folder structure, indented with file-type icons. Only appears when the host page injects `<script id="mosaic-tree">`. Highlights the active record path.
- **Sites** — links to the deployed Mosaic variants (Astro home/about/blog/blog-post, Next home). Marks the current page with `aria-current="page"`. Override via `<script id="mosaic-sites">`.

Zero runtime dependencies. ~12 kB minified IIFE. Shadow-DOM isolated — does not inherit from or leak to your page styles.

## Drop-in install

Copy `dist/mosaic-devtool.js` into your site's public assets, then:

```html
<script type="application/json" id="mosaic-record">…resolved-record JSON…</script>
<!-- optional, only if your adapter exposes the pre-cascade record -->
<script type="application/json" id="mosaic-raw-record">…raw JSON…</script>
<!-- optional, enables the Tree tab -->
<script type="application/json" id="mosaic-tree">
  { "entries": [{ "path": "pages/about.json" }, { "path": "index.json" }],
    "activePath": "pages/about.json" }
</script>
<!-- optional, overrides the default Sites pill row -->
<script type="application/json" id="mosaic-sites">
  [ { "label": "Home", "url": "/" }, { "label": "Blog", "url": "/blog/" } ]
</script>

<script src="/mosaic-devtool.js" defer></script>
```

The IIFE mounts on `DOMContentLoaded`. Calling the script twice is fine — it replaces the existing UI.

## Production toggle

The devtool mounts unconditionally if its script is loaded. Example sites in this repo load the devtool on every render and let visitors opt out with `?nodebug=1` on the URL:

```astro
<script is:inline>
  (function () {
    if (location.search.indexOf('nodebug=1') !== -1) return;
    var s = document.createElement('script');
    s.src = '/_mosaic-devtool/mosaic-devtool.js';
    s.defer = true;
    document.head.appendChild(s);
  })();
</script>
```

Adapters that prefer an opt-in gate can invert the check (e.g. require `?debug=1`) — the IIFE itself is unconditional once it loads.

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

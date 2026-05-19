# @ssolu/mosaic-validator-web

Drag-and-drop validator for Mosaic folders, in the browser.

Wraps [`@ssolu/mosaic-core`'s `validateFiles`](../core/src/validate.ts) plus a tiny File-API/drop-zone UI. The validator runs entirely client-side — nothing leaves the browser.

## Drop-in install

```html
<div data-mosaic-validator></div>
<script src="/mosaic-validator-web.js" defer></script>
```

The IIFE auto-mounts on every `[data-mosaic-validator]` host on `DOMContentLoaded`. Style the surface in your own CSS — the package emits structural classes only:

- `.mosaic-validator-web-host`
- `.mosaic-validator-web-dropzone` (`.is-over` while a folder is being dragged)
- `.mosaic-validator-web-pick`
- `.mosaic-validator-web-results`
- inside results: `.summary`, `.findings`, `.finding.error`, `.finding.warning`, `.meta`

## ESM API

```ts
import { mount } from '@ssolu/mosaic-validator-web';
mount({ host: document.getElementById('validator')! });
```

Lower-level helpers (`readDataTransfer`, `readFileList`, `renderResult`) are also exported.

## Coverage

The browser validator runs §§5–9 of the spec — identity, modifier charset, sidecar matching, file/folder collisions, JSON parse, markdown frontmatter warning. Refs and cascade live in `readFolder` (Node), not here.

## Browser support

Modern browsers only (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+). Uses `webkitGetAsEntry()` for drag-and-drop folder reads, with a `<input type="file" webkitdirectory>` fallback for the keyboard path. Each file capped at 2 MB to keep the validator snappy; bigger files are silently skipped.

## Dev

```bash
npm run build --workspace=packages/validator-web    # tsc + esbuild → dist/mosaic-validator-web.js
npm test  --workspace=packages/validator-web        # vitest in jsdom
```

License: Apache-2.0.

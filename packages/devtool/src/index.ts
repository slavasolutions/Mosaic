/**
 * @ssolu/mosaic-devtool — browser-side inspector for Mosaic pages.
 *
 * Two ways to use:
 *
 *   1. Drop-in <script src="@ssolu/mosaic-devtool/script"> tag. The
 *      bundled IIFE (`dist/mosaic-devtool.js`) calls `mount()` on
 *      DOMContentLoaded automatically. See `src/iife.ts`.
 *
 *   2. ESM import for tooling/tests:
 *        import { mount, buildJsonLd } from '@ssolu/mosaic-devtool';
 *        mount();
 */

export { mount } from './mount.js';
export type { MountOptions } from './mount.js';
export { buildJsonLd } from './jsonld.js';
export type { MosaicLikeRecord } from './jsonld.js';
export { prettyJson, formatHead } from './format.js';

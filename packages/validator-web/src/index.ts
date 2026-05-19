/**
 * @ssolu/mosaic-validator-web — client-side Mosaic folder validator.
 *
 * Two ways to use:
 *
 *   1. ESM:
 *        import { mount } from '@ssolu/mosaic-validator-web';
 *        mount({ host: document.getElementById('validator')! });
 *
 *   2. Drop-in `<script src="…/mosaic-validator-web.js">`. The IIFE
 *      auto-mounts on any element with `data-mosaic-validator`.
 */

export { mount } from './mount.js';
export type { MountOptions } from './mount.js';
export { readDataTransfer, readFileList } from './files.js';
export type { ReadResult } from './files.js';
export { renderResult } from './render.js';

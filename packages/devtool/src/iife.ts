/**
 * IIFE entry — what `<script src="mosaic-devtool.js">` actually runs.
 *
 * Waits for DOMContentLoaded (or runs immediately if the document is
 * already interactive) and calls `mount()`. The ESM consumers in
 * `index.ts` import `mount` directly and call it themselves.
 */

import { mount } from './mount.js';

function go(): void {
  try {
    mount();
  } catch (err) {
    console.error('[mosaic-devtool] mount failed:', err);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go, { once: true });
  } else {
    go();
  }
}

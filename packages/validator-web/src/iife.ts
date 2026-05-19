/**
 * IIFE entry — auto-mounts the validator on every element with the
 * `data-mosaic-validator` attribute, on DOMContentLoaded.
 */

import { mount } from './mount.js';

function go(): void {
  const hosts = document.querySelectorAll<HTMLElement>('[data-mosaic-validator]');
  hosts.forEach((host) => {
    try {
      mount({ host });
    } catch (err) {
      console.error('[mosaic-validator-web] mount failed:', err);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go, { once: true });
  } else {
    go();
  }
}

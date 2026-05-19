/**
 * Mount a drop zone + a fallback `<input webkitdirectory>` button onto a
 * host element. When the user drops a folder (or picks one), read it via
 * the File API, run @ssolu/mosaic-core's pure `validateFiles`, and render
 * the result alongside.
 *
 * Idempotent: calling `mount(host)` twice replaces the prior UI.
 *
 * The IIFE entry (`iife.ts`) auto-mounts on any element with the
 * `data-mosaic-validator` attribute on DOMContentLoaded. The ESM entry
 * lets callers position the UI themselves.
 */

import { validateFiles } from '@ssolu/mosaic-core';
import { readDataTransfer, readFileList } from './files.js';
import { renderResult } from './render.js';

export interface MountOptions {
  /** Element receiving the drop zone + button + results. */
  host: HTMLElement;
}

export function mount(opts: MountOptions): void {
  const { host } = opts;
  host.innerHTML = '';
  host.classList.add('mosaic-validator-web-host');

  const dropzone = document.createElement('div');
  dropzone.className = 'mosaic-validator-web-dropzone';
  dropzone.setAttribute('role', 'button');
  dropzone.setAttribute('tabindex', '0');
  dropzone.innerHTML =
    '<p class="prompt">Drop a Mosaic folder here</p>' +
    '<p class="hint">or pick one — runs locally, nothing leaves the browser</p>';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.className = 'mosaic-validator-web-input';
  // webkitdirectory is supported in all current browsers (Chrome/Edge/Safari/Firefox).
  (fileInput as unknown as { webkitdirectory: boolean }).webkitdirectory = true;
  fileInput.setAttribute('webkitdirectory', '');
  fileInput.setAttribute('directory', '');
  fileInput.multiple = true;
  fileInput.style.display = 'none';

  const pickBtn = document.createElement('button');
  pickBtn.type = 'button';
  pickBtn.className = 'mosaic-validator-web-pick';
  pickBtn.textContent = 'Pick a folder…';

  const results = document.createElement('div');
  results.className = 'mosaic-validator-web-results';

  host.append(dropzone, pickBtn, fileInput, results);

  function setStatus(text: string, kind: 'info' | 'busy' = 'info'): void {
    results.innerHTML = `<p class="status ${kind}">${text}</p>`;
  }

  async function runOnFiles(
    files: globalThis.Map<string, string>,
    rootName: string,
    skipped: string[],
  ): Promise<void> {
    if (files.size === 0) {
      setStatus('No readable files in the folder.');
      return;
    }
    const r = validateFiles({ files });
    renderResult(results, r);
    if (rootName || skipped.length > 0) {
      const note = document.createElement('p');
      note.className = 'meta';
      const parts: string[] = [];
      if (rootName) parts.push(`Folder: ${rootName}`);
      if (skipped.length > 0)
        parts.push(`${skipped.length} non-text file${skipped.length === 1 ? '' : 's'} skipped`);
      note.textContent = parts.join(' · ');
      results.appendChild(note);
    }
  }

  // ---- Drag-and-drop --------------------------------------------------
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-over');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-over');
  });
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-over');
    if (!e.dataTransfer) return;
    setStatus('Reading folder…', 'busy');
    const read = await readDataTransfer(e.dataTransfer.items);
    await runOnFiles(read.files, read.rootName, read.skipped);
  });
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // ---- File-picker fallback ------------------------------------------
  pickBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files) return;
    setStatus('Reading folder…', 'busy');
    const read = await readFileList(fileInput.files);
    await runOnFiles(read.files, read.rootName, read.skipped);
    // Reset so picking the same folder again re-triggers `change`.
    fileInput.value = '';
  });
}

/**
 * Render a `ValidationResult` into a host DOM node.
 *
 * Output structure (all classes scoped under `.mosaic-validator-web`):
 *
 *   <div class="mosaic-validator-web">
 *     <p class="summary"…>14 records · 0 errors · 1 warning</p>
 *     <ul class="findings">
 *       <li class="finding error">
 *         <span class="sev">error</span>
 *         <code class="path">pages/About.json</code>
 *         <span class="msg">…</span>
 *       </li>
 *       …
 *     </ul>
 *   </div>
 *
 * Caller styles the result; we attach no inline CSS so the host page can
 * theme it freely.
 */

import type { ValidationResult } from '@ssolu/mosaic-core';

export function renderResult(host: HTMLElement, r: ValidationResult): void {
  host.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'mosaic-validator-web';

  const summary = document.createElement('p');
  summary.className = 'summary' + (r.ok ? ' ok' : ' fail');
  const e = r.errors.length;
  const w = r.warnings.length;
  const rec = r.records.size;
  summary.textContent =
    `${rec} record${rec === 1 ? '' : 's'} · ` +
    `${e} error${e === 1 ? '' : 's'} · ` +
    `${w} warning${w === 1 ? '' : 's'}` +
    (r.ok ? ' — OK' : ' — FAIL');
  wrap.appendChild(summary);

  if (e === 0 && w === 0) {
    const note = document.createElement('p');
    note.className = 'all-good';
    note.textContent = 'Folder validates clean against §§5–9 of the spec.';
    wrap.appendChild(note);
    host.appendChild(wrap);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'findings';

  function append(severity: 'error' | 'warning', path: string, message: string): void {
    const li = document.createElement('li');
    li.className = `finding ${severity}`;
    const sev = document.createElement('span');
    sev.className = 'sev';
    sev.textContent = severity;
    const p = document.createElement('code');
    p.className = 'path';
    p.textContent = path;
    const m = document.createElement('span');
    m.className = 'msg';
    m.textContent = message;
    li.append(sev, p, m);
    list.appendChild(li);
  }

  for (const err of r.errors) append('error', err.path, err.message);
  for (const warn of r.warnings) append('warning', warn.path, warn.message);

  wrap.appendChild(list);
  host.appendChild(wrap);
}

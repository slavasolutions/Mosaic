/**
 * Mount the Mosaic devtool: a floating button + a slide-up panel with
 * four tabs (Resolved, Raw, JSON-LD, HTML head).
 *
 * The panel lives in a shadow root attached to a `<div>` we own, so its
 * CSS is fully isolated from the host page.
 *
 * Inputs (all optional, sniffed from the document):
 *   - `<script type="application/json" id="mosaic-record">`     — resolved record
 *   - `<script type="application/json" id="mosaic-raw-record">` — raw, pre-cascade record
 *
 * The `mount()` call is idempotent: calling twice replaces the existing
 * UI rather than stacking two.
 */

import { buildJsonLd, type MosaicLikeRecord } from './jsonld.js';
import { prettyJson, formatHead } from './format.js';
import { STYLES } from './styles.js';

const HOST_ID = 'mosaic-devtool-host';
const LS_KEY = 'mosaic-devtool.tab';

type TabId = 'resolved' | 'raw' | 'jsonld' | 'head';

interface Tab {
  id: TabId;
  label: string;
  body: () => { kind: 'text'; text: string } | { kind: 'empty'; text: string };
}

function readJsonScript(id: string): MosaicLikeRecord | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const raw = el.textContent ?? '';
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as MosaicLikeRecord) : null;
  } catch {
    return null;
  }
}

export interface MountOptions {
  /**
   * Override the document the devtool reads from. Defaults to the global
   * `document`. Useful for testing inside jsdom.
   */
  doc?: Document;
}

export function mount(opts: MountOptions = {}): void {
  const doc = opts.doc ?? document;
  // Remove any prior instance so this is idempotent.
  const prior = doc.getElementById(HOST_ID);
  if (prior) prior.remove();

  const resolved = readJsonScript('mosaic-record');
  const rawRecord = readJsonScript('mosaic-raw-record');

  const tabs: Tab[] = [
    {
      id: 'resolved',
      label: 'Resolved',
      body: () =>
        resolved
          ? { kind: 'text', text: prettyJson(resolved) }
          : { kind: 'empty', text: 'No <script id="mosaic-record"> found on this page.' },
    },
    {
      id: 'raw',
      label: 'Raw',
      body: () =>
        rawRecord
          ? { kind: 'text', text: prettyJson(rawRecord) }
          : {
              kind: 'empty',
              text:
                'No <script id="mosaic-raw-record"> on this page. Add one to see the ' +
                'pre-cascade record alongside the resolved one.',
            },
    },
    {
      id: 'jsonld',
      label: 'JSON-LD',
      body: () => {
        if (!resolved) {
          return {
            kind: 'empty',
            text: 'No record to derive JSON-LD from.',
          };
        }
        const ld = buildJsonLd(resolved);
        return ld
          ? { kind: 'text', text: prettyJson(ld) }
          : {
              kind: 'empty',
              text:
                'This record has no `@type` field, so it does not opt in to JSON-LD ' +
                'emission (mosaic-web §6).',
            };
      },
    },
    {
      id: 'head',
      label: 'HTML head',
      body: () => ({ kind: 'text', text: formatHead(doc.head.innerHTML) }),
    },
  ];

  const host = doc.createElement('div');
  host.id = HOST_ID;
  doc.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  const style = doc.createElement('style');
  style.textContent = STYLES;
  root.appendChild(style);

  // Build markup.
  const fab = doc.createElement('button');
  fab.className = 'fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Open the Mosaic devtool');
  fab.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M5 2 H3 a1 1 0 0 0 -1 1 V13 a1 1 0 0 0 1 1 H5 M11 2 H13 a1 1 0 0 1 1 1 V13 a1 1 0 0 1 -1 1 H11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
    '</svg> JSON';

  const modal = doc.createElement('div');
  modal.className = 'modal';
  modal.hidden = true;

  const backdrop = doc.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.dataset.close = '';

  const panel = doc.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Mosaic devtool');

  const head = doc.createElement('div');
  head.className = 'head';

  const headRow = doc.createElement('div');
  headRow.className = 'head-row';
  const headTitle = doc.createElement('h2');
  headTitle.textContent = 'Mosaic devtool';
  const closeBtn = doc.createElement('button');
  closeBtn.className = 'close';
  closeBtn.type = 'button';
  closeBtn.dataset.close = '';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  headRow.append(headTitle, closeBtn);

  const tabBar = doc.createElement('div');
  tabBar.className = 'tabs';
  tabBar.setAttribute('role', 'tablist');
  head.append(headRow, tabBar);

  const body = doc.createElement('div');
  body.className = 'body';

  const note = doc.createElement('div');
  note.className = 'note';
  note.innerHTML =
    'Source: <code>&lt;script id="mosaic-record"&gt;</code> + ' +
    '<code>&lt;script id="mosaic-raw-record"&gt;</code> + ' +
    '<code>document.head</code>. Powered by <code>@ssolu/mosaic-devtool</code>.';

  panel.append(head, body, note);
  modal.append(backdrop, panel);
  root.append(fab, modal);

  // Tab state.
  let active: TabId =
    (readPersistedTab() as TabId | null) ?? 'resolved';

  function renderTabs(): void {
    tabBar.innerHTML = '';
    for (const t of tabs) {
      const b = doc.createElement('button');
      b.className = 'tab';
      b.type = 'button';
      b.textContent = t.label;
      b.dataset.tab = t.id;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', t.id === active ? 'true' : 'false');
      b.addEventListener('click', () => {
        active = t.id;
        try {
          globalThis.localStorage?.setItem(LS_KEY, active);
        } catch {
          /* localStorage may throw in private mode; ignore. */
        }
        renderTabs();
        renderBody();
      });
      tabBar.appendChild(b);
    }
  }

  function renderBody(): void {
    const t = tabs.find((x) => x.id === active) ?? tabs[0]!;
    const out = t.body();
    body.innerHTML = '';
    if (out.kind === 'empty') {
      const div = doc.createElement('div');
      div.className = 'empty';
      div.textContent = out.text;
      body.appendChild(div);
      return;
    }
    const pre = doc.createElement('pre');
    pre.textContent = out.text;
    body.appendChild(pre);
  }

  function open(): void {
    modal.hidden = false;
    doc.body.style.overflow = 'hidden';
    renderTabs();
    renderBody();
  }
  function close(): void {
    modal.hidden = true;
    doc.body.style.overflow = '';
  }

  fab.addEventListener('click', open);
  modal.addEventListener('click', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && 'close' in (t.dataset ?? {})) close();
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  renderTabs();
  renderBody();
}

function readPersistedTab(): string | null {
  try {
    return globalThis.localStorage?.getItem(LS_KEY) ?? null;
  } catch {
    return null;
  }
}

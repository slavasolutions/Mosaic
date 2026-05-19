import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '../src/mount.js';

function setBody(html: string): void {
  document.body.innerHTML = html;
  // Reset head between tests so previous JSON-LD scripts don't bleed.
  document.head.innerHTML = '<title>Test page</title>';
}

describe('mount', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '<title>Test page</title>';
  });

  it('attaches a single host element under the body', () => {
    setBody('<script type="application/json" id="mosaic-record">{"id":"x"}</script>');
    mount();
    const hosts = document.querySelectorAll('#mosaic-devtool-host');
    expect(hosts).toHaveLength(1);
  });

  it('is idempotent — mounting twice still yields one host', () => {
    setBody('<script type="application/json" id="mosaic-record">{"id":"x"}</script>');
    mount();
    mount();
    expect(document.querySelectorAll('#mosaic-devtool-host')).toHaveLength(1);
  });

  it('attaches a shadow root containing a fab button', () => {
    setBody('<script type="application/json" id="mosaic-record">{"id":"x"}</script>');
    mount();
    const host = document.getElementById('mosaic-devtool-host')!;
    expect(host.shadowRoot).toBeTruthy();
    const fab = host.shadowRoot!.querySelector('.fab');
    expect(fab).toBeTruthy();
  });

  it('opens the panel when the fab is clicked', () => {
    setBody('<script type="application/json" id="mosaic-record">{"id":"x"}</script>');
    mount();
    const host = document.getElementById('mosaic-devtool-host')!;
    const root = host.shadowRoot!;
    const modal = root.querySelector('.modal') as HTMLDivElement;
    expect(modal.hidden).toBe(true);
    (root.querySelector('.fab') as HTMLButtonElement).click();
    expect(modal.hidden).toBe(false);
  });

  it('shows an empty state for the Resolved tab when no record script is present', () => {
    setBody('');
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    expect(root.querySelector('.empty')!.textContent).toMatch(/No <script id="mosaic-record">/);
  });

  it('renders the JSON-LD subset when @type is present', () => {
    setBody(
      '<script type="application/json" id="mosaic-record">' +
        '{"@type":"Person","name":"Ada","slug":"ada"}' +
        '</script>',
    );
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    const jsonldTab = root.querySelector('button.tab[data-tab="jsonld"]') as HTMLButtonElement;
    jsonldTab.click();
    const text = root.querySelector('.body pre')!.textContent ?? '';
    expect(text).toContain('"@type": "Person"');
    expect(text).toContain('"name": "Ada"');
    expect(text).not.toContain('slug');
  });

  it('hides JSON-LD payload (empty state) when @type is absent', () => {
    setBody(
      '<script type="application/json" id="mosaic-record">{"name":"Plain"}</script>',
    );
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    (root.querySelector('button.tab[data-tab="jsonld"]') as HTMLButtonElement).click();
    expect(root.querySelector('.empty')!.textContent).toMatch(/no `@type`/);
  });

  it('surfaces the raw record tab when mosaic-raw-record is present', () => {
    setBody(
      '<script type="application/json" id="mosaic-record">{"title":"Cooked"}</script>' +
        '<script type="application/json" id="mosaic-raw-record">{"title":"Raw"}</script>',
    );
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    (root.querySelector('button.tab[data-tab="raw"]') as HTMLButtonElement).click();
    expect(root.querySelector('.body pre')!.textContent).toContain('"Raw"');
  });

  it('hides the Tree tab when the mosaic-tree script is absent', () => {
    setBody('<script type="application/json" id="mosaic-record">{"id":"x"}</script>');
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    expect(root.querySelector('button.tab[data-tab="tree"]')).toBeNull();
  });

  it('shows the Tree tab and renders the folder structure when mosaic-tree is present', () => {
    setBody(
      '<script type="application/json" id="mosaic-record">{"id":"x"}</script>' +
        '<script type="application/json" id="mosaic-tree">' +
        JSON.stringify({
          entries: [{ path: 'pages/about.json' }, { path: 'index.json' }],
          activePath: 'pages/about.json',
        }) +
        '</script>',
    );
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    const treeTab = root.querySelector(
      'button.tab[data-tab="tree"]',
    ) as HTMLButtonElement;
    expect(treeTab).not.toBeNull();
    treeTab.click();
    const labels = Array.from(root.querySelectorAll('.tree-label')).map(
      (n) => n.textContent,
    );
    expect(labels).toContain('pages');
    expect(labels).toContain('about.json');
    expect(labels).toContain('index.json');
    expect(root.querySelector('.tree-node.is-active .tree-label')!.textContent).toBe(
      'about.json',
    );
  });

  it('always shows the Adapter tab with default routes', () => {
    setBody('<script type="application/json" id="mosaic-record">{"id":"x"}</script>');
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    const sitesTab = root.querySelector(
      'button.tab[data-tab="sites"]',
    ) as HTMLButtonElement;
    expect(sitesTab).not.toBeNull();
    expect(sitesTab.textContent).toBe('Adapter');
    sitesTab.click();
    expect(root.querySelectorAll('.site-item').length).toBe(6);
  });

  it('allows the host to override the sites list via mosaic-sites', () => {
    setBody(
      '<script type="application/json" id="mosaic-record">{"id":"x"}</script>' +
        '<script type="application/json" id="mosaic-sites">' +
        JSON.stringify([{ label: 'Only', url: '/only/' }]) +
        '</script>',
    );
    mount();
    const root = document.getElementById('mosaic-devtool-host')!.shadowRoot!;
    (root.querySelector('.fab') as HTMLButtonElement).click();
    (root.querySelector('button.tab[data-tab="sites"]') as HTMLButtonElement).click();
    const items = root.querySelectorAll('.site-item');
    expect(items.length).toBe(1);
    expect(items[0]!.querySelector('.site-label')!.textContent).toBe('Only');
  });
});

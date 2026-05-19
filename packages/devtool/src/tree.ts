/**
 * File-tree tab — renders the Mosaic folder structure from a JSON payload
 * injected as `<script type="application/json" id="mosaic-tree">`.
 *
 * Shape of the payload (kept intentionally permissive so adapters can ship
 * either a flat or nested form). Two accepted shapes:
 *
 *   1. `{ root: string, entries: Array<{ path: string; kind?: 'file'|'dir' }> }`
 *      — flat list of paths relative to `root`. Directories are inferred
 *      from path segments when `kind` is omitted.
 *
 *   2. `{ root: string, children: TreeNode[] }` with
 *      `TreeNode = { name: string; kind: 'file'|'dir'; children?: TreeNode[] }`
 *      — already-shaped tree.
 *
 * The active page may be highlighted by passing `activePath`. If the page
 * doesn't inject the script, the tab is skipped at mount time.
 */

export interface FlatTreeData {
  root?: string;
  entries: Array<{ path: string; kind?: 'file' | 'dir' }>;
  activePath?: string;
}

export interface NestedTreeData {
  root?: string;
  children: TreeNode[];
  activePath?: string;
}

export interface TreeNode {
  name: string;
  kind: 'file' | 'dir';
  children?: TreeNode[];
}

export type TreeData = FlatTreeData | NestedTreeData;

interface InternalNode {
  name: string;
  kind: 'file' | 'dir';
  children: InternalNode[];
}

// Compact icons. All share stroke="currentColor" stroke-width="1.2"
// fill="none" via a wrapper `<g>` so each path stays a single attribute.
const ICON_PATHS: Record<string, string> = {
  json: 'M5 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1M11 2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1',
  md: 'M2 4v8M2 4l3 4 3-4v8M11 4v8m0 0l-1.5-2m1.5 2l1.5-2',
  html: 'M5 5L2 8l3 3M11 5l3 3-3 3M9 4l-2 8',
  txt: 'M3 4h10M3 8h10M3 12h6',
  img: 'M2 3h12v10H2zM6 7v0M2 11l4-3 3 2 5-4',
  file: 'M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM9 2v3h3',
  dir: 'M2 5a1 1 0 0 1 1-1h3l1.5 1.5H13a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z',
};

function iconKey(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 'file';
  const ext = name.slice(dot + 1).toLowerCase();
  if (ext === 'json') return 'json';
  if (ext === 'md' || ext === 'adoc') return 'md';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'txt') return 'txt';
  if (/^(png|jpe?g|gif|webp|avif|svg)$/.test(ext)) return 'img';
  return 'file';
}

/**
 * Read the `<script id="mosaic-tree">` JSON payload from the document.
 * Returns null when missing, empty, or unparsable.
 */
export function readTreeData(doc: Document): TreeData | null {
  const el = doc.getElementById('mosaic-tree');
  if (!el) return null;
  const raw = el.textContent ?? '';
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Array.isArray((parsed as FlatTreeData).entries)) return parsed as FlatTreeData;
    if (Array.isArray((parsed as NestedTreeData).children)) return parsed as NestedTreeData;
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalise either accepted shape into a single nested form for rendering.
 * Directory children come before file children at each level; within a
 * group, names sort case-insensitively.
 */
export function buildTree(data: TreeData): InternalNode[] {
  if ('children' in data && Array.isArray(data.children)) {
    return sortTree(data.children.map(cloneNode));
  }
  const flat = data as FlatTreeData;
  const root: InternalNode = { name: '', kind: 'dir', children: [] };
  for (const entry of flat.entries ?? []) {
    if (!entry || typeof entry.path !== 'string' || !entry.path) continue;
    const segments = entry.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    let cursor = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      const isLast = i === segments.length - 1;
      const kind: 'file' | 'dir' = isLast
        ? entry.kind === 'dir'
          ? 'dir'
          : 'file'
        : 'dir';
      let next = cursor.children.find((c) => c.name === seg);
      if (!next) {
        next = { name: seg, kind, children: [] };
        cursor.children.push(next);
      } else if (!isLast && next.kind === 'file') {
        next.kind = 'dir';
      }
      cursor = next;
    }
  }
  return sortTree(root.children);
}

function cloneNode(n: TreeNode): InternalNode {
  return {
    name: n.name,
    kind: n.kind,
    children: Array.isArray(n.children) ? n.children.map(cloneNode) : [],
  };
}

function sortTree(nodes: InternalNode[]): InternalNode[] {
  const out = nodes.slice().sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  for (const n of out) {
    if (n.children.length > 0) n.children = sortTree(n.children);
  }
  return out;
}

/**
 * Render the tree into a container element. Caller owns the container —
 * we clear and repopulate it. Pure DOM work; no styling beyond classes the
 * shadow-root stylesheet provides.
 */
export function renderTree(
  container: HTMLElement,
  data: TreeData,
  doc: Document,
): void {
  container.innerHTML = '';
  const nodes = buildTree(data);
  const activePath = normaliseActive(data.activePath);
  const ul = doc.createElement('ul');
  ul.className = 'tree';
  walk(nodes, ul, doc, [], activePath);
  container.appendChild(ul);
}

function normaliseActive(p: string | undefined): string[] | null {
  if (!p) return null;
  return p.split('/').filter(Boolean);
}

function walk(
  nodes: InternalNode[],
  ul: HTMLElement,
  doc: Document,
  trail: string[],
  active: string[] | null,
): void {
  for (const n of nodes) {
    const li = doc.createElement('li');
    li.className = 'tree-node';
    const row = doc.createElement('div');
    row.className = 'tree-row';

    const icon = doc.createElement('span');
    icon.className = 'tree-icon';
    const key = n.kind === 'dir' ? 'dir' : iconKey(n.name);
    icon.innerHTML = svgIcon(ICON_PATHS[key]!);

    const label = doc.createElement('span');
    label.className = 'tree-label';
    label.textContent = n.name;

    row.append(icon, label);
    li.appendChild(row);

    const nextTrail = trail.concat(n.name);
    if (active && pathMatches(nextTrail, active)) {
      li.classList.add('is-active');
    } else if (active && isAncestor(nextTrail, active)) {
      li.classList.add('is-active-ancestor');
    }

    if (n.children.length > 0) {
      const childUl = doc.createElement('ul');
      childUl.className = 'tree';
      walk(n.children, childUl, doc, nextTrail, active);
      li.appendChild(childUl);
    }
    ul.appendChild(li);
  }
}

function pathMatches(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function isAncestor(candidate: string[], full: string[]): boolean {
  if (candidate.length >= full.length) return false;
  for (let i = 0; i < candidate.length; i++) {
    if (candidate[i] !== full[i]) return false;
  }
  return true;
}

function svgIcon(d: string): string {
  return '<svg viewBox="0 0 16 16"><path d="' + d + '"/></svg>';
}

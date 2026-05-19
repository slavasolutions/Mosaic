/**
 * Site-switcher tab — pill row of known Mosaic-rendered variants. v1 ships
 * a hardcoded list so the devtool stays self-contained (no fetch, no
 * runtime registry). Adapters that want to override the list can inject
 * `<script type="application/json" id="mosaic-sites">` with the same
 * `{ label, url }[]` shape.
 *
 * The current page is detected by matching `location.pathname` against
 * each entry's `url`. Longest matching prefix wins so deep routes don't
 * snap back to the index entry.
 */

export interface SiteEntry {
  label: string;
  url: string;
  /** Optional short note rendered under the label. */
  note?: string;
}

/**
 * v1 default: five deployed variants spanning both adapter examples.
 * Paths are GH-Pages-prefixed so the devtool works on the live site. On
 * non-GH-Pages hosts (e.g. local dev) the matcher falls back to the path
 * suffix, see `findActive`.
 */
export const DEFAULT_SITES: SiteEntry[] = [
  { label: 'Astro · home', url: '/mosaic/astro/' },
  { label: 'Astro · about', url: '/mosaic/astro/about/' },
  { label: 'Astro · blog', url: '/mosaic/astro/blog/' },
  { label: 'Astro · blog post', url: '/mosaic/astro/blog/hello/' },
  { label: 'Next · home', url: '/mosaic/next/' },
];

export function readSitesData(doc: Document): SiteEntry[] | null {
  const el = doc.getElementById('mosaic-sites');
  if (!el) return null;
  const raw = el.textContent ?? '';
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const out: SiteEntry[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.label === 'string' &&
        typeof item.url === 'string'
      ) {
        out.push({
          label: item.label,
          url: item.url,
          note: typeof item.note === 'string' ? item.note : undefined,
        });
      }
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/**
 * Return the index of the entry that best matches `pathname`, or -1.
 * Tie-breaker: longest matching URL wins, so `/mosaic/astro/blog/hello/`
 * snaps to the blog-post entry instead of the blog-index entry.
 *
 * Also accepts a suffix match so local dev paths like `/example/` still
 * line up with the GH-Pages-prefixed `/mosaic/astro/`.
 */
export function findActive(entries: SiteEntry[], pathname: string): number {
  let best = -1;
  let bestLen = -1;
  for (let i = 0; i < entries.length; i++) {
    const u = entries[i]!.url;
    if (pathname === u && u.length > bestLen) {
      best = i;
      bestLen = u.length;
      continue;
    }
    if (pathname.startsWith(u) && u.length > bestLen) {
      best = i;
      bestLen = u.length;
      continue;
    }
    // Suffix match for non-prefixed hosts: the entry URL is GH-Pages-
    // prefixed (`/mosaic/astro/blog/`) but the visitor is on local dev
    // (`/example/blog/`). Strip a leading `/<seg>` off `u` once and retry.
    const stripped = u.replace(/^\/[^/]+/, '');
    if (
      stripped.length > 1 &&
      stripped !== u &&
      (pathname === stripped || pathname.startsWith(stripped)) &&
      stripped.length > bestLen
    ) {
      best = i;
      bestLen = stripped.length;
    }
  }
  return best;
}

/**
 * Render the site-switcher into a container. Caller owns the container —
 * we clear it and repopulate. Anchors use plain navigation; no JS routing.
 */
export function renderSites(
  container: HTMLElement,
  entries: SiteEntry[],
  doc: Document,
  pathname: string,
): void {
  container.innerHTML = '';
  const activeIdx = findActive(entries, pathname);
  const list = doc.createElement('ul');
  list.className = 'sites';
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const li = doc.createElement('li');
    li.className = 'site-item';
    if (i === activeIdx) li.classList.add('is-active');
    const a = doc.createElement('a');
    a.className = 'site-link';
    a.href = e.url;
    const label = doc.createElement('span');
    label.className = 'site-label';
    label.textContent = e.label;
    a.appendChild(label);
    if (e.note) {
      const note = doc.createElement('span');
      note.className = 'site-note';
      note.textContent = e.note;
      a.appendChild(note);
    }
    if (i === activeIdx) a.setAttribute('aria-current', 'page');
    li.appendChild(a);
    list.appendChild(li);
  }
  container.appendChild(list);
}

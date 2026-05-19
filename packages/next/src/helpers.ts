/**
 * Next-shaped convenience helpers built on `readMosaic`.
 *
 * Designed to be called from Next App Router server-side functions:
 *   - `getMosaicUrls`  → `generateStaticParams`
 *   - `getMosaicEntry` → page-level data fetch by URL
 *   - `getMosaicEntries` → index pages (blog list, etc.) by URL prefix
 *
 * Pages Router shims are trivial (same return shapes); see the README.
 */

import { readMosaic } from './read.js';
import { urlToSlugArray } from './url.js';
import type {
  MosaicEntry,
  MosaicResolution,
  ReadMosaicOptions,
} from './types.js';

/**
 * Return the `[{ slug: string[] }]` array Next App Router's
 * `generateStaticParams` expects for a catch-all `[[...slug]]` route.
 *
 * Only routed records (those under the web profile root) are emitted.
 * The home page URL `/` maps to `{ slug: [] }`, which Next's optional
 * catch-all renders at `/`.
 */
export async function getMosaicUrls(
  rootPath: string,
): Promise<Array<{ slug: string[] }>> {
  const { routedEntries } = await readMosaic(rootPath);
  return routedEntries.map((e) => ({
    slug: urlToSlugArray(e.url as string),
  }));
}

/**
 * Look up a single entry by URL. Returns `null` if no routed entry has
 * that URL. URLs MUST start with `/` (e.g. `/about`).
 *
 * Use this in an App Router page like:
 *
 * ```ts
 * export default async function Page({ params }: { params: { slug?: string[] } }) {
 *   const url = '/' + (params.slug ?? []).join('/');
 *   const entry = await getMosaicEntry('./content', url);
 *   if (!entry) return notFound();
 *   return <Article entry={entry} />;
 * }
 * ```
 */
export async function getMosaicEntry(
  rootPath: string,
  url: string,
): Promise<MosaicEntry | null> {
  if (typeof url !== 'string' || url.length === 0 || url[0] !== '/') {
    throw new TypeError(
      'getMosaicEntry: `url` must be a path starting with "/", e.g. "/about" or "/".',
    );
  }
  const { routedEntries } = await readMosaic(rootPath);
  const target = routedEntries.find((e) => e.url === url);
  return target ?? null;
}

/**
 * Options for {@link getMosaicEntries}.
 */
export interface GetMosaicEntriesOptions extends ReadMosaicOptions {
  /**
   * If set, only entries whose URL starts with this prefix are returned.
   * The prefix MUST start with `/` (e.g. `/blog`). Entries at the exact
   * prefix URL are excluded — pass `includeIndex: true` to include them.
   */
  urlPrefix?: string;
  /**
   * When `urlPrefix` is set, also include the entry whose URL EQUALS the
   * prefix (e.g. `/blog`). Defaults to `false` — typical "list child
   * posts" use case wants to skip the index itself.
   */
  includeIndex?: boolean;
  /**
   * If true, only routed records (with a URL). Defaults to `true` —
   * index pages almost always want routed records only.
   */
  routedOnly?: boolean;
}

/**
 * Return a filtered set of entries. Typical use: a blog index page that
 * needs to list all posts under `/blog/`.
 *
 * ```ts
 * const posts = await getMosaicEntries('./content', { urlPrefix: '/blog' });
 * ```
 */
export async function getMosaicEntries(
  rootPath: string,
  opts: GetMosaicEntriesOptions = {},
): Promise<MosaicEntry[]> {
  const routedOnly = opts.routedOnly ?? true;
  const includeIndex = opts.includeIndex ?? false;
  const res: MosaicResolution = await readMosaic(rootPath, {
    includeNonRouteRecords: !routedOnly,
  });

  let list: MosaicEntry[] = routedOnly ? res.routedEntries : res.entries;

  if (opts.urlPrefix) {
    if (opts.urlPrefix[0] !== '/') {
      throw new TypeError(
        'getMosaicEntries: `urlPrefix` must start with "/".',
      );
    }
    const prefix = opts.urlPrefix;
    list = list.filter((e) => {
      if (typeof e.url !== 'string') return false;
      if (e.url === prefix) return includeIndex;
      return e.url.startsWith(prefix === '/' ? '/' : prefix + '/');
    });
  }

  return list;
}

/**
 * Catch-all route — handles `/`, `/about`, `/blog`, `/blog/<post>`.
 *
 * The branching mirrors the Astro twin's `[...slug].astro`:
 *   - `/`               → home (title, tagline, intro, card links)
 *   - `/blog`           → blog index (renders sibling posts)
 *   - `/blog/<post>`    → blog post (markdown body + ref-resolved author)
 *   - everything else   → generic page (title + lede + md body)
 *
 * `generateStaticParams` is driven by the resolved Mosaic record set so
 * every routed record gets its own static HTML file under `out/`.
 */

import { notFound } from 'next/navigation';
import { renderBody } from '@ssolu/mosaic-next';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getMosaic, CONTENT_ROOT } from '../../lib/mosaic';
import type { MosaicEntry } from '../../lib/mosaic';
import { renderAvatar } from '../../lib/avatar';
import { buildTree, type TreePayload } from '../../lib/tree';

// Walk the content folder once at module load; reused across routes.
const TREE_BASE: TreePayload = buildTree(CONTENT_ROOT, 'content');
const TREE_PATHS = new Set(TREE_BASE.entries.map((e) => e.path));

// Best-effort canonical-file lookup for the devtool's Tree tab. Identity
// maps to `pages/<id>.json` or `pages/<id>/index.json` for the routed
// records this example uses; the team/* and tokens/* identities have
// matching paths under their respective folders. Falls back to leaving
// activePath unset if no obvious candidate exists.
function findActivePath(entry: MosaicEntry): string | undefined {
  const candidates: string[] = [];
  const id = entry.id;
  // Slash-form: identity as a path under the content root.
  candidates.push(`${id}.json`);
  candidates.push(`${id}/index.json`);
  // Web profile root inference: routed entries live under pages/.
  if (entry.url !== undefined) {
    candidates.push(`pages/${id.replace(/^pages\//, '')}.json`);
    candidates.push(`pages/${id.replace(/^pages\//, '')}/index.json`);
  }
  for (const c of candidates) {
    if (TREE_PATHS.has(c)) return c;
    if (existsSync(join(CONTENT_ROOT, c))) return c;
  }
  return undefined;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const href = (p: string): string => BASE + p;

// Devtool URL — sibling to /astro/ and /next/ at the Pages root.
// In deploy mode that's `/mosaic/_mosaic-devtool/mosaic-devtool.js`; in dev
// (no basePath) it's `/_mosaic-devtool/mosaic-devtool.js`.
const devtoolSrc = BASE
  ? `${BASE.replace(/\/[^/]+$/, '')}/_mosaic-devtool/mosaic-devtool.js`
  : '/_mosaic-devtool/mosaic-devtool.js';

const NAV: Array<{ label: string; url: string }> = [
  { label: 'Home', url: '/' },
  { label: 'About', url: '/about' },
  { label: 'Blog', url: '/blog' },
  { label: 'Legal', url: '/legal' },
];

function isActive(linkUrl: string, currentPath: string): boolean {
  if (linkUrl === '/') return currentPath === '/';
  return currentPath === linkUrl || currentPath.startsWith(linkUrl + '/');
}

// === Variant pill (framework selector) =======================================
// Mirrors the Astro twin. Renders Astro / Astro · dark / Astro · minimal /
// Next links in the top bar; the current slot is `next`. Pill collapses
// the "dim" entries on narrow viewports via CSS.
const VARIANTS: Array<{ slot: string; label: string }> = [
  { slot: 'astro',         label: 'Astro' },
  { slot: 'astro-dark',    label: 'Astro · dark' },
  { slot: 'astro-minimal', label: 'Astro · minimal' },
  { slot: 'next',          label: 'Next' },
];
const CURRENT_VARIANT = 'next';
const isDeploy = !!BASE;
function variantHref(slot: string, currentPath: string): string {
  const root = isDeploy ? `/mosaic/${slot}` : '';
  if (currentPath === '/') return root + '/';
  return root + currentPath;
}

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  const { routedEntries } = await getMosaic();
  return routedEntries.map((e) => ({
    // For Next's optional catch-all `[[...slug]]`, the home route is
    // `{ slug: [] }`. Anything else is the path split on `/`.
    slug: (e.url ?? '/').split('/').filter(Boolean),
  }));
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const segments = slug ?? [];
  const currentPath = segments.length === 0 ? '/' : '/' + segments.join('/');
  const { routedEntries } = await getMosaic();
  const entry = routedEntries.find((e) => e.url === currentPath);
  const title = (entry?.data as { title?: string })?.title ?? entry?.id ?? 'Acme Foundry';
  return { title: `${title} — Acme Foundry` };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const segments = slug ?? [];
  const currentPath = segments.length === 0 ? '/' : '/' + segments.join('/');

  const { routedEntries } = await getMosaic();
  const entry = routedEntries.find((e) => e.url === currentPath);
  if (!entry) notFound();

  // Serialised resolved record for the floating JSON viewer.
  const resolvedJson = JSON.stringify(
    {
      id: entry.id,
      url: entry.url,
      data: entry.data,
      hasBody: typeof entry.body === 'string' && entry.body.length > 0,
    },
    null,
    2,
  );

  // JSON-LD per mosaic-web profile §6. Strip Mosaic-internal fields from the
  // schema.org payload (slug/url/modifiers/theme — consumer-side, not
  // schema.org properties).
  const schemaType = (entry.data as Record<string, unknown>)['@type'] as
    | string
    | undefined;
  let jsonLd: string | null = null;
  if (schemaType) {
    const {
      slug: _slug,
      url: _url,
      modifiers: _mods,
      theme: _theme,
      ...semantic
    } = entry.data as Record<string, unknown>;
    jsonLd = JSON.stringify(
      {
        '@context':
          ((entry.data as Record<string, unknown>)['@context'] as string | undefined) ??
          'https://schema.org',
        ...semantic,
      },
      null,
      2,
    );
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <header className="site">
        <div className="nav-inner">
          <a className="brand" href={href('/')}>
            <img src={href('/logo.svg')} alt="" />
            Acme Foundry
          </a>
          <nav className="site-nav">
            {NAV.map((item) => (
              <a
                key={item.url}
                href={href(item.url)}
                className={isActive(item.url, currentPath) ? 'active' : ''}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div
            className="variant-pill"
            role="group"
            aria-label="Switch framework variant"
          >
            {VARIANTS.map((v) => {
              const isCurrent = v.slot === CURRENT_VARIANT;
              const dim = !isCurrent && v.slot !== 'astro' && v.slot !== 'next';
              return (
                <a
                  key={v.slot}
                  href={variantHref(v.slot, currentPath)}
                  className={dim ? 'dim' : ''}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {v.label}
                </a>
              );
            })}
          </div>
        </div>
      </header>
      <main>
        <PageBody entry={entry} currentPath={currentPath} routedEntries={routedEntries} />
      </main>

      {/* Devtool data + gate. The JSON payload is always emitted (a few KB,
          cached with the page). The devtool UI script loads on every render;
          append `?nodebug=1` to any URL to suppress. */}
      <script
        type="application/json"
        id="mosaic-record"
        dangerouslySetInnerHTML={{ __html: resolvedJson }}
      />
      <script
        type="application/json"
        id="mosaic-tree"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ ...TREE_BASE, activePath: findActivePath(entry) }),
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){if(location.search.indexOf('nodebug=1')!==-1)return;var s=document.createElement('script');s.src=${JSON.stringify(devtoolSrc)};s.defer=true;document.head.appendChild(s);})();`,
        }}
      />
    </>
  );
}

// ----- Page-body branches ------------------------------------------------

interface BodyProps {
  entry: MosaicEntry;
  currentPath: string;
  routedEntries: MosaicEntry[];
}

function PageBody({ entry, currentPath, routedEntries }: BodyProps) {
  const data = entry.data as Record<string, unknown>;
  const isBlogIndex = currentPath === '/blog';
  const isPost = currentPath.startsWith('/blog/') && !isBlogIndex;

  if (currentPath === '/') return <HomeBody data={data} />;
  if (isPost) return <PostBody entry={entry} />;
  if (isBlogIndex)
    return <BlogIndexBody data={data} entry={entry} routedEntries={routedEntries} />;
  return <GenericPageBody entry={entry} />;
}

function HomeBody({ data }: { data: Record<string, unknown> }) {
  const title = String(data.title ?? '');
  const tagline = typeof data.tagline === 'string' ? data.tagline : null;
  const intro = typeof data.intro === 'string' ? data.intro : null;
  const homeLinks = Array.isArray(data.homeLinks)
    ? (data.homeLinks as Array<{ label?: string; url?: string }>)
    : null;

  return (
    <section>
      <h1 className="home-h1">{title}</h1>
      {tagline && <p className="home-tagline">{tagline}</p>}
      {intro && <p>{intro}</p>}
      {homeLinks && (
        <ul className="home-cards">
          {homeLinks.map((link, i) => (
            <li key={i}>
              <a className="home-card-link" href={href(link.url ?? '/')}>
                {link.label ?? ''} →
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GenericPageBody({ entry }: { entry: MosaicEntry }) {
  const data = entry.data as Record<string, unknown>;
  const title = String(data.title ?? entry.id);
  const lede = typeof data.lede === 'string' ? data.lede : null;
  const bodyHtml = renderBody(entry.body, entry.bodyExt);

  return (
    <section>
      <h1 className="page-h1">{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
      {bodyHtml && (
        <div className="body-block" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}
    </section>
  );
}

interface PostListItem {
  url: string;
  title: string;
  publishedAt?: string;
  authorName?: string;
}

function BlogIndexBody({
  data,
  entry,
  routedEntries,
}: {
  data: Record<string, unknown>;
  entry: MosaicEntry;
  routedEntries: MosaicEntry[];
}) {
  const title = String(data.title ?? entry.id);
  const lede = typeof data.lede === 'string' ? data.lede : null;
  const bodyHtml = renderBody(entry.body, entry.bodyExt);

  const posts: PostListItem[] = routedEntries
    .filter((e) => typeof e.url === 'string' && e.url.startsWith('/blog/') && e.url !== '/blog')
    .map((e) => {
      const d = e.data as Record<string, unknown>;
      const authorObj =
        d.author && typeof d.author === 'object' ? (d.author as Record<string, unknown>) : null;
      return {
        url: e.url as string,
        title: typeof d.title === 'string' ? d.title : e.slug,
        publishedAt: typeof d.publishedAt === 'string' ? d.publishedAt : undefined,
        authorName: typeof authorObj?.name === 'string' ? (authorObj.name as string) : undefined,
      };
    })
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

  return (
    <section>
      <h1 className="page-h1">{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
      {bodyHtml && (
        <div className="body-block" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}
      <ul className="blog-list">
        {posts.map((post) => (
          <li key={post.url}>
            <a href={href(post.url)}>{post.title}</a>
            <div className="meta">
              {post.publishedAt}
              {post.authorName ? ` · ${post.authorName}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostBody({ entry }: { entry: MosaicEntry }) {
  const data = entry.data as Record<string, unknown>;
  const title = String(data.title ?? entry.id);
  const publishedAt = typeof data.publishedAt === 'string' ? data.publishedAt : null;
  const authorObj =
    data.author && typeof data.author === 'object'
      ? (data.author as Record<string, unknown>)
      : null;
  const authorName = typeof authorObj?.name === 'string' ? (authorObj.name as string) : null;
  const authorRole = typeof authorObj?.role === 'string' ? (authorObj.role as string) : null;
  const authorBio = typeof authorObj?.bio === 'string' ? (authorObj.bio as string) : null;
  // `display` cascades from `mosaic.json#defaults.author.display`.
  // `text-only` suppresses avatar SVGs even on post pages. Default is
  // `with-avatar` (avatar shown).
  const authorDisplay =
    typeof authorObj?.display === 'string' ? (authorObj.display as string) : undefined;
  const showAvatar = authorDisplay !== 'text-only';

  const bodyHtml = renderBody(entry.body, entry.bodyExt);

  return (
    <article>
      <h1 className="page-h1">{title}</h1>
      <div className="post-meta">
        {showAvatar && authorName && (
          <span
            className="avatar"
            dangerouslySetInnerHTML={{ __html: renderAvatar(authorName, 32) }}
          />
        )}
        <span>
          {publishedAt}
          {authorName ? ` · by ${authorName}` : ''}
          {authorRole ? ` (${authorRole})` : ''}
        </span>
      </div>
      {bodyHtml && (
        <div className="body-block" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}
      {authorBio && authorName && (
        <div className="post-author-card">
          {showAvatar && (
            <span
              className="avatar"
              dangerouslySetInnerHTML={{ __html: renderAvatar(authorName, 48) }}
            />
          )}
          <div className="body">
            <strong>About {authorName}</strong> — {authorBio}
          </div>
        </div>
      )}
    </article>
  );
}

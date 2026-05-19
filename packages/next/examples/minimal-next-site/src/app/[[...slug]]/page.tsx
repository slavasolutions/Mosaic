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
import { getMosaic } from '../../lib/mosaic';
import type { MosaicEntry } from '../../lib/mosaic';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const href = (p: string): string => BASE + p;

const NAV: Array<{ label: string; url: string }> = [
  { label: 'Home', url: '/' },
  { label: 'About', url: '/about' },
  { label: 'Blog', url: '/blog' },
];

function isActive(linkUrl: string, currentPath: string): boolean {
  if (linkUrl === '/') return currentPath === '/';
  return currentPath === linkUrl || currentPath.startsWith(linkUrl + '/');
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
        </div>
      </header>
      <main>
        <PageBody entry={entry} currentPath={currentPath} routedEntries={routedEntries} />
      </main>

      <button
        id="raw-fab"
        className="raw-fab"
        type="button"
        aria-label="View the Mosaic-resolved JSON for this page"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M5 2 H3 a1 1 0 0 0 -1 1 V13 a1 1 0 0 0 1 1 H5 M11 2 H13 a1 1 0 0 1 1 1 V13 a1 1 0 0 1 -1 1 H11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        JSON
      </button>

      <div id="raw-modal" className="raw-modal" hidden>
        <div className="raw-backdrop" data-close />
        <div className="raw-panel" role="dialog" aria-modal="true" aria-labelledby="raw-title">
          <div className="raw-header">
            <h2 id="raw-title">Resolved record</h2>
            <button className="raw-close" type="button" data-close aria-label="Close">
              ×
            </button>
          </div>
          <div className="raw-body">
            <pre>{resolvedJson}</pre>
          </div>
          <div className="raw-explain">
            What you see above is exactly what the Mosaic→Next pipeline gave this page.
            Sidecars merged, <code>ref:</code> values resolved, cascade applied — per spec
            §§5–12.
          </div>
        </div>
      </div>

      {/* Plain script — kept inline so it survives static export without
          a client component boundary. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var fab=document.getElementById('raw-fab');var modal=document.getElementById('raw-modal');if(!fab||!modal)return;function open(){modal.hidden=false;document.body.style.overflow='hidden';}function close(){modal.hidden=true;document.body.style.overflow='';}fab.addEventListener('click',open);modal.addEventListener('click',function(e){if(e.target&&e.target.dataset&&e.target.dataset.close!==undefined)close();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)close();});})();`,
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
  const paragraphs = entry.body ? entry.body.split('\n\n').filter((p) => p.trim()) : [];

  return (
    <section>
      <h1 className="page-h1">{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
      {paragraphs.length > 0 && (
        <div className="body-block">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
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
  const paragraphs = entry.body ? entry.body.split('\n\n').filter((p) => p.trim()) : [];

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
      {paragraphs.length > 0 && (
        <div className="body-block">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
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

  const paragraphs = entry.body ? entry.body.split('\n\n').filter((p) => p.trim()) : [];

  return (
    <article>
      <h1 className="page-h1">{title}</h1>
      <div className="post-meta">
        {publishedAt}
        {authorName ? ` · by ${authorName}` : ''}
        {authorRole ? ` (${authorRole})` : ''}
      </div>
      {paragraphs.length > 0 && (
        <div className="body-block">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {authorBio && authorName && (
        <div className="post-author-card">
          <strong>About {authorName}</strong> — {authorBio}
        </div>
      )}
    </article>
  );
}

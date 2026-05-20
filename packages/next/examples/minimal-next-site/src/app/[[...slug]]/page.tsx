/**
 * Catch-all route — handles every routed Mosaic record.
 *
 * Branches:
 *   `/`                  → home (title, tagline, hero, intro, featured)
 *   `/blog`              → blog index (renders sibling posts)
 *   `/blog/<slug>`       → blog post (markdown body + ref-resolved author)
 *   anything with subPages → collection page (sub-pages grid)
 *   anything with members  → team-style member grid (refs resolved)
 *   ContactPage          → contact card
 *   everything else      → generic page (title + lede + md body)
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
// The label matches whichever shape is active so the devtool's Tree tab
// uses the right root name.
const CONTENT_DIR_LABEL = (process.env.MOSAIC_CONTENT_DIR ?? 'content-blog');
const TREE_BASE: TreePayload = buildTree(CONTENT_ROOT, CONTENT_DIR_LABEL);
const TREE_PATHS = new Set(TREE_BASE.entries.map((e) => e.path));

function findActivePath(entry: MosaicEntry): string | undefined {
  const candidates: string[] = [];
  const id = entry.id;
  candidates.push(`${id}.json`);
  candidates.push(`${id}/index.json`);
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

const devtoolSrc = BASE
  ? `${BASE.replace(/\/[^/]+$/, '')}/_mosaic-devtool/mosaic-devtool.js`
  : '/_mosaic-devtool/mosaic-devtool.js';

const SITE_LIST = JSON.stringify([
  { label: 'Single · Astro', url: '/demo-single/', note: '1 page' },
  { label: 'Single · Next', url: '/demo-single-next/', note: '1 page' },
  { label: 'Blog · Astro', url: '/demo-blog/', note: '3 pages + journal' },
  { label: 'Blog · Next', url: '/demo-blog-next/', note: '3 pages + journal' },
  { label: 'Full · Astro', url: '/demo-full/', note: '12+ pages, nav, sub-pages' },
  { label: 'Full · Next', url: '/demo-full-next/', note: '12+ pages, nav, sub-pages' },
]);

function isActive(linkUrl: string, currentPath: string): boolean {
  if (linkUrl === '/') return currentPath === '/';
  return currentPath === linkUrl || currentPath.startsWith(linkUrl + '/');
}

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  const { routedEntries } = await getMosaic();
  return routedEntries.map((e) => ({
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
  const title = (entry?.data as { title?: string })?.title ?? entry?.id ?? 'Mosaic';
  return { title };
}

interface NavItem { label: string; url: string }
interface RootRecord {
  nav?: NavItem[];
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const segments = slug ?? [];
  const currentPath = segments.length === 0 ? '/' : '/' + segments.join('/');

  const { routedEntries, nonRouted, entries } = await getMosaic();
  const entry = routedEntries.find((e) => e.url === currentPath);
  if (!entry) notFound();

  // Nav comes from the root collection record (mosaic-web profile root —
  // typically `<root>/index.json`). Falls back to empty when absent
  // (single-page shape).
  const rootRecord =
    (nonRouted.find((e) => e.id === 'index')?.data ??
      routedEntries.find((e) => e.id === 'index')?.data) as
      | RootRecord
      | undefined;
  const navItems = rootRecord?.nav ?? [];

  // Locale switcher: surfaced when an `.fr` variant of the current record
  // exists in the resolution. v1 just toggles visibility; both pills point
  // at the same URL (sidecars share identity).
  const baseId = entry.id.endsWith('.fr') ? entry.id.slice(0, -3) : entry.id;
  const isFrenchVariant = entry.id.endsWith('.fr');
  const hasFrenchVariant = entries.some((e) => e.id === `${baseId}.fr`);
  const showLocaleSwitcher = hasFrenchVariant || isFrenchVariant;

  // Serialised resolved record for the devtool.
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

  const schemaType = (entry.data as Record<string, unknown>)['@type'] as string | undefined;
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

  const data = entry.data as Record<string, unknown>;
  const title = String(data.title ?? entry.id);

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
            {title.split(' — ')[0] || 'Mosaic'}
          </a>
          {navItems.length > 0 && (
            <nav className="site-nav">
              {navItems.map((item) => (
                <a
                  key={item.url}
                  href={href(item.url)}
                  className={isActive(item.url, currentPath) ? 'active' : ''}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {showLocaleSwitcher && (
            <div className="locale-switch" role="group" aria-label="Switch language">
              <a href={href(currentPath)} aria-current={!isFrenchVariant ? 'page' : undefined}>
                EN
              </a>
              <a href={href(currentPath)} aria-current={isFrenchVariant ? 'page' : undefined}>
                FR
              </a>
            </div>
          )}
        </div>
      </header>
      <main>
        <PageBody entry={entry} currentPath={currentPath} routedEntries={routedEntries} />
      </main>

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
        type="application/json"
        id="mosaic-sites"
        dangerouslySetInnerHTML={{ __html: SITE_LIST }}
      />
      {/* Studio bridge — receives postMessage from the /explore/ playground
          so a parent iframe can drive theme + token values live. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            `(function(){var M={'color.bg':'--bg','color.ink':'--ink','color.accent':'--accent','color.bg-sunk':'--bg-sunk','color.bg-elev':'--bg-elev','color.line':'--line','color.ink-soft':'--ink-soft','color.ink-mute':'--ink-mute','radius.md':'--radius-md'};` +
            `window.addEventListener('message',function(e){var d=e&&e.data;if(!d||typeof d!=='object')return;` +
            `if(d.type==='mosaic-theme'){var p=d.theme;if(p==='light'||p==='dark')document.documentElement.setAttribute('data-theme',p);else document.documentElement.removeAttribute('data-theme');}` +
            `if(d.type==='mosaic-tokens'&&d.tokens){Object.keys(d.tokens).forEach(function(k){var v=M[k];if(v)document.documentElement.style.setProperty(v,d.tokens[k]);});}});})();`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){if(location.search.indexOf('nodebug=1')!==-1)return;if(window.top!==window.self)return;var s=document.createElement('script');s.src=${JSON.stringify(devtoolSrc)};s.defer=true;document.head.appendChild(s);})();`,
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

  if (currentPath === '/') return <HomeBody data={data} entry={entry} routedEntries={routedEntries} />;
  if (isPost) return <PostBody entry={entry} />;
  if (isBlogIndex)
    return <BlogIndexBody data={data} entry={entry} routedEntries={routedEntries} />;
  return <GenericPageBody entry={entry} />;
}

function HeroImg({ data }: { data: Record<string, unknown> }) {
  const hero = data.hero && typeof data.hero === 'object' ? (data.hero as Record<string, unknown>) : null;
  const heroImage = hero && typeof hero.image === 'string' ? (hero.image as string) : null;
  const heroAlt = hero && typeof hero.alt === 'string' ? (hero.alt as string) : '';
  const inlineImage = typeof data.image === 'string' ? (data.image as string) : null;
  const inlineAlt = typeof data.imageAlt === 'string' ? (data.imageAlt as string) : '';
  if (heroImage) {
    return <img className="hero-img" src={heroImage} alt={heroAlt} loading="lazy" />;
  }
  if (inlineImage) {
    return <img className="hero-img" src={inlineImage} alt={inlineAlt} loading="lazy" />;
  }
  return null;
}

function HomeBody({
  data,
  entry,
  routedEntries,
}: {
  data: Record<string, unknown>;
  entry: MosaicEntry;
  routedEntries: MosaicEntry[];
}) {
  const title = String(data.title ?? '');
  const tagline = typeof data.tagline === 'string' ? data.tagline : null;
  const intro = typeof data.intro === 'string' ? data.intro : null;
  const homeLinks = Array.isArray(data.homeLinks)
    ? (data.homeLinks as Array<{ label?: string; url?: string }>)
    : null;
  const featured = Array.isArray(data.featuredWork)
    ? (data.featuredWork as Array<{ title?: string; summary?: string; url?: string; image?: string }>)
    : null;
  const bodyHtml = renderBody(entry.body, entry.bodyExt);

  const hero = data.hero && typeof data.hero === 'object' ? (data.hero as Record<string, unknown>) : null;
  const heroImage =
    (hero && typeof hero.image === 'string' ? (hero.image as string) : null) ??
    (typeof data.image === 'string' ? (data.image as string) : null);
  const heroAlt =
    (hero && typeof hero.alt === 'string' ? (hero.alt as string) : null) ??
    (typeof data.imageAlt === 'string' ? (data.imageAlt as string) : '');

  // Recent blog posts for the journal preview.
  const homePosts = routedEntries
    .filter((e) => typeof e.url === 'string' && e.url.startsWith('/blog/') && e.url !== '/blog')
    .map((e) => {
      const d = e.data as Record<string, unknown>;
      const authorObj = d.author && typeof d.author === 'object' ? (d.author as Record<string, unknown>) : null;
      return {
        url: e.url as string,
        title: typeof d.title === 'string' ? (d.title as string) : e.slug,
        publishedAt: typeof d.publishedAt === 'string' ? (d.publishedAt as string) : undefined,
        authorName: typeof authorObj?.name === 'string' ? (authorObj.name as string) : undefined,
      };
    })
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);

  return (
    <section>
      <div className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-h1">{title}</h1>
          {tagline && <p className="home-tagline">{tagline}</p>}
          {intro && <p className="home-intro">{intro}</p>}
          {homeLinks && (
            <ul className="home-cards">
              {homeLinks.map((link, i) => (
                <li key={i}>
                  <a
                    className={`home-card-link${i === 0 ? ' primary' : ''}`}
                    href={href(link.url ?? '/')}
                  >
                    {link.label ?? ''} →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {heroImage && (
          <div className="home-hero-image">
            <img src={heroImage} alt={heroAlt} loading="eager" />
          </div>
        )}
      </div>

      {bodyHtml && (
        <div className="body-block" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}

      {featured && (
        <div className="home-section">
          <p className="section-eyebrow">Selected work</p>
          <h2 className="section-h2">What we do.</h2>
          <ul className="featured-grid">
            {featured.map((card, i) => (
              <li key={i}>
                <a className="featured-card" href={href(card.url ?? '/')}>
                  {card.image && <img src={card.image} alt="" loading="lazy" />}
                  <div className="featured-card-body">
                    <h3>{card.title}</h3>
                    {card.summary && <p>{card.summary}</p>}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {homePosts.length > 0 && (
        <div className="home-section">
          <p className="section-eyebrow">Journal</p>
          <h2 className="section-h2">Recent writing.</h2>
          <ul className="journal-preview">
            {homePosts.map((post) => (
              <li key={post.url}>
                <a href={href(post.url)}>
                  <span className="jp-title">{post.title}</span>
                  <span className="jp-meta">
                    {post.publishedAt}
                    {post.authorName ? ` · ${post.authorName}` : ''}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function GenericPageBody({ entry }: { entry: MosaicEntry }) {
  const data = entry.data as Record<string, unknown>;
  const title = String(data.title ?? entry.id);
  const lede = typeof data.lede === 'string' ? data.lede : null;
  const bodyHtml = renderBody(entry.body, entry.bodyExt);
  const subPages = Array.isArray(data.subPages)
    ? (data.subPages as Array<{ title?: string; url?: string }>)
    : null;
  const members = Array.isArray(data.members)
    ? (data.members as Array<Record<string, unknown> | string>)
    : null;
  const isContact = data['@type'] === 'ContactPage';

  return (
    <section>
      <h1 className="page-h1">{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
      <HeroImg data={data} />
      {bodyHtml && (
        <div className="body-block" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}
      {subPages && (
        <ul className="subpage-grid">
          {subPages.map((sp, i) => (
            <li key={i}>
              <a href={href(sp.url ?? '/')}>
                <strong>{sp.title}</strong>
              </a>
            </li>
          ))}
        </ul>
      )}
      {members && (
        <ul className="subpage-grid">
          {members.map((m, i) => {
            const obj = typeof m === 'object' && m !== null ? (m as Record<string, unknown>) : {};
            const name = typeof obj.name === 'string' ? (obj.name as string) : '';
            const role = typeof obj.role === 'string' ? (obj.role as string) : '';
            return (
              <li key={i}>
                <a href="#" style={{ pointerEvents: 'none', cursor: 'default' }}>
                  <strong>{name}</strong>
                  {role && (
                    <div style={{ color: 'var(--ink-mute)', fontSize: 13, marginTop: 4 }}>
                      {role}
                    </div>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {isContact && <ContactCard data={data} />}
    </section>
  );
}

function ContactCard({ data }: { data: Record<string, unknown> }) {
  const email = typeof data.email === 'string' ? (data.email as string) : null;
  const phone = typeof data.phone === 'string' ? (data.phone as string) : null;
  const addr =
    data.address && typeof data.address === 'object'
      ? (data.address as Record<string, string>)
      : null;
  const hours = Array.isArray(data.hours)
    ? (data.hours as Array<{ days?: string; hours?: string }>)
    : null;
  if (!email && !phone && !addr && !hours) return null;
  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        background: 'var(--bg-sunk)',
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      {email && (
        <div>
          <strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a>
        </div>
      )}
      {phone && (
        <div style={{ marginTop: 6 }}>
          <strong>Phone:</strong> {phone}
        </div>
      )}
      {addr && (
        <div style={{ marginTop: 6 }}>
          <strong>Address:</strong>{' '}
          {[addr.line1, addr.city, addr.postcode, addr.country].filter(Boolean).join(', ')}
        </div>
      )}
      {hours && (
        <table style={{ marginTop: 14, borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {hours.map((h, i) => (
              <tr key={i}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '4px 12px 4px 0',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  {h.days}
                </th>
                <td style={{ padding: '4px 0' }}>{h.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
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
    .filter(
      (e) => typeof e.url === 'string' && e.url.startsWith('/blog/') && e.url !== '/blog',
    )
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
            <div className="post-item-text">
              <a href={href(post.url)}>{post.title}</a>
              <div className="meta">
                {post.publishedAt}
                {post.authorName ? ` · ${post.authorName}` : ''}
              </div>
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
      <HeroImg data={data} />
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

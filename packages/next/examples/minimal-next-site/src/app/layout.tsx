/**
 * Site chrome — banner + footer.
 *
 * The banner content comes from a Mosaic record (`content/banner.json`)
 * that sits OUTSIDE the `pages/` profile root. It has no URL but the
 * adapter still emits it, and the layout reads it. This dogfoods the
 * "non-route record" pattern from Mosaic Web §4.3 — same as the Astro
 * twin in `packages/astro/examples/minimal-site`.
 */

import type { ReactNode } from 'react';
import { getMosaic } from '../lib/mosaic';
import './globals.css';

export const metadata = {
  title: 'Acme Foundry',
  description:
    'A minimal site built on @ssolu/mosaic-next. Content is a folder; Next compiled it to static HTML.',
};

interface BannerRecord {
  text?: string;
  linkText?: string;
  linkUrl?: string;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { nonRouted } = await getMosaic();
  const banner = (nonRouted.find((e) => e.id === 'banner')?.data ?? null) as
    | BannerRecord
    | null;

  // Design tokens (mosaic-design-tokens profile). The `tokens` record sits
  // outside pages/ — non-route — and its `tokens` field carries the active
  // theme. The layout emits one CSS variable per token on :root; existing
  // globals.css uses those vars. Override values come from the folder, not
  // from this template.
  const tokensRecord = nonRouted.find((e) => e.id === 'tokens')?.data as
    | { tokens?: Record<string, string> }
    | undefined;
  const tok = tokensRecord?.tokens ?? {};
  const v = (k: string, fallback: string) => tok[k] ?? fallback;
  const tokenCss = `:root {
  --bg: ${v('color.bg', '#faf6ee')};
  --bg-elev: ${v('color.bg-elev', '#ffffff')};
  --bg-sunk: ${v('color.bg-sunk', '#f2ede1')};
  --ink: ${v('color.ink', '#2a2620')};
  --ink-soft: ${v('color.ink-soft', '#5a544a')};
  --ink-mute: ${v('color.ink-mute', '#8a8278')};
  --line: ${v('color.line', '#e8e0cc')};
  --accent: ${v('color.accent', '#4a9b7a')};
  --accent-soft: ${v('color.accent-soft', '#d6ecdf')};
  --accent-ink: ${v('color.accent-ink', '#2d6b54')};
  --banner-bg: ${v('color.banner-bg', '#fbeec2')};
  --banner-ink: ${v('color.banner-ink', '#6a4d10')};
  --banner-line: ${v('color.banner-line', '#e8d49a')};
}`;

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokenCss }} />
      </head>
      <body>
        {banner && (
          <div className="meta-banner">
            <div className="meta-banner-inner">
              <span className="meta-banner-label">META</span>
              <span>
                {banner.text}{' '}
                {banner.linkUrl && (
                  <a href={banner.linkUrl}>{banner.linkText ?? 'Learn more'}</a>
                )}
              </span>
            </div>
          </div>
        )}
        {children}
        <footer className="site">
          Built with <a href="https://nextjs.org">Next.js</a> and the{' '}
          <a href="https://github.com/slavasolutions/mosaic">
            <code>@ssolu/mosaic-next</code>
          </a>{' '}
          helpers. Each page is a single static HTML file compiled from a folder of JSON. No
          runtime, no database, no engine.
        </footer>
      </body>
    </html>
  );
}

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

  return (
    <html lang="en">
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

/**
 * Root layout — html shell, theme tokens, banner, footer.
 *
 * Header (brand + nav + locale switcher) is rendered inside the route
 * component because it needs the current pathname. Footer with the theme
 * switcher lives here because it's identical across routes.
 *
 * Banner content and footer columns come from non-route records inside
 * the active Mosaic folder (`banner.json` and the root `index.json`).
 */

import type { ReactNode } from 'react';
import { getMosaic } from '../lib/mosaic';
import './globals.css';

export const metadata = {
  title: 'Mosaic — example site',
  description: 'A demo site built on @ssolu/mosaic-next.',
};

interface BannerRecord {
  text?: string;
  linkText?: string;
  linkUrl?: string;
}

interface FooterColumn {
  heading?: string;
  links?: Array<{ label: string; url: string }>;
}

interface RootRecord {
  footer?: {
    tagline?: string;
    address?: string;
    email?: string;
    columns?: FooterColumn[];
  };
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const hrefBase = (p: string): string => BASE + p;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { nonRouted, routedEntries } = await getMosaic();
  const banner = (nonRouted.find((e) => e.id === 'banner')?.data ?? null) as
    | BannerRecord
    | null;
  // The root collection record carries `defaults`, `nav`, `footer`. It lands
  // either at id `index` or as the implicit root entry depending on the
  // shape; check both spots.
  const rootRecord =
    ((nonRouted.find((e) => e.id === 'index')?.data ??
      routedEntries.find((e) => e.id === 'index')?.data) ?? null) as
      | RootRecord
      | null;
  const footer = rootRecord?.footer;

  const tokensRecord = nonRouted.find((e) => e.id === 'tokens')?.data as
    | { tokens?: Record<string, string> }
    | undefined;
  const tok = tokensRecord?.tokens ?? {};
  const v = (k: string, fallback: string) => tok[k] ?? fallback;
  const lightTokenCss = `:root {
  --bg: ${v('color.bg', '#F5F2EA')};
  --bg-elev: ${v('color.bg-elev', '#FFFFFF')};
  --bg-sunk: ${v('color.bg-sunk', '#EFEBDF')};
  --ink: ${v('color.ink', '#2A2A24')};
  --ink-soft: ${v('color.ink-soft', '#4A4A40')};
  --ink-mute: ${v('color.ink-mute', '#7B776C')};
  --line: ${v('color.line', '#E0DCC9')};
  --accent: ${v('color.accent', '#7B86D6')};
  --accent-soft: ${v('color.accent-soft', '#ECEEF9')};
  --accent-ink: ${v('color.accent-ink', '#4853A8')};
  --banner-bg: ${v('color.banner-bg', '#F4D58D')};
  --banner-ink: ${v('color.banner-ink', '#5A4A1A')};
  --banner-line: ${v('color.banner-line', '#D9B85F')};
  --font-body: ${v('font.body', '"Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif')};
  --font-serif: ${v('font.serif', '"Spectral", ui-serif, Georgia, "Times New Roman", serif')};
  --font-mono: ${v('font.mono', '"JetBrains Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", monospace')};
  --radius-md: ${v('radius.md', '8px')};
}`;

  // Theme bootstrap — applied before paint to avoid a flash. Reads
  // localStorage; writes data-theme on <html> if a saved pick exists.
  const themeBoot = `(function(){try{var p=localStorage.getItem('mosaic-theme');if(p==='light'||p==='dark'){document.documentElement.setAttribute('data-theme',p);}}catch(e){}})();`;

  // Theme switcher runtime — wires up the footer buttons.
  const themeRuntime = `(function(){var bs=document.querySelectorAll('[data-theme-set]');function cur(){try{return localStorage.getItem('mosaic-theme')||'system';}catch(e){return 'system';}}function paint(){var c=cur();bs.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-theme-set')===c?'true':'false');});}function apply(p){if(p==='light'||p==='dark'){document.documentElement.setAttribute('data-theme',p);}else{document.documentElement.removeAttribute('data-theme');}}bs.forEach(function(b){b.addEventListener('click',function(){var p=b.getAttribute('data-theme-set');try{if(p==='system')localStorage.removeItem('mosaic-theme');else localStorage.setItem('mosaic-theme',p);}catch(e){}apply(p);paint();});});paint();})();`;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: lightTokenCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
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
          {footer && (footer.columns?.length || footer.tagline || footer.email) && (
            <div className="footer-inner">
              <div className="footer-col">
                {footer.tagline && <p className="footer-tagline">{footer.tagline}</p>}
                <div className="footer-meta">
                  {footer.address && <div>{footer.address}</div>}
                  {footer.email && (
                    <div>
                      <a href={`mailto:${footer.email}`}>{footer.email}</a>
                    </div>
                  )}
                </div>
              </div>
              {(footer.columns ?? []).map((col, i) => (
                <div className="footer-col" key={i}>
                  {col.heading && <h4>{col.heading}</h4>}
                  <ul>
                    {(col.links ?? []).map((l, j) => (
                      <li key={j}>
                        <a href={hrefBase(l.url)}>{l.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div className="footer-bottom">
            <div className="footer-bottom-inner">
              <span>
                Built with <a href="https://nextjs.org">Next.js</a> and{' '}
                <a href="https://github.com/slavasolutions/mosaic">
                  <code>@ssolu/mosaic-next</code>
                </a>
                . Every page is a JSON file in a folder.
              </span>
              <div className="theme-switch" role="group" aria-label="Theme">
                <button type="button" data-theme-set="light" aria-pressed="false">
                  Light
                </button>
                <button type="button" data-theme-set="dark" aria-pressed="false">
                  Dark
                </button>
                <button type="button" data-theme-set="system" aria-pressed="false">
                  System
                </button>
              </div>
            </div>
          </div>
        </footer>
        <script dangerouslySetInnerHTML={{ __html: themeRuntime }} />
      </body>
    </html>
  );
}

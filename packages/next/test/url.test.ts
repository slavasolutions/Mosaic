/**
 * URL derivation tests — exhaustively cover Mosaic Web §3.1.
 *
 * Mirrors `packages/astro/test/url.test.ts` row-for-row. Two adapters,
 * same assertions — when this drifts, one of them is wrong.
 */

import { describe, expect, it } from 'vitest';
import {
  deriveUrl,
  getWebProfileRoot,
  urlToSlugArray,
  slugArrayToUrl,
} from '../src/url.js';

describe('getWebProfileRoot', () => {
  it('reads profiles.web.root', () => {
    expect(getWebProfileRoot({ profiles: { web: { root: 'pages' } } })).toBe('pages');
  });

  it('reads profiles.mosaic-web.root (long form)', () => {
    expect(getWebProfileRoot({ profiles: { 'mosaic-web': { root: 'pages' } } })).toBe(
      'pages',
    );
  });

  it('prefers profiles.web when both are present', () => {
    expect(
      getWebProfileRoot({
        profiles: { web: { root: 'site' }, 'mosaic-web': { root: 'pages' } },
      }),
    ).toBe('site');
  });

  it('returns null when manifest has no profiles', () => {
    expect(getWebProfileRoot({ mosaic: '0.9' })).toBeNull();
  });

  it('returns null when no web profile is declared', () => {
    expect(getWebProfileRoot({ profiles: {} })).toBeNull();
  });

  it('returns null for an undefined manifest', () => {
    expect(getWebProfileRoot(undefined)).toBeNull();
  });

  it('strips leading/trailing slashes from the configured root', () => {
    expect(getWebProfileRoot({ profiles: { web: { root: '/pages/' } } })).toBe('pages');
  });

  it('returns null when root is empty', () => {
    expect(getWebProfileRoot({ profiles: { web: { root: '' } } })).toBeNull();
  });

  it('accepts the mosaic-core `{raw}` wrapper shape', () => {
    expect(
      getWebProfileRoot({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw: { profiles: { web: { root: 'pages' } } },
      } as any),
    ).toBe('pages');
  });
});

describe('deriveUrl — Mosaic Web §3.1 table', () => {
  const root = 'pages';

  it('pages/index.json -> identity `pages` -> /', () => {
    expect(deriveUrl('pages', root)).toBe('/');
  });

  it('pages/about.json -> identity `pages/about` -> /about', () => {
    expect(deriveUrl('pages/about', root)).toBe('/about');
  });

  it('pages/about/index.json -> identity `pages/about` -> /about (same as file-form)', () => {
    expect(deriveUrl('pages/about', root)).toBe('/about');
  });

  it('pages/about/team.{md,json} -> identity `pages/about/team` -> /about/team', () => {
    expect(deriveUrl('pages/about/team', root)).toBe('/about/team');
  });

  it('pages/blog/index.json -> identity `pages/blog` -> /blog', () => {
    expect(deriveUrl('pages/blog', root)).toBe('/blog');
  });

  it('pages/blog/hello.{md,json} -> identity `pages/blog/hello` -> /blog/hello', () => {
    expect(deriveUrl('pages/blog/hello', root)).toBe('/blog/hello');
  });

  it('team/ada.json -> identity `team/ada` -> no URL (outside pages/)', () => {
    expect(deriveUrl('team/ada', root)).toBeNull();
  });
});

describe('deriveUrl — edge cases', () => {
  it('handles a non-default profile root', () => {
    expect(deriveUrl('site/blog/post', 'site')).toBe('/blog/post');
  });

  it('handles a multi-segment profile root', () => {
    expect(deriveUrl('en/pages/about', 'en/pages')).toBe('/about');
  });

  it('returns / when identity exactly equals the multi-segment root', () => {
    expect(deriveUrl('en/pages', 'en/pages')).toBe('/');
  });

  it('returns null when identity shares a prefix but is not under the root', () => {
    expect(deriveUrl('pages2/foo', 'pages')).toBeNull();
  });

  it('handles a degenerate root with a trailing index in identity', () => {
    expect(deriveUrl('pages/about/index', 'pages')).toBe('/about');
  });

  it('returns / when identity is exactly the profile root', () => {
    expect(deriveUrl('pages', 'pages')).toBe('/');
  });
});

describe('urlToSlugArray / slugArrayToUrl', () => {
  it('home URL `/` becomes an empty slug array', () => {
    expect(urlToSlugArray('/')).toEqual([]);
  });

  it('single-segment URL becomes one-element slug array', () => {
    expect(urlToSlugArray('/about')).toEqual(['about']);
  });

  it('multi-segment URL splits cleanly', () => {
    expect(urlToSlugArray('/blog/hello')).toEqual(['blog', 'hello']);
  });

  it('slugArrayToUrl is the inverse — empty array -> /', () => {
    expect(slugArrayToUrl([])).toBe('/');
    expect(slugArrayToUrl(undefined)).toBe('/');
  });

  it('slugArrayToUrl round-trips', () => {
    for (const u of ['/', '/about', '/blog/hello', '/a/b/c']) {
      expect(slugArrayToUrl(urlToSlugArray(u))).toBe(u);
    }
  });
});

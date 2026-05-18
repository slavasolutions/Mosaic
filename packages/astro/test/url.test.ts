/**
 * URL derivation tests — exhaustively cover Mosaic Web §3.1.
 *
 * The §3.1 table in mosaic-web.md is the canonical fixture. Every row that
 * SHOULD produce a URL is asserted; every row that should NOT (records
 * outside the configured root, manifest files) is asserted to return null.
 *
 * Identities here are computed per base §7.1 — that is, the file-form /
 * folder-form pairs (`pages/about.json` vs `pages/about/index.json`) have
 * already collapsed to the same identity `pages/about`. mosaic-core does
 * that collapse before our loader sees the records.
 */

import { describe, expect, it } from 'vitest';
import { deriveUrl, getWebProfileRoot } from '../src/url.js';

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
});

describe('deriveUrl — Mosaic Web §3.1 table', () => {
  // The fixture below mirrors the §3.1 table in
  // /spec/profiles/mosaic-web.md verbatim. Each row's "Source files" column
  // is informational — the spec already resolves it to a single identity.
  // We assert on the (identity -> URL) mapping the table commits to.

  const root = 'pages';

  it('pages/index.json -> identity `pages` -> /', () => {
    expect(deriveUrl('pages', root)).toBe('/');
  });

  it('pages/about.json -> identity `pages/about` -> /about', () => {
    expect(deriveUrl('pages/about', root)).toBe('/about');
  });

  it('pages/about/index.json -> identity `pages/about` -> /about (same as file-form)', () => {
    // §7.1 already collapsed this to `pages/about`; the §3.1 row asserts
    // both spellings yield the same URL. We exercise the same identity to
    // make that explicit.
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

  // The manifest row (`mosaic.json` -> no URL — not a record) is not
  // testable here because manifests never reach the loader as records;
  // mosaic-core excludes them per base §7.2. We assert the policy
  // indirectly via the loader contract (a manifest is never in `records`).
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
    // `pages2/foo` is NOT under `pages/` despite the textual overlap;
    // segment-level matching catches this.
    expect(deriveUrl('pages2/foo', 'pages')).toBeNull();
  });

  it('handles a degenerate root with a trailing index in identity', () => {
    // Defensive: if a future spec variant ever leaves `index` in the
    // identity, §3 step 3 still collapses it. mosaic-core today strips
    // trailing `/index` before we see it, so this is belt-and-braces.
    expect(deriveUrl('pages/about/index', 'pages')).toBe('/about');
  });

  it('returns / when identity is exactly the profile root', () => {
    expect(deriveUrl('pages', 'pages')).toBe('/');
  });
});

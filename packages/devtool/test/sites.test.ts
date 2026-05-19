import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SITES,
  findActive,
  readSitesData,
  renderSites,
} from '../src/sites.js';

describe('findActive', () => {
  it('matches by exact pathname', () => {
    const i = findActive(DEFAULT_SITES, '/mosaic/demo-single/');
    expect(DEFAULT_SITES[i]!.label).toBe('Single · Astro');
  });

  it('picks the longest matching prefix for nested routes', () => {
    const i = findActive(DEFAULT_SITES, '/mosaic/demo-full/services/restoration/');
    expect(DEFAULT_SITES[i]!.label).toBe('Full · Astro');
  });

  it('falls back to suffix match for non-prefixed hosts (local dev)', () => {
    const i = findActive(DEFAULT_SITES, '/demo-blog/');
    expect(DEFAULT_SITES[i]!.label).toBe('Blog · Astro');
  });

  it('returns -1 when nothing matches', () => {
    const i = findActive(
      [{ label: 'X', url: '/x/' }],
      '/totally-unrelated/',
    );
    expect(i).toBe(-1);
  });
});

describe('readSitesData', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns null when missing', () => {
    expect(readSitesData(document)).toBeNull();
  });

  it('parses a valid array, ignoring malformed entries', () => {
    document.body.innerHTML =
      '<script type="application/json" id="mosaic-sites">' +
      JSON.stringify([
        { label: 'A', url: '/a/' },
        { label: 'B' },
        { url: '/c/' },
        { label: 'D', url: '/d/', note: 'hi' },
      ]) +
      '</script>';
    const out = readSitesData(document);
    expect(out).toEqual([
      { label: 'A', url: '/a/', note: undefined },
      { label: 'D', url: '/d/', note: 'hi' },
    ]);
  });

  it('returns null when the array is empty', () => {
    document.body.innerHTML =
      '<script type="application/json" id="mosaic-sites">[]</script>';
    expect(readSitesData(document)).toBeNull();
  });
});

describe('renderSites', () => {
  it('renders pills and marks the active one', () => {
    const container = document.createElement('div');
    renderSites(
      container,
      DEFAULT_SITES,
      document,
      '/mosaic/demo-full-next/blog/',
    );
    const items = container.querySelectorAll('.site-item');
    expect(items.length).toBe(DEFAULT_SITES.length);
    const active = container.querySelector('.site-item.is-active');
    expect(active).not.toBeNull();
    expect(active!.querySelector('.site-label')!.textContent).toBe(
      'Full · Next',
    );
    expect(active!.querySelector('a.site-link')!.getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('still renders when nothing matches the current path', () => {
    const container = document.createElement('div');
    renderSites(container, DEFAULT_SITES, document, '/nowhere/');
    expect(container.querySelectorAll('.site-item').length).toBe(
      DEFAULT_SITES.length,
    );
    expect(container.querySelector('.site-item.is-active')).toBeNull();
  });
});

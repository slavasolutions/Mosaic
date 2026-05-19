import { describe, it, expect } from 'vitest';
import { buildJsonLd } from '../src/jsonld.js';

describe('buildJsonLd', () => {
  it('returns null when @type is absent', () => {
    expect(buildJsonLd({ title: 'X' })).toBeNull();
  });

  it('returns null when @type is non-string', () => {
    expect(buildJsonLd({ '@type': 42, title: 'X' })).toBeNull();
  });

  it('preserves @context when present', () => {
    expect(
      buildJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Hi',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Hi',
    });
  });

  it('defaults @context to schema.org when missing', () => {
    expect(buildJsonLd({ '@type': 'Person', name: 'Ada' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Ada',
    });
  });

  it('strips Mosaic-internal fields per §6', () => {
    const out = buildJsonLd({
      '@type': 'Article',
      headline: 'Hi',
      slug: 'hi',
      url: '/blog/hi',
      modifiers: ['fr'],
      theme: { tokens: {} },
      sources: ['blog/hi.json'],
      opaque: false,
      author: { '@type': 'Person', name: 'Ada' },
    });
    expect(out).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Hi',
      author: { '@type': 'Person', name: 'Ada' },
    });
  });

  it('accepts a wrapper { data: … } shape (Astro entry style)', () => {
    expect(
      buildJsonLd({
        id: 'about',
        data: { '@type': 'AboutPage', name: 'About', slug: 'about' },
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About',
    });
  });
});

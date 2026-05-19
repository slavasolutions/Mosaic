/**
 * Helpers integration tests — drive `readMosaic` / `getMosaicUrls` /
 * `getMosaicEntry` / `getMosaicEntries` against a fake `@ssolu/mosaic-core`.
 *
 * Stub strategy mirrors the astro adapter: vi.hoisted + vi.mock on
 * `@ssolu/mosaic-core` so the package builds + tests in isolation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFolder } = vi.hoisted(() => ({ mockReadFolder: vi.fn() }));
vi.mock('@ssolu/mosaic-core', () => ({ readFolder: mockReadFolder }));

import {
  readMosaic,
  getMosaicUrls,
  getMosaicEntry,
  getMosaicEntries,
} from '../src/index.js';

// --- D-web fixture mirroring spec/examples/D-web/content -----------------

/**
 * D-web fixture in Path A shape: each identity maps to an array of variants.
 * Canonical-only fixtures wrap each record in a single-entry array.
 */
function dwebFixture() {
  return {
    records: new Map<
      string,
      Array<{ data: Record<string, unknown>; body?: string; opaque?: boolean; modifiers?: string[] }>
    >([
      ['pages', [{ data: { title: 'Home' }, modifiers: [] }]],
      ['pages/about', [{ data: { title: 'About' }, modifiers: [] }]],
      ['pages/blog', [{ data: { title: 'Blog' }, modifiers: [] }]],
      [
        'pages/blog/hello',
        [
          {
            data: { title: 'Hello, world', publishedAt: '2026-05-14' },
            body: '# Hello\n',
            opaque: true,
            modifiers: [],
          },
        ],
      ],
      [
        'pages/blog/refs-explained',
        [
          {
            data: { title: 'Refs in one screen', publishedAt: '2026-05-19' },
            body: 'A reference is a string.',
            opaque: true,
            modifiers: [],
          },
        ],
      ],
      [
        'team/ada',
        [{ data: { name: 'Ada Lovelace', role: 'Pattern-maker' }, modifiers: [] }],
      ],
      [
        'banner',
        [{ data: { text: 'Demo banner', linkUrl: 'https://example.com' }, modifiers: [] }],
      ],
    ]),
    manifest: { mosaic: '0.9', profiles: { web: { root: 'pages' } } },
  };
}

beforeEach(() => {
  mockReadFolder.mockReset();
});

afterEach(() => {
  mockReadFolder.mockReset();
});

describe('readMosaic — option validation', () => {
  it('throws when rootPath is missing', async () => {
    await expect(readMosaic('' as string)).rejects.toThrow(/rootPath/);
  });
});

describe('readMosaic — splits routed / non-routed', () => {
  it('emits 5 routed + 2 non-routed for the D-web fixture', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const res = await readMosaic('./content');

    const routedIds = res.routedEntries.map((e) => e.id);
    expect(routedIds).toEqual([
      'pages',
      'pages/about',
      'pages/blog',
      'pages/blog/hello',
      'pages/blog/refs-explained',
    ]);

    const nonIds = res.nonRouted.map((e) => e.id);
    expect(nonIds.sort()).toEqual(['banner', 'team/ada']);

    expect(res.entries).toHaveLength(7);
  });

  it('routedEntries carry url + slug; nonRouted carry no url', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const res = await readMosaic('./content');

    const byId = new Map(res.entries.map((e) => [e.id, e]));
    expect(byId.get('pages')?.url).toBe('/');
    expect(byId.get('pages/about')?.url).toBe('/about');
    expect(byId.get('pages/blog')?.url).toBe('/blog');
    expect(byId.get('pages/blog/hello')?.url).toBe('/blog/hello');
    expect(byId.get('pages/blog/refs-explained')?.url).toBe('/blog/refs-explained');
    expect(byId.get('team/ada')?.url).toBeUndefined();
    expect(byId.get('banner')?.url).toBeUndefined();

    expect(byId.get('pages/about')?.slug).toBe('pages/about');
    expect(byId.get('pages/blog/hello')?.body).toBe('# Hello\n');
  });

  it('omits non-routed when includeNonRouteRecords=false', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const res = await readMosaic('./content', { includeNonRouteRecords: false });
    const ids = res.entries.map((e) => e.id);
    expect(ids).not.toContain('team/ada');
    expect(ids).not.toContain('banner');
    expect(res.nonRouted).toEqual([]);
    expect(res.routedEntries).toHaveLength(5);
  });

  it('emits all entries with no url when manifest declares no web profile', async () => {
    mockReadFolder.mockResolvedValueOnce({
      records: new Map([['foo', [{ data: { title: 'Foo' }, modifiers: [] }]]]),
      manifest: { mosaic: '0.9' },
    });
    const res = await readMosaic('./content');
    expect(res.routedEntries).toEqual([]);
    expect(res.nonRouted).toHaveLength(1);
    expect(res.nonRouted[0]?.url).toBeUndefined();
  });

  it('handles mosaic-core `{raw}` manifest wrapper', async () => {
    mockReadFolder.mockResolvedValueOnce({
      records: new Map([
        ['pages/about', [{ data: { title: 'About' }, modifiers: [] }]],
      ]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      manifest: { raw: { profiles: { web: { root: 'pages' } } } } as any,
    });
    const res = await readMosaic('./content');
    expect(res.routedEntries[0]?.url).toBe('/about');
  });

  it('emits non-canonical variants as non-route entries (Path A)', async () => {
    mockReadFolder.mockResolvedValueOnce({
      records: new Map([
        [
          'pages/about',
          [
            { data: { title: 'About' }, modifiers: [] },
            { data: { title: 'À propos' }, modifiers: ['fr'] },
          ],
        ],
      ]),
      manifest: { profiles: { web: { root: 'pages' } } },
    });
    const res = await readMosaic('./content');
    expect(res.routedEntries.map((e) => e.id)).toEqual(['pages/about']);
    expect(res.routedEntries[0]?.url).toBe('/about');
    // The fr variant is in nonRouted with the modifier-suffix id.
    const fr = res.nonRouted.find((e) => e.id === 'pages/about::fr');
    expect(fr).toBeTruthy();
    expect(fr?.slug).toBe('pages/about');
    expect(fr?.modifiers).toEqual(['fr']);
    expect(fr?.url).toBeUndefined();
  });
});

describe('getMosaicUrls — Next App Router catch-all shape', () => {
  it('returns [{slug:[]}] for the home page and [{slug:["about"]}] for /about', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const urls = await getMosaicUrls('./content');

    expect(urls).toContainEqual({ slug: [] });
    expect(urls).toContainEqual({ slug: ['about'] });
    expect(urls).toContainEqual({ slug: ['blog'] });
    expect(urls).toContainEqual({ slug: ['blog', 'hello'] });
    expect(urls).toContainEqual({ slug: ['blog', 'refs-explained'] });
    expect(urls).toHaveLength(5);
  });

  it('skips non-routed records (no entry for team/ada)', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const urls = await getMosaicUrls('./content');
    const flat = urls.map((u) => u.slug.join('/'));
    expect(flat).not.toContain('team/ada');
  });
});

describe('getMosaicEntry', () => {
  it('returns the entry for a given URL', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const e = await getMosaicEntry('./content', '/blog/hello');
    expect(e?.id).toBe('pages/blog/hello');
    expect(e?.data.title).toBe('Hello, world');
    expect(e?.body).toBe('# Hello\n');
  });

  it('returns null for a URL with no matching record', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    expect(await getMosaicEntry('./content', '/nope')).toBeNull();
  });

  it('throws when url does not start with /', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    await expect(getMosaicEntry('./content', 'about')).rejects.toThrow(/start.*\//i);
  });

  it('returns the home record for `/`', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const e = await getMosaicEntry('./content', '/');
    expect(e?.id).toBe('pages');
    expect(e?.data.title).toBe('Home');
  });
});

describe('getMosaicEntries', () => {
  it('returns every routed entry by default', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const all = await getMosaicEntries('./content');
    expect(all.map((e) => e.id)).toEqual([
      'pages',
      'pages/about',
      'pages/blog',
      'pages/blog/hello',
      'pages/blog/refs-explained',
    ]);
  });

  it('filters by urlPrefix (excluding the index URL by default)', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const blog = await getMosaicEntries('./content', { urlPrefix: '/blog' });
    expect(blog.map((e) => e.id)).toEqual([
      'pages/blog/hello',
      'pages/blog/refs-explained',
    ]);
  });

  it('includeIndex=true keeps the prefix URL itself', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const blog = await getMosaicEntries('./content', {
      urlPrefix: '/blog',
      includeIndex: true,
    });
    expect(blog.map((e) => e.id)).toEqual([
      'pages/blog',
      'pages/blog/hello',
      'pages/blog/refs-explained',
    ]);
  });

  it('routedOnly=false includes non-route records', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const all = await getMosaicEntries('./content', { routedOnly: false });
    const ids = all.map((e) => e.id);
    expect(ids).toContain('banner');
    expect(ids).toContain('team/ada');
  });

  it('throws when urlPrefix is missing the leading /', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    await expect(
      getMosaicEntries('./content', { urlPrefix: 'blog' }),
    ).rejects.toThrow(/\//);
  });
});

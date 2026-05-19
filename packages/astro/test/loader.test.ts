/**
 * Loader integration tests — drive `mosaicLoader` with a fake
 * LoaderContext and a fake mosaic-core. We stub `@ssolu/mosaic-core` via Vitest's
 * module mocker so the test runs even when the sibling repo is absent.
 *
 * The integration test against a real Astro project is documented as
 * deferred (see README.md "What's deferred"). This test exercises the
 * loader's contract with Astro's documented Content Layer surface
 * (LoaderContext: store, logger, parseData, generateDigest, watcher).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub @ssolu/mosaic-core before importing the loader. vi.mock is hoisted
// to the top of the file; use vi.hoisted so the mock fn exists when the
// hoisted mock factory runs.
const { mockReadFolder } = vi.hoisted(() => ({ mockReadFolder: vi.fn() }));
vi.mock('@ssolu/mosaic-core', () => ({ readFolder: mockReadFolder }));

import { mosaicLoader } from '../src/index.js';

// --- A minimal fake DataStore + LoaderContext ----------------------------

interface StoredEntry {
  id: string;
  data: Record<string, unknown>;
  body?: string;
  digest?: string;
  filePath?: string;
}

function makeStore() {
  const map = new Map<string, StoredEntry>();
  return {
    set: (entry: StoredEntry) => {
      map.set(entry.id, entry);
    },
    get: (id: string) => map.get(id),
    delete: (id: string) => map.delete(id),
    clear: () => map.clear(),
    keys: () => map.keys(),
    has: (id: string) => map.has(id),
    _all: () => Array.from(map.values()),
  };
}

function makeLogger() {
  const lines: string[] = [];
  return {
    lines,
    info: (msg: string) => lines.push('info: ' + msg),
    warn: (msg: string) => lines.push('warn: ' + msg),
    error: (msg: string) => lines.push('error: ' + msg),
    debug: (msg: string) => lines.push('debug: ' + msg),
  };
}

function makeContext(collection = 'pages') {
  const store = makeStore();
  const logger = makeLogger();
  return {
    collection,
    store,
    logger,
    parseData: async <T extends Record<string, unknown>>(opts: { id: string; data: T }) =>
      opts.data,
    generateDigest: (data: Record<string, unknown> | string) =>
      'digest:' + (typeof data === 'string' ? data.length : Object.keys(data).length),
    watcher: undefined,
  };
}

// --- Fixture mirroring spec/examples/D-web/content ----------------------

/**
 * D-web fixture in Path A shape: each identity maps to an array of one or
 * more variants. Canonical-only fixtures wrap each record in a single-entry
 * array.
 */
function dwebFixture() {
  return {
    records: new Map<
      string,
      Array<{ data: Record<string, unknown>; body?: string; filePath?: string; modifiers?: string[] }>
    >([
      ['pages', [{ data: { title: 'Home' }, filePath: '/abs/pages/index.json', modifiers: [] }]],
      [
        'pages/about',
        [{ data: { title: 'About' }, filePath: '/abs/pages/about.json', modifiers: [] }],
      ],
      [
        'pages/blog',
        [{ data: { title: 'Blog' }, filePath: '/abs/pages/blog/index.json', modifiers: [] }],
      ],
      [
        'pages/blog/hello',
        [
          {
            data: { title: 'Post -> URL /blog/hello' },
            body: '# Hello\n',
            filePath: '/abs/pages/blog/hello.md',
            modifiers: [],
          },
        ],
      ],
      [
        'team/ada',
        [
          {
            data: { name: 'Ada — a record, but NOT a web route (not under pages/).' },
            filePath: '/abs/team/ada.json',
            modifiers: [],
          },
        ],
      ],
    ]),
    manifest: { mosaic: '0.9', profiles: { web: { root: 'pages' } } },
  };
}

// --- Tests ---------------------------------------------------------------

beforeEach(() => {
  mockReadFolder.mockReset();
});

afterEach(() => {
  mockReadFolder.mockReset();
});

describe('mosaicLoader — option validation', () => {
  it('throws when neither root nor source is provided', () => {
    expect(() => mosaicLoader({} as unknown as { root: string })).toThrow(/root.*source/);
  });

  it('throws when root is empty', () => {
    expect(() => mosaicLoader({ root: '' })).toThrow(/root.*source/);
  });

  it('throws when BOTH root and source are provided (mutually exclusive)', () => {
    expect(() =>
      mosaicLoader({
        root: './content',
        source: async () => ({ records: new Map(), manifest: {} }),
      } as unknown as { root: string }),
    ).toThrow(/exactly one/);
  });

  it('accepts source-only mode without root', () => {
    const loader = mosaicLoader({
      source: async () => ({ records: new Map(), manifest: {} }),
    });
    expect(loader.name).toBe('mosaic');
    expect(typeof loader.load).toBe('function');
  });

  it('returns an object with a name and load() in root mode', () => {
    const loader = mosaicLoader({ root: './content' });
    expect(loader.name).toBe('mosaic');
    expect(typeof loader.load).toBe('function');
  });

  it('honours a custom name', () => {
    expect(mosaicLoader({ root: './content', name: 'pages' }).name).toBe('pages');
  });
});

describe('mosaicLoader — custom source mode', () => {
  it('uses the supplied source fn instead of readFolder', async () => {
    const source = vi.fn().mockResolvedValue(dwebFixture());
    const loader = mosaicLoader({ source });
    const ctx = makeContext();

    await loader.load(ctx);

    expect(source).toHaveBeenCalledTimes(1);
    expect(mockReadFolder).not.toHaveBeenCalled();
    const byId = new Map(ctx.store._all().map((e) => [e.id, e]));
    expect(byId.get('pages/about')?.data.url).toBe('/about');
  });

  it('logs that it is loading from a custom source', async () => {
    const source = vi.fn().mockResolvedValue({
      records: new Map(),
      manifest: { profiles: { web: { root: 'pages' } } },
    });
    const loader = mosaicLoader({ source });
    const ctx = makeContext();
    await loader.load(ctx);
    expect(ctx.logger.lines.some((l) => l.includes('custom source'))).toBe(true);
  });

  it('surfaces source errors without crashing the loader factory', async () => {
    const source = vi.fn().mockRejectedValue(new Error('s3 5xx'));
    const loader = mosaicLoader({ source });
    const ctx = makeContext();
    await expect(loader.load(ctx)).rejects.toThrow('s3 5xx');
  });

  it('does not wire a filesystem watcher in source mode', async () => {
    const source = vi.fn().mockResolvedValue(dwebFixture());
    const loader = mosaicLoader({ source });
    const watcherOn = vi.fn();
    const ctx = { ...makeContext(), watcher: { on: watcherOn } };
    await loader.load(ctx);
    expect(watcherOn).not.toHaveBeenCalled();
  });
});

describe('mosaicLoader — load() against D-web fixture', () => {
  it('emits 4 routes + 1 non-route record with correct URLs', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const loader = mosaicLoader({ root: './content' });
    const ctx = makeContext();

    await loader.load(ctx);

    const entries = ctx.store._all();
    const byId = new Map(entries.map((e) => [e.id, e]));

    // Every §3.1 row reaches the store with the expected URL.
    expect(byId.get('pages')?.data.url).toBe('/');
    expect(byId.get('pages/about')?.data.url).toBe('/about');
    expect(byId.get('pages/blog')?.data.url).toBe('/blog');
    expect(byId.get('pages/blog/hello')?.data.url).toBe('/blog/hello');

    // Non-route record carries no url field.
    expect(byId.get('team/ada')?.data.url).toBeUndefined();

    // Slug == identity.
    expect(byId.get('pages/about')?.data.slug).toBe('pages/about');

    // Body preserved for opaque content.
    expect(byId.get('pages/blog/hello')?.body).toBe('# Hello\n');

    // Digest computed.
    expect(byId.get('pages/about')?.digest).toMatch(/^digest:/);

    expect(entries).toHaveLength(5);
  });

  it('skips non-route records when includeNonRouteRecords=false', async () => {
    mockReadFolder.mockResolvedValueOnce(dwebFixture());
    const loader = mosaicLoader({
      root: './content',
      includeNonRouteRecords: false,
    });
    const ctx = makeContext();

    await loader.load(ctx);

    const ids = ctx.store._all().map((e) => e.id);
    expect(ids).toContain('pages/about');
    expect(ids).not.toContain('team/ada');
    expect(ids).toHaveLength(4);
  });

  it('emits entries without urls when the manifest declares no web profile', async () => {
    mockReadFolder.mockResolvedValueOnce({
      records: new Map([['foo', [{ data: { title: 'Foo' }, modifiers: [] }]]]),
      manifest: { mosaic: '0.9' },
    });
    const loader = mosaicLoader({ root: './content' });
    const ctx = makeContext();

    await loader.load(ctx);

    const entries = ctx.store._all();
    expect(entries).toHaveLength(1);
    expect(entries[0].data.url).toBeUndefined();
    expect(entries[0].data.slug).toBe('foo');
    expect(
      ctx.logger.lines.some((l) => l.includes('mosaic-web profile not declared')),
    ).toBe(true);
  });

  it('replaces the store contents on each load (no stale entries)', async () => {
    const loader = mosaicLoader({ root: './content' });
    const ctx = makeContext();

    mockReadFolder.mockResolvedValueOnce({
      records: new Map([
        ['pages/a', [{ data: {}, modifiers: [] }]],
        ['pages/b', [{ data: {}, modifiers: [] }]],
      ]),
      manifest: { profiles: { web: { root: 'pages' } } },
    });
    await loader.load(ctx);
    expect(ctx.store._all().map((e) => e.id).sort()).toEqual(['pages/a', 'pages/b']);

    mockReadFolder.mockResolvedValueOnce({
      records: new Map([['pages/c', [{ data: {}, modifiers: [] }]]]),
      manifest: { profiles: { web: { root: 'pages' } } },
    });
    await loader.load(ctx);
    expect(ctx.store._all().map((e) => e.id)).toEqual(['pages/c']);
  });

  it('surfaces a parseData failure as an error log without aborting the rest', async () => {
    mockReadFolder.mockResolvedValueOnce({
      records: new Map([
        ['pages/good', [{ data: { title: 'ok' }, modifiers: [] }]],
        ['pages/bad', [{ data: { title: 'fail' }, modifiers: [] }]],
      ]),
      manifest: { profiles: { web: { root: 'pages' } } },
    });
    const loader = mosaicLoader({ root: './content' });
    const ctx = makeContext();
    const originalParse = ctx.parseData;
    ctx.parseData = async (opts) => {
      if (opts.id === 'pages/bad') throw new Error('schema mismatch');
      return originalParse(opts);
    };

    await loader.load(ctx);

    const ids = ctx.store._all().map((e) => e.id);
    expect(ids).toEqual(['pages/good']);
    expect(ctx.logger.lines.some((l) => l.includes('parseData failed for "pages/bad"'))).toBe(true);
  });

  it('emits non-canonical variants as separate non-route entries (Path A)', async () => {
    mockReadFolder.mockResolvedValueOnce({
      records: new Map([
        [
          'pages/about',
          [
            { data: { title: 'About' }, modifiers: [] },
            { data: { title: 'À propos' }, modifiers: ['fr'] },
            { data: { title: 'Про нас' }, modifiers: ['uk'] },
          ],
        ],
      ]),
      manifest: { profiles: { web: { root: 'pages' } } },
    });
    const loader = mosaicLoader({ root: './content' });
    const ctx = makeContext();

    await loader.load(ctx);

    const byId = new Map(ctx.store._all().map((e) => [e.id, e]));
    // Canonical → identity id, has the route URL.
    expect(byId.get('pages/about')?.data.url).toBe('/about');
    expect(byId.get('pages/about')?.data.slug).toBe('pages/about');
    // Non-canonical → `<id>::<mods>` id, NO route URL.
    expect(byId.get('pages/about::fr')?.data.url).toBeUndefined();
    expect(byId.get('pages/about::fr')?.data.slug).toBe('pages/about');
    expect(byId.get('pages/about::uk')?.data.url).toBeUndefined();
    expect(byId.get('pages/about::uk')?.data.slug).toBe('pages/about');
    // The data carries the variant's modifiers for downstream selectors.
    expect(byId.get('pages/about::fr')?.data.modifiers).toEqual(['fr']);
  });
});

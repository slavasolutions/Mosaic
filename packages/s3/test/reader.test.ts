import { describe, it, expect } from 'vitest';
import { readBucket } from '../src/index.js';
import { fakeBucket } from './fake-s3.js';

const MANIFEST = JSON.stringify({ profiles: { web: { root: 'pages' } } });

describe('readBucket — basics', () => {
  it('loads the manifest and exposes profile metadata', async () => {
    const client = fakeBucket({
      'mosaic.json': MANIFEST,
      'pages/about.json': '{"title": "About"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    expect(r.manifest?.raw).toEqual({ profiles: { web: { root: 'pages' } } });
  });

  it('emits one record per file with the correct identity', async () => {
    const client = fakeBucket({
      'pages/about.json': '{"title":"About"}',
      'team/ada.json': '{"name":"Ada"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    expect([...r.records.keys()].sort()).toEqual(['pages/about', 'team/ada']);
  });

  it('returns variants as Record[] per Path A', async () => {
    const client = fakeBucket({
      'pages/about.json': '{"title":"About"}',
      'pages/about.fr.json': '{"title":"À propos"}',
      'pages/about.uk.json': '{"title":"Про нас"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    const about = r.records.get('pages/about');
    expect(about).toBeDefined();
    expect(about!.length).toBe(3);
    expect(about!.map((v) => v.modifiers)).toEqual([[], ['fr'], ['uk']]);
    expect((about![0]!.data as Record<string, string>).title).toBe('About');
    expect((about![1]!.data as Record<string, string>).title).toBe('À propos');
    expect((about![2]!.data as Record<string, string>).title).toBe('Про нас');
  });

  it('pairs opaque content + sidecar into one record', async () => {
    const client = fakeBucket({
      'pages/hello.md': '# Hello world',
      'pages/hello.json': '{"title":"Hello","author":"Ada"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    const hello = r.records.get('pages/hello');
    expect(hello).toBeDefined();
    expect(hello!.length).toBe(1);
    expect(hello![0]!.opaque).toBe(true);
    expect(hello![0]!.data).toEqual({ title: 'Hello', author: 'Ada' });
    expect(hello![0]!.sources.sort()).toEqual(['pages/hello.json', 'pages/hello.md']);
  });

  it('resolves references to the canonical variant', async () => {
    const client = fakeBucket({
      'pages/hello.json': '{"title":"Hello","author":"ref:/team/ada"}',
      'team/ada.json': '{"name":"Ada Lovelace"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    const hello = r.records.get('pages/hello')![0]!;
    expect(hello.data).toEqual({
      title: 'Hello',
      author: { name: 'Ada Lovelace' },
    });
  });

  it('warns and nulls dangling refs by default', async () => {
    const client = fakeBucket({
      'pages/hello.json': '{"author":"ref:/team/nobody"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    expect(r.records.get('pages/hello')![0]!.data).toEqual({ author: null });
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]!.message).toMatch(/dangling reference/);
  });

  it('preserves dangling refs verbatim when keepDangling is true', async () => {
    const client = fakeBucket({
      'pages/hello.json': '{"author":"ref:/team/nobody"}',
    });
    const r = await readBucket({ client, bucket: 'b', keepDangling: true });
    expect(r.records.get('pages/hello')![0]!.data).toEqual({
      author: 'ref:/team/nobody',
    });
  });

  it('skips hidden entries per §7.2', async () => {
    const client = fakeBucket({
      'pages/about.json': '{"title":"About"}',
      'pages/_draft.json': '{"title":"Draft"}',
      'pages/.hidden.json': '{"title":"Hidden"}',
      '_private/foo.json': '{"title":"Foo"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    expect([...r.records.keys()]).toEqual(['pages/about']);
  });

  it('skips §7 name violations (does not throw)', async () => {
    const client = fakeBucket({
      'pages/Valid.json': '{"x":1}', // uppercase — violation
      'pages/has_underscore.json': '{"x":2}', // underscore — violation
      'pages/ok.json': '{"x":3}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    expect([...r.records.keys()]).toEqual(['pages/ok']);
  });
});

describe('readBucket — prefix handling', () => {
  it('strips the prefix from record identities', async () => {
    const client = fakeBucket({
      'content/mosaic.json': MANIFEST,
      'content/pages/about.json': '{"title":"About"}',
      'content/team/ada.json': '{"name":"Ada"}',
    });
    const r = await readBucket({ client, bucket: 'b', prefix: 'content/' });
    expect([...r.records.keys()].sort()).toEqual(['pages/about', 'team/ada']);
    expect(r.manifest?.raw).toEqual({ profiles: { web: { root: 'pages' } } });
  });

  it('normalises prefix with or without trailing slash', async () => {
    const objects = {
      'content/pages/about.json': '{"title":"About"}',
    };
    const a = await readBucket({ client: fakeBucket(objects), bucket: 'b', prefix: 'content' });
    const b = await readBucket({ client: fakeBucket(objects), bucket: 'b', prefix: 'content/' });
    const c = await readBucket({ client: fakeBucket(objects), bucket: 'b', prefix: '/content/' });
    expect([...a.records.keys()]).toEqual(['pages/about']);
    expect([...b.records.keys()]).toEqual(['pages/about']);
    expect([...c.records.keys()]).toEqual(['pages/about']);
  });

  it('ignores objects outside the prefix', async () => {
    const client = fakeBucket({
      'content/pages/about.json': '{"title":"About"}',
      'images/foo.jpg': 'binary',
      'other/junk.json': '{"x":1}',
    });
    const r = await readBucket({ client, bucket: 'b', prefix: 'content/' });
    expect([...r.records.keys()]).toEqual(['pages/about']);
  });
});

describe('readBucket — cascade', () => {
  it('inherits locale via cascade defaults', async () => {
    const client = fakeBucket({
      'mosaic.json': MANIFEST,
      'pages/index.json': '{"defaults":{"locale":"en"}}',
      'pages/about.json': '{"title":"About"}',
    });
    const r = await readBucket({ client, bucket: 'b' });
    const about = r.records.get('pages/about')![0]!;
    expect((about.data as Record<string, unknown>).locale).toBe('en');
  });

  it('cascades a profile-declared key when requested', async () => {
    const client = fakeBucket({
      'pages/index.json': '{"defaults":{"theme":"ref:/tokens"}}',
      'pages/about.json': '{"title":"About"}',
      'tokens.json': '{"bg":"#fff"}',
    });
    const r = await readBucket({ client, bucket: 'b', cascadingKeys: ['theme'] });
    const about = r.records.get('pages/about')![0]!;
    expect((about.data as Record<string, unknown>).theme).toEqual({ bg: '#fff' });
  });
});

describe('readBucket — pagination', () => {
  it('paginates through ListObjectsV2 results', async () => {
    const objects: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      objects[`pages/p${String(i).padStart(3, '0')}.json`] = `{"i":${i}}`;
    }
    const client = fakeBucket(objects, { pageSize: 7 });
    const r = await readBucket({ client, bucket: 'b' });
    expect(r.records.size).toBe(50);
    for (let i = 0; i < 50; i++) {
      const id = `pages/p${String(i).padStart(3, '0')}`;
      const rec = r.records.get(id);
      expect(rec).toBeDefined();
      expect((rec![0]!.data as Record<string, number>).i).toBe(i);
    }
  });
});

describe('readBucket — concurrency control', () => {
  it('runs with concurrency=1 deterministically', async () => {
    const objects: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      objects[`p${i}.json`] = `{"i":${i}}`;
    }
    const client = fakeBucket(objects);
    const r = await readBucket({ client, bucket: 'b', concurrency: 1 });
    expect(r.records.size).toBe(20);
  });
});

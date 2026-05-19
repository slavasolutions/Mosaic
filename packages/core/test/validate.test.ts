/**
 * Replicate `validate.py`'s expected outcomes on the four spec examples:
 *
 *   A — fails (intentional collision in `collision/`)
 *   B — passes with one warning (orphan modifier sidecar `team.fr.json`)
 *   C — passes clean
 *   D — passes clean
 */
import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../src/validate.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fx = (id: string) =>
  path.join(HERE, 'fixtures', id, 'content');

describe('validate() vs spec examples', () => {
  it('A-identity: FAILS — collision/about file+folder form', async () => {
    const r = await validate(fx('A-identity'));
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(
      r.errors.some((e) => /ambiguous identity 'collision\/about'/.test(e.message)),
    ).toBe(true);
  });

  it('B-sidecars: PASSES with one orphan-modifier-sidecar warning', async () => {
    const r = await validate(fx('B-sidecars'));
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    // `team.fr.json` has no `team.fr.<opaque>` sibling — only `team.md`.
    const orphan = r.warnings.find((w) =>
      /orphan modifier sidecar/.test(w.message),
    );
    expect(orphan).toBeTruthy();
    expect(orphan!.path).toMatch(/team\.fr\.json$/);
  });

  it('C-cascade: PASSES clean', async () => {
    const r = await validate(fx('C-cascade'));
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  it('D-web: PASSES clean', async () => {
    const r = await validate(fx('D-web'));
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });
});

describe('validateFiles() — pure in-memory validator', () => {
  it('passes clean on a minimal valid folder', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({
      files: {
        'mosaic.json': '{"mosaic":"0.9"}',
        'pages/about.json': '{"title":"About"}',
      },
    });
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.records.has('pages/about')).toBe(true);
  });

  it('flags invalid JSON', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({ files: { 'pages/x.json': '{ not json' } });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /invalid JSON/.test(e.message))).toBe(true);
  });

  it('flags an invalid mosaic.json manifest', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({ files: { 'mosaic.json': 'nope' } });
    expect(r.errors.some((e) => /manifest.*not valid JSON/.test(e.message))).toBe(true);
  });

  it('flags uppercase filenames', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({ files: { 'pages/About.json': '{}' } });
    expect(r.errors.some((e) => /lowercase/.test(e.message))).toBe(true);
  });

  it('warns on markdown frontmatter', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({
      files: { 'pages/x.md': '---\ntitle: x\n---\n\nbody' },
    });
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => /frontmatter/.test(w.message))).toBe(true);
  });

  it('flags file/folder identity collision per §7.1', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({
      files: {
        'pages/about.json': '{}',
        'pages/about/index.json': '{}',
      },
    });
    expect(r.errors.some((e) => /ambiguous identity 'pages\/about'/.test(e.message))).toBe(true);
  });

  it('ignores hidden segments (§7.2)', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const r = validateFiles({
      files: {
        '_drafts/.foo.json': '{ broken',
        'pages/about.json': '{}',
      },
    });
    expect(r.ok).toBe(true);
  });

  it('accepts a Map<rel, text> input identically to a record', async () => {
    const { validateFiles } = await import('../src/validate.js');
    const m = new Map<string, string>([
      ['pages/about.json', '{"title":"About"}'],
    ]);
    const r = validateFiles({ files: m });
    expect(r.ok).toBe(true);
    expect(r.records.has('pages/about')).toBe(true);
  });
});

describe('validate() identity map', () => {
  it('records every identity in the C-cascade fixture', async () => {
    const r = await validate(fx('C-cascade'));
    expect(r.records.has('blog/hello')).toBe(true);
    expect(r.records.has('team/ada')).toBe(true);
  });

  it('records the Web profile fixture identities', async () => {
    const r = await validate(fx('D-web'));
    expect(r.records.has('pages/about')).toBe(true);
    expect(r.records.has('pages/blog/hello')).toBe(true);
    expect(r.records.has('team/ada')).toBe(true);
  });
});

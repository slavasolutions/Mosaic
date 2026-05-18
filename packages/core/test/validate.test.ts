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

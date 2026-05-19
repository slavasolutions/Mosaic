/**
 * Parity tests: load the same fixture via `readFolder` (filesystem) and
 * `readBucket` (S3-shaped) and assert the resulting Resolutions are
 * identical (modulo the source-tagged `rootPath` and source paths).
 *
 * If these pass, every other consumer of mosaic-core's pipeline can
 * trust that switching adapters does not change record content.
 */
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { readFolder } from '@ssolu/mosaic-core';
import { readBucket } from '../src/index.js';
import { fakeBucket, fakeBucketFromFolder } from './fake-s3.js';

const SPEC_EXAMPLES = resolve(import.meta.dirname, '../../../spec/examples');

const FIXTURES = [
  { name: 'A-identity', path: `${SPEC_EXAMPLES}/A-identity/content` },
  { name: 'B-sidecars', path: `${SPEC_EXAMPLES}/B-sidecars/content` },
  { name: 'C-cascade',  path: `${SPEC_EXAMPLES}/C-cascade/content`  },
  { name: 'D-web',      path: `${SPEC_EXAMPLES}/D-web/content`      },
  { name: 'E-variants', path: `${SPEC_EXAMPLES}/E-variants/content` },
];

for (const fx of FIXTURES) {
  describe(`parity: ${fx.name}`, () => {
    it('readFolder and readBucket return equivalent Resolutions', async () => {
      const objects = fakeBucketFromFolder(fx.path);
      const client = fakeBucket(objects);

      const fs = await readFolder(fx.path);
      const s3 = await readBucket({ client, bucket: 'fixture' });

      // Manifest content equal (rootPath naturally differs).
      expect(s3.manifest?.raw).toEqual(fs.manifest?.raw);

      // Same identities.
      expect([...s3.records.keys()].sort()).toEqual([...fs.records.keys()].sort());

      // Per identity: same variant count, same data, same modifiers (in order).
      for (const id of fs.records.keys()) {
        const fsVariants = fs.records.get(id)!;
        const s3Variants = s3.records.get(id)!;
        expect(s3Variants.length).toBe(fsVariants.length);
        for (let i = 0; i < fsVariants.length; i++) {
          expect(s3Variants[i]!.modifiers).toEqual(fsVariants[i]!.modifiers);
          expect(s3Variants[i]!.data).toEqual(fsVariants[i]!.data);
          expect(s3Variants[i]!.opaque).toBe(fsVariants[i]!.opaque);
          expect(s3Variants[i]!.sources.sort()).toEqual(
            fsVariants[i]!.sources.sort(),
          );
        }
      }

      // Warnings: same count and messages (paths may differ if either source emits hidden warnings).
      expect(s3.warnings.length).toBe(fs.warnings.length);
      expect(s3.warnings.map((w) => w.message).sort()).toEqual(
        fs.warnings.map((w) => w.message).sort(),
      );

      // Collections: same identities, same members, same defaults.
      expect([...s3.collections.keys()].sort()).toEqual(
        [...fs.collections.keys()].sort(),
      );
      for (const cid of fs.collections.keys()) {
        const fsColl = fs.collections.get(cid)!;
        const s3Coll = s3.collections.get(cid)!;
        expect(s3Coll.members.sort()).toEqual(fsColl.members.sort());
        expect(s3Coll.children.sort()).toEqual(fsColl.children.sort());
        expect(s3Coll.defaults).toEqual(fsColl.defaults);
      }
    });
  });
}

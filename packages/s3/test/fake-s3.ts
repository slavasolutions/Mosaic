/**
 * Tiny in-memory S3 client that satisfies the structural `S3ClientLike`
 * surface used by `readBucket`. Backed by a key → string map.
 *
 * Deliberately not aws-sdk-client-mock — keeps tests dep-free, exercises
 * exactly the surface our reader needs, and makes parity tests trivial
 * (load the same fixture from disk via readFolder + from this fake via
 * readBucket and assert identical Resolutions).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import type { S3ClientLike } from '../src/types.js';

export interface FakeBucketOptions {
  /** Hard-code the max page size to exercise pagination. Default = 1000. */
  pageSize?: number;
}

/** Build an in-memory bucket from an explicit key → bytes map. */
export function fakeBucket(
  objects: Record<string, string>,
  opts: FakeBucketOptions = {},
): S3ClientLike {
  const pageSize = opts.pageSize ?? 1000;
  // Sorted to make pagination deterministic.
  const allKeys = Object.keys(objects).sort();

  return {
    async send(cmd: unknown) {
      if (cmd instanceof ListObjectsV2Command) {
        const input = cmd.input;
        const wantedPrefix = input.Prefix ?? '';
        const startAfter = input.ContinuationToken;
        const filtered = allKeys.filter((k) => k.startsWith(wantedPrefix));
        const startIdx = startAfter
          ? filtered.findIndex((k) => k > startAfter)
          : 0;
        const slice = filtered.slice(
          startIdx === -1 ? filtered.length : startIdx,
          (startIdx === -1 ? filtered.length : startIdx) + pageSize,
        );
        const isTruncated =
          (startIdx === -1 ? filtered.length : startIdx) + slice.length <
          filtered.length;
        return {
          Contents: slice.map((Key) => ({ Key })),
          IsTruncated: isTruncated,
          NextContinuationToken: isTruncated ? slice[slice.length - 1] : undefined,
        };
      }
      if (cmd instanceof GetObjectCommand) {
        const key = cmd.input.Key!;
        if (!(key in objects)) {
          const err = new Error('NoSuchKey') as Error & {
            $metadata: { httpStatusCode: number };
          };
          err.$metadata = { httpStatusCode: 404 };
          throw err;
        }
        return {
          Body: {
            // mimic AWS SDK v3 stream interface
            transformToString: async () => objects[key]!,
          },
        };
      }
      throw new Error(`fakeBucket: unsupported command ${cmd?.constructor?.name}`);
    },
  };
}

/**
 * Mirror a directory tree on disk into an in-memory bucket — every text
 * file becomes a key with its bytes as the value. Useful for parity
 * tests against `readFolder` fixtures.
 */
export function fakeBucketFromFolder(rootAbs: string): Record<string, string> {
  const out: Record<string, string> = {};
  function recurse(dir: string): void {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const s = statSync(p);
      if (s.isDirectory()) {
        recurse(p);
        continue;
      }
      if (!s.isFile()) continue;
      const rel = relative(rootAbs, p).split(sep).join('/');
      out[rel] = readFileSync(p, 'utf8');
    }
  }
  recurse(rootAbs);
  return out;
}

/**
 * Public types for `@ssolu/mosaic-s3`.
 */

import type {
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * The subset of `@aws-sdk/client-s3`'s `S3Client` we use. Declared
 * structurally so consumers can pass any compatible client (real AWS SDK,
 * a mock from `aws-sdk-client-mock`, or a custom wrapper) without having
 * to nominal-match the exact SDK version.
 */
export interface S3ClientLike {
  send(command: ListObjectsV2Command | GetObjectCommand): Promise<unknown>;
}

export interface ReadBucketOptions {
  /** S3 client (AWS SDK v3 `S3Client` or compatible). */
  client: S3ClientLike;
  /** Bucket name (e.g. `"uccon-mosaic-beta"`). */
  bucket: string;
  /**
   * Key prefix inside the bucket. Leading/trailing slashes are normalised;
   * `""` (default) reads from the bucket root. The prefix DOES NOT appear
   * in record identities — it functions as the Mosaic content root.
   */
  prefix?: string;
  /**
   * Profile-declared cascading keys. Mirrors the same option on
   * `@ssolu/mosaic-core`'s `readFolder`. Defaults to `[]` (no cascading).
   *
   * For mosaic-web sites consumed through the Astro loader's `source` mode,
   * pass `['theme']` here — the filesystem loader injects that key
   * automatically, but source-mode adapters must opt in. Mismatching this
   * silently disables the design-tokens cascade.
   */
  cascadingKeys?: string[];
  /**
   * When `true`, dangling references are passed through verbatim instead of
   * being replaced with `null`. The format is silent on the rendering, only
   * mandating a warning (§11.6).
   */
  keepDangling?: boolean;
  /**
   * Tuning knob for the parallel JSON GET phase. Defaults to 32 — enough
   * to saturate a typical R2/S3 endpoint without thrashing connection
   * pools. Lower to 1 for deterministic ordering in tests.
   */
  concurrency?: number;
}

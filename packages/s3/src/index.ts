/**
 * @ssolu/mosaic-s3 — S3-compatible source layer for Mosaic.
 *
 * Read a Mosaic folder from any S3 API (AWS S3, Cloudflare R2, MinIO,
 * Backblaze B2, Wasabi, DigitalOcean Spaces) and feed it into the same
 * spec pipeline as the filesystem reader. Drop-in replacement for
 * `readFolder` when content lives in object storage instead of on disk.
 */

export { readBucket } from './reader.js';
export type { ReadBucketOptions, S3ClientLike } from './types.js';

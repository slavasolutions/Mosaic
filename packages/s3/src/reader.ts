/**
 * `readBucket` — Mosaic source layer over S3-compatible storage.
 *
 * Lists every object under `bucket/prefix`, classifies each by Mosaic §7,
 * loads JSON records (in parallel, bounded), and feeds the result into
 * `@ssolu/mosaic-core`'s spec pipeline (`runPipeline`). Opaque records'
 * bodies are NOT streamed eagerly — same behaviour as the filesystem
 * reader. Consumers that need binary bodies fetch them at render time
 * from the source URL (the typical R2 / S3 pattern).
 *
 * Works against any S3-compatible API:
 *   - AWS S3
 *   - Cloudflare R2
 *   - MinIO
 *   - Backblaze B2 (S3-compatible endpoint)
 *   - Wasabi
 *   - DigitalOcean Spaces
 *
 * Identical record shape as `readFolder` — adapters are interchangeable.
 */

import {
  ListObjectsV2Command,
  GetObjectCommand,
  type ListObjectsV2CommandOutput,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import {
  runPipeline,
  identityOf,
  isHidden,
  splitName,
  type FileEntry,
  type PipelineInput,
} from '@ssolu/mosaic-core/adapter';
import type {
  JsonObject,
  Manifest,
  Resolution,
} from '@ssolu/mosaic-core';

import type { ReadBucketOptions, S3ClientLike } from './types.js';

const MANIFEST_KEY = 'mosaic.json';

/**
 * Load a Mosaic folder rooted at `s3://bucket/prefix` and run the spec
 * pipeline. Returns the same `Resolution` shape as `readFolder`.
 *
 * Identities are computed relative to `prefix` — the prefix itself never
 * appears in identity strings (it's the content root, not part of the
 * tree).
 */
export async function readBucket(opts: ReadBucketOptions): Promise<Resolution> {
  const { client, bucket } = opts;
  const prefix = normalisePrefix(opts.prefix ?? '');
  const concurrency = Math.max(1, opts.concurrency ?? 32);

  // 1. List all keys under prefix (paginated).
  const keys = await listAllKeys(client, bucket, prefix);

  // 2. Load the manifest if present at the prefix root.
  let manifest: Manifest | null = null;
  const manifestKey = prefix + MANIFEST_KEY;
  if (keys.includes(manifestKey)) {
    try {
      const parsed = await getJsonObject(client, bucket, manifestKey);
      manifest = { raw: parsed };
    } catch {
      // Same lenient stance as the filesystem reader — `validate()` is the gate.
      manifest = null;
    }
  }

  // 3. Convert keys → FileEntry[]. Skip hidden (§7.2), the manifest, and
  //    §7 name violations. `validate()` flags the violations separately.
  const files: FileEntry[] = [];
  for (const key of keys) {
    if (key === manifestKey) continue;
    if (!key.startsWith(prefix)) continue;
    const rel = key.slice(prefix.length);
    if (rel === '') continue;
    if (rel.endsWith('/')) continue; // "directory marker" objects, ignore
    const parts = rel.split('/');
    if (isHidden(parts)) continue;
    const last = parts[parts.length - 1]!;
    const { base, modifiers, ext, err } = splitName(last);
    if (err) continue;
    const ident = identityOf(parts);
    files.push({ rel, parts, base, modifiers, ext, ident });
  }

  // 4. Build a parallel, bounded fetcher cache so the pipeline's
  //    fetchJson calls don't re-fetch the same key twice (a sidecar is
  //    read by the pipeline for the entry that owns it; same key may
  //    appear as a content file's sidecar across the run).
  const cache = new Map<string, Promise<JsonObject>>();
  const inflight = new Set<Promise<unknown>>();

  async function fetchJson(rel: string): Promise<JsonObject> {
    const key = prefix + rel;
    let p = cache.get(key);
    if (!p) {
      // Concurrency gate.
      while (inflight.size >= concurrency) {
        await Promise.race(inflight);
      }
      p = getJsonObject(client, bucket, key);
      cache.set(key, p);
      inflight.add(p);
      p.finally(() => inflight.delete(p!));
    }
    return p;
  }

  async function fetchBody(rel: string): Promise<string> {
    const key = prefix + rel;
    while (inflight.size >= concurrency) {
      await Promise.race(inflight);
    }
    const p = getObjectText(client, bucket, key);
    inflight.add(p);
    p.finally(() => inflight.delete(p));
    return p;
  }

  const input: PipelineInput = {
    files,
    manifest,
    rootId: `s3://${bucket}/${prefix}`,
    fetchJson,
    fetchBody,
  };

  return runPipeline(input, {
    cascadingKeys: opts.cascadingKeys ?? [],
    keepDangling: !!opts.keepDangling,
  });
}

// =========================================================================
// S3 helpers
// =========================================================================

function normalisePrefix(raw: string): string {
  let p = raw.replace(/^\/+/, '');
  if (p && !p.endsWith('/')) p += '/';
  return p;
}

async function listAllKeys(
  client: S3ClientLike,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const out: string[] = [];
  let ContinuationToken: string | undefined;
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix === '' ? undefined : prefix,
      ContinuationToken,
      MaxKeys: 1000,
    });
    const r = (await client.send(cmd)) as ListObjectsV2CommandOutput;
    for (const obj of r.Contents ?? []) {
      if (obj.Key) out.push(obj.Key);
    }
    ContinuationToken = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}

async function getJsonObject(
  client: S3ClientLike,
  bucket: string,
  key: string,
): Promise<JsonObject> {
  const text = await getObjectText(client, bucket, key);
  const parsed = JSON.parse(text);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `expected top-level JSON object in s3://${bucket}/${key}`,
    );
  }
  return parsed as JsonObject;
}

async function getObjectText(
  client: S3ClientLike,
  bucket: string,
  key: string,
): Promise<string> {
  const r = (await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )) as GetObjectCommandOutput;
  if (!r.Body) {
    throw new Error(`s3 GetObject ${bucket}/${key}: empty body`);
  }
  return streamToString(r.Body);
}

/**
 * Coerce the variety of stream/body shapes the AWS SDK hands back into
 * a string. AWS SDK v3 returns either a Node `Readable`, a Web `ReadableStream`,
 * or (in some test mocks) a string directly.
 */
async function streamToString(body: unknown): Promise<string> {
  if (typeof body === 'string') return body;
  if (body && typeof (body as { transformToString?: unknown }).transformToString === 'function') {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }
  // Node Readable
  if (body && typeof (body as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  // Web ReadableStream
  if (body && typeof (body as ReadableStream).getReader === 'function') {
    const reader = (body as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return new TextDecoder('utf-8').decode(
      Buffer.concat(chunks.map((c) => Buffer.from(c))),
    );
  }
  throw new Error('s3 body is not a recognised stream shape');
}

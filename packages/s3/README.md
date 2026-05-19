<p align="center"><img src="../../logo.svg" width="64" alt="Mosaic logo"></p>

# @ssolu/mosaic-s3

**S3-compatible source layer for Mosaic.** Read a bucket+prefix as a Mosaic folder. Drop-in alternative to the filesystem reader (`readFolder`) when your content lives in object storage.

Works against any S3 API:

- AWS S3
- Cloudflare R2
- MinIO
- Backblaze B2 (S3-compatible endpoint)
- Wasabi
- DigitalOcean Spaces

## Status

`0.1.0` — working draft. Tracks Mosaic spec 0.9.2 exactly the same way `@ssolu/mosaic-core`'s filesystem reader does. The two are interchangeable.

## Install

```sh
npm install @ssolu/mosaic-s3 @ssolu/mosaic-core @aws-sdk/client-s3
```

While `@ssolu/mosaic-core` is pre-release, this package declares it as a local `file:` dependency in the monorepo.

## Use

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { readBucket } from '@ssolu/mosaic-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const r = await readBucket({
  client,
  bucket: 'my-content',
  prefix: 'mosaic/',        // optional, content root inside the bucket
  cascadingKeys: ['theme'],  // optional, profile-declared cascading keys
  keepDangling: false,       // optional, see §11.6
  concurrency: 32,           // optional, parallel JSON GETs
});

// r is a `Resolution` — identical shape to readFolder's output.
const about = r.records.get('pages/about'); // Record[]
```

The returned `Resolution` is byte-identical to what `readFolder` produces from the same content on disk. Adapters are interchangeable.

## What's the contract

`readBucket` lists every object under `bucket/prefix`, classifies each per Mosaic §7, and feeds the file list into `runPipeline` from `@ssolu/mosaic-core/adapter`. Opaque records' binary bodies are NOT eagerly streamed — same behaviour as `readFolder`. Consumers fetch binaries at render time from their source URLs (the typical R2/S3 pattern).

| Pipeline pass | Where it lives | Notes |
|---|---|---|
| 1. List + classify (§7) | this package | S3 ListObjectsV2 paginated |
| 2. Sidecar merge (§8) | mosaic-core/runPipeline | unchanged |
| 3. Cascade fill (§12.3) | mosaic-core/runPipeline | unchanged |
| 4. Resolve refs (§11.4) | mosaic-core/runPipeline | canonical-only, Path A |
| Final assembly | mosaic-core/runPipeline | variant arrays sorted canonical-first |

## Adapter ecosystem

Mosaic's pipeline is source-agnostic. Each adapter package supplies a source layer (lister + JSON fetcher) and calls into core:

| package | what it reads from | status |
|---|---|---|
| `@ssolu/mosaic-core` (`readFolder`) | filesystem | shipped |
| `@ssolu/mosaic-s3` (this) | S3-compatible object storage | shipped |
| `@ssolu/mosaic-git` (proposed) | git repository (any branch/ref) | not started |
| `@ssolu/mosaic-memory` (proposed) | in-memory fixtures (testing) | not started |

A site picks the adapter that matches where its content lives. Switching adapters changes one import line — the rest of the site code, the record shapes, the URL derivation, the refs, the cascade, ALL identical.

## Storage architecture — content vs binaries

Storage location is orthogonal to the source adapter. Both content (records) and binaries (images, PDFs) need a home; they can live together or separately. Common combinations:

| layout | content | binaries | when |
|---|---|---|---|
| FS-only | filesystem | filesystem (in `public/` or in-tree) | small site, full git history of everything |
| FS + R2 mirror | filesystem | R2 / S3 (gitignored locally, mirrored) | typical web — repo stays small, CDN serves binaries |
| S3-native | S3 / R2 (this package) | same bucket | edited via S3 tools, served from same bucket |
| Split S3 | S3 / R2 (content prefix) | S3 / R2 (binaries prefix) | bucket-level access policies differ for content vs media |
| Git-backed | git repo (planned `mosaic-git` adapter) | LFS or R2 | content-as-PRs workflow, audit trail |

Binaries can be referenced via:

- **opaque records** — the `.jpg` file itself lives next to its `.json` sidecar; pair becomes one record. Spec-canonical; mosaic-core surfaces them via `opaque: true`. Astro / Next adapters can serve them as URLs.
- **structured pointer records** — a `.json` carrying `{ src: <URL>, alt, width, height }` and no opaque sibling. The binary lives elsewhere (a CDN, another bucket). Same record shape, cheaper to keep in git.

Either pattern works against any source adapter.

## Examples

### Cloudflare R2

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { readBucket } from '@ssolu/mosaic-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const r = await readBucket({ client: r2, bucket: 'my-content' });
```

### AWS S3

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { readBucket } from '@ssolu/mosaic-s3';

const s3 = new S3Client({ region: 'us-east-1' });
const r = await readBucket({ client: s3, bucket: 'my-content', prefix: 'mosaic/' });
```

### MinIO

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { readBucket } from '@ssolu/mosaic-s3';

const minio = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
  forcePathStyle: true,
});
const r = await readBucket({ client: minio, bucket: 'my-content' });
```

## Tests

```sh
npm install
npm test
```

Two layers:

1. **Unit tests** (`test/reader.test.ts`) — basics, Path A variants, sidecars, cascade, refs, hidden, §7 violations, pagination, prefix handling, concurrency. Uses a tiny in-memory fake S3 client (zero external test deps).

2. **Parity tests** (`test/parity.test.ts`) — for each spec example (A–E), load via both `readFolder` (FS) and `readBucket` (S3) and assert identical `Resolution`s (identities, variants, data, sources, warnings, collections). If parity holds, switching adapters is provably content-preserving.

## Watch mode / hot reload

Not in v0.1. Filesystem readers get this for free via `fs.watch`; S3 has no built-in change events. Reasonable approaches when needed:

- **Cloudflare R2 events → webhook → reload** (production deploy hook)
- **periodic polling of `ListObjectsV2` with `If-Modified-Since`** (~5s for dev)
- **explicit reload on bucket-edit tool save** (if the editor is your own)

The reader is stateless and cheap to re-run, so any of these wrap it the same way.

## Limits

- ListObjectsV2 returns up to 1000 keys per page. We paginate, so total object count is unbounded — but the spec pipeline holds the full file list in memory. For very large content sets (50k+ records), consider sharding by prefix.
- JSON fetches are bounded by `concurrency` (default 32). Raise for high-latency endpoints, lower for tight rate limits.
- Manifest is read only if exactly `{prefix}/mosaic.json` exists. Manifests in subdirectories are not recognised (matches base spec §7.2).

## License

[Apache License 2.0](./LICENSE), same as the rest of the Mosaic code.

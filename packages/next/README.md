<p align="center"><img src="./logo.svg" width="64" alt="Mosaic logo"></p>

# @ssolu/mosaic-next

**Next.js helpers for the [Mosaic](https://github.com/slavasolutions/mosaic) folder format.** Read your content from a folder; let Next render it. Same folder works with `@ssolu/mosaic-astro` — switch frameworks without touching content.

- App Router first (Next 14+ / 15.x).
- Pages Router supported via the same helpers (you wire the call sites).
- Zero runtime dependencies beyond `@ssolu/mosaic-core`. `next` and `react` are peer deps.

## Install

```bash
npm install @ssolu/mosaic-next @ssolu/mosaic-core
```

The package is currently a workspace dep in the Mosaic monorepo. Once published, install from npm.

## Usage — App Router

A typical static site uses one optional catch-all route. The example below covers the full `[[...slug]]` pattern.

```tsx
// src/app/[[...slug]]/page.tsx
import { notFound } from 'next/navigation';
import { getMosaicEntry, getMosaicUrls } from '@ssolu/mosaic-next';

const CONTENT = './content';

export async function generateStaticParams() {
  return getMosaicUrls(CONTENT);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const url = '/' + (slug ?? []).join('/');
  const entry = await getMosaicEntry(CONTENT, url === '//' ? '/' : url);
  if (!entry) return notFound();

  return (
    <article>
      <h1>{String(entry.data.title ?? entry.id)}</h1>
      {entry.body && <pre>{entry.body}</pre>}
    </article>
  );
}
```

The `next.config.mjs` only needs `output: 'export'` for static hosting:

```js
export default { output: 'export' };
```

## API

### `readMosaic(rootPath, opts?)`

The one entry point. Wraps `@ssolu/mosaic-core`'s `readFolder` and applies the Mosaic Web profile's URL derivation when declared in `mosaic.json`. Returns:

```ts
interface MosaicResolution {
  entries: MosaicEntry[];        // all records, sorted by id
  routedEntries: MosaicEntry[];  // records with a URL (under the profile root)
  nonRouted: MosaicEntry[];      // records outside the profile root
  manifest: MosaicManifest | null;
}

interface MosaicEntry {
  id: string;
  slug: string;     // == id
  url?: string;     // present iff under the profile root
  data: Record<string, unknown>;
  body?: string;    // opaque content body, when present
  opaque: boolean;
}
```

### `getMosaicUrls(rootPath)`

Convenience for `generateStaticParams` on a catch-all `[[...slug]]` route. Returns `Array<{ slug: string[] }>`. The home page URL `/` maps to `{ slug: [] }`.

### `getMosaicEntry(rootPath, url)`

Single entry by URL. URLs must start with `/`. Returns `null` when no routed entry matches.

### `getMosaicEntries(rootPath, opts?)`

Index-page helper. Filter by `urlPrefix` (e.g. `/blog`) for collection pages. By default the index URL itself is excluded; pass `includeIndex: true` to include it. `routedOnly: false` also surfaces non-route records.

### URL helpers (exported for advanced use)

- `deriveUrl(identity, profileRoot)` — identity → URL, per spec §3.
- `getWebProfileRoot(manifest)` — profile root from `mosaic.json`, or `null`.
- `urlToSlugArray(url)` / `slugArrayToUrl(slug)` — Next catch-all conversions.

## Usage — Pages Router

The same helpers work; just call them from `getStaticPaths` / `getStaticProps`:

```ts
// pages/[[...slug]].tsx
import { getMosaicEntry, getMosaicUrls } from '@ssolu/mosaic-next';

export async function getStaticPaths() {
  const urls = await getMosaicUrls('./content');
  return { paths: urls.map((u) => ({ params: { slug: u.slug } })), fallback: false };
}

export async function getStaticProps({ params }: { params: { slug?: string[] } }) {
  const url = '/' + ((params.slug ?? []) as string[]).join('/');
  const entry = await getMosaicEntry('./content', url === '//' ? '/' : url);
  if (!entry) return { notFound: true };
  return { props: { entry } };
}
```

## Live example

A runnable demo lives at `packages/next/examples/minimal-next-site/`. The deployed copies are at <https://slavasolutions.github.io/mosaic/demo-single-next/>, <https://slavasolutions.github.io/mosaic/demo-blog-next/>, and <https://slavasolutions.github.io/mosaic/demo-full-next/> — three content shapes rendered by Next. The Astro twin builds the same three folders to `/demo-single/`, `/demo-blog/`, `/demo-full/`. See <https://slavasolutions.github.io/mosaic/explore/> for the picker page.

## License

Apache 2.0. See `LICENSE` in this folder.

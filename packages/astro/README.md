<p align="center"><img src="logo.svg" width="64" alt="Mosaic logo"></p>

# @ssolu/mosaic-astro

**Astro Content Layer loader for Mosaic folders. Read your content from a folder; let Astro render it.**

[Mosaic](https://github.com/slavasolutions/mosaic) is a folder format for structured content — files are records, folders are collections, references link records. This package is the Astro adapter: it teaches Astro how to read a Mosaic folder as a content collection.

It is a thin wrapper around [mosaic-core](https://github.com/slavasolutions/mosaic-core), which does the actual reading (sidecar merge, cascade fill, reference resolution) per the base format spec. `@ssolu/mosaic-astro` just translates the resolved records to Astro's Content Layer shape and applies the [Mosaic Web profile](https://github.com/slavasolutions/mosaic/blob/main/spec/profiles/mosaic-web.md) `identity -> URL` map.

## Status

`0.1.0` — working draft. Targets Astro 5.x Content Layer API (back-compatible to the experimental form in 4.14).

## Install

```sh
npm install @ssolu/mosaic-astro @ssolu/mosaic-core astro
```

While `@ssolu/mosaic-core` is pre-release, `@ssolu/mosaic-astro` declares it as a local `file:` dependency. Once `@ssolu/mosaic-core` ships to npm we'll switch the dep over and the install line above will work without any sibling-folder setup.

## Use

```ts
// src/content/config.ts
import { defineCollection } from 'astro:content';
import { mosaicLoader } from '@ssolu/mosaic-astro';

export const collections = {
  pages: defineCollection({ loader: mosaicLoader({ root: './content' }) }),
};
```

That's it. Astro will:

- enumerate every record in `./content` (via mosaic-core),
- expose each record's resolved JSON as `entry.data`,
- expose the Markdown / opaque body as `entry.body`,
- assign `entry.data.url` for any record under the Mosaic Web profile root (default `pages/`),
- watch the folder in `astro dev`.

## What's supported

| Feature | Status | Defined in |
|---|---|---|
| Identity (file/folder form, modifiers, `index`) | yes (via mosaic-core) | [base §7](https://github.com/slavasolutions/mosaic/blob/main/spec/format/01-format.md) |
| Sidecars | yes (via mosaic-core) | base §8 |
| Cascade (`locale`) | yes (via mosaic-core) | refs §12 |
| Content references (`ref:`) | yes (via mosaic-core) | refs §11 |
| Mosaic Web profile — identity -> URL | **yes — this package** | [web profile §3](https://github.com/slavasolutions/mosaic/blob/main/spec/profiles/mosaic-web.md) |
| Markdown body (`entry.body`) | yes | base §5.1 |
| Dev-mode watch | yes | Astro Content Layer |
| Sitemap synthesis | deferred | web profile §6 |
| Redirects | deferred | web profile §6 |
| Locale-as-prefix folders | deferred | web profile §6 |
| Astro rendered HTML | deferred (no Markdown render yet) | — |

The first four rows are work that lives in `@ssolu/mosaic-core`. If something there is wrong, the fix goes in that repo; this adapter only forwards what core produces.

## API

```ts
import { mosaicLoader } from '@ssolu/mosaic-astro';

mosaicLoader({
  root: './content',          // required: path to the Mosaic folder
  includeNonRouteRecords: true, // default: emit records outside the web root as no-url entries
});
```

The loader returns an Astro `Loader` object — pass it to `defineCollection({ loader })`.

Every entry has the following shape:

```ts
{
  id: string;          // Mosaic identity, e.g. "pages/about" or "team/ada"
  slug: string;        // same as id
  data: {              // resolved JSON (sidecar merge + cascade + refs)
    [k: string]: unknown;
    slug: string;      // identity, again, for Astro Zod schemas
    url?: string;      // mosaic-web URL if under the profile root
  };
  body?: string;       // bytes of .md / opaque content, if any
  digest?: string;     // change-detection hash
}
```

## Demo

A real, runnable Astro site lives in `examples/minimal-site/`:

```sh
cd examples/minimal-site
npm install
npm run dev
```

It reads one of three Mosaic folders at the repo root — `examples/content-single/`, `examples/content-blog/`, or `examples/content-full/` — selected via `MOSAIC_CONTENT_DIR` (default `content-blog`). Each shape is shared byte-for-byte with the Next twin under `packages/next/examples/minimal-next-site/`.

Routes served by the blog shape:

- `/` (from `pages/index.json`)
- `/about` (from `pages/about.json` + `pages/about.fr.json` variant)
- `/blog` (from `pages/blog/index.json`)
- `/blog/<post>` (one route per `pages/blog/<post>.{json,md}` pair)
- `/legal` (HTML body fixture — `pages/legal.{json,html}`)

The non-route record `team/ada.json` is exposed via the content collection but does not get a URL.

## Tests

```sh
npm install
npm test
```

Two test layers:

1. **Unit tests** for `deriveUrl` (URL derivation per Mosaic Web §3.1). Every row of the spec table is asserted.
2. **Loader contract tests** that stub `@ssolu/mosaic-core` and drive `mosaicLoader` against a fake Astro `LoaderContext`.

A full end-to-end test against a real Astro build is deferred for v0.1 — Astro's container API is moving and the unit + contract tests already cover the surface this package owns. The `examples/minimal-site/` demo is the manual end-to-end check.

## What's deferred

- **End-to-end test against a real Astro build.** Unit tests + contract tests + a runnable demo cover v0.1.
- **Markdown rendering.** The body is exposed as raw text; Astro's `render()` integration will come once we decide whether to use Astro's built-in Markdown pipeline or a Mosaic-shaped one.
- **Schema generation.** A future minor version may auto-derive a Zod schema from `mosaic.json`; for now users declare their own.
- **Image / asset URL resolution.** Deferred per the web profile spec §6.

## License

[Apache License 2.0](./LICENSE), with explicit patent grant. Same as the rest of the Mosaic code.

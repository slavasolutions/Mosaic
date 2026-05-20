/**
 * Astro Content Layer loader for Mosaic folders.
 *
 * Targets Astro's Content Layer API (Astro 5.x; back-compatible to the
 * experimental form in 4.14). The Loader contract we implement:
 *
 *   interface Loader {
 *     name: string;
 *     load(context: LoaderContext): Promise<void>;
 *     schema?: ZodSchema;
 *   }
 *
 *   interface LoaderContext {
 *     collection: string;
 *     store: DataStore;
 *     logger: AstroIntegrationLogger;
 *     parseData<T>(opts): Promise<T>;
 *     generateDigest(data): string;
 *     watcher?: FSWatcher;
 *     meta: MetaStore;
 *     refreshContextData?: Record<string, unknown>;
 *   }
 *
 * Doc reference: https://docs.astro.build/en/reference/content-loader-reference/
 *
 * We deliberately type LoaderContext as a structural local interface rather
 * than importing from `astro/loaders` — that subpath is unstable across the
 * 4.x -> 5.x boundary, and our loader only uses a small documented surface.
 * Astro accepts any object that matches the `Loader` shape.
 */

import { resolve as pathResolve } from 'node:path';
import { readFolder } from '@ssolu/mosaic-core';
import { deriveUrl, getWebProfileRoot } from './url.js';
import { renderBody } from './markdown.js';
import type {
  MosaicCoreReadResult,
  MosaicLoaderOptions,
  MosaicEntry,
} from './types.js';

// --- Minimal local types for Astro's Content Layer context ---------------
//
// These mirror the public shape documented at
// https://docs.astro.build/en/reference/content-loader-reference/. We keep
// them local so the loader builds even without `astro` installed (devs may
// be running unit tests in isolation), and so we are not coupled to any
// specific Astro minor version's internal type re-exports.

interface AstroLogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug?(msg: string): void;
}

interface DataStore {
  set(entry: {
    id: string;
    data: Record<string, unknown>;
    body?: string;
    bodyExt?: string;
    digest?: string;
    rendered?: { html: string };
    filePath?: string;
  }): void;
  get(id: string): unknown;
  delete(id: string): void;
  clear(): void;
  keys(): Iterable<string>;
  has(id: string): boolean;
}

interface FSWatcherLike {
  on(event: 'change' | 'add' | 'unlink', listener: (path: string) => void): unknown;
}

interface LoaderContext {
  collection: string;
  store: DataStore;
  logger: AstroLogger;
  parseData<T extends Record<string, unknown>>(opts: {
    id: string;
    data: T;
    filePath?: string;
  }): Promise<T>;
  generateDigest(data: Record<string, unknown> | string): string;
  watcher?: FSWatcherLike;
  meta?: { get(k: string): string | undefined; set(k: string, v: string): void };
  refreshContextData?: Record<string, unknown>;
}

interface AstroLoader {
  name: string;
  load(context: LoaderContext): Promise<void>;
}

// --- The loader factory --------------------------------------------------

/**
 * Create an Astro Content Layer loader that sources entries from a Mosaic
 * folder.
 *
 * Two modes:
 *
 * - **Filesystem (`root`)** — loader calls `readFolder(root, { cascadingKeys: ['theme'] })`
 *   under the hood. The `['theme']` cascade is wired automatically so the
 *   mosaic-design-tokens profile works out of the box.
 *
 * - **Custom source (`source`)** — loader calls your async function and
 *   expects it to return a mosaic-core `Resolution`. The loader does NOT
 *   inject `cascadingKeys` here; the adapter you wrap must pass them
 *   itself. For mosaic-web sites that means passing `cascadingKeys: ['theme']`
 *   to `readBucket` / `readGit` / whatever backend you use, otherwise the
 *   design-tokens cascade is silently disabled.
 *
 * @example Filesystem
 * ```ts
 * import { defineCollection } from 'astro:content';
 * import { mosaicLoader } from '@ssolu/mosaic-astro';
 *
 * export const collections = {
 *   pages: defineCollection({ loader: mosaicLoader({ root: './content' }) }),
 * };
 * ```
 *
 * @example S3 / R2 (custom source — note `cascadingKeys`)
 * ```ts
 * import { mosaicLoader } from '@ssolu/mosaic-astro';
 * import { readBucket } from '@ssolu/mosaic-s3';
 *
 * export const collections = {
 *   pages: defineCollection({
 *     loader: mosaicLoader({
 *       source: () => readBucket({
 *         client, bucket: 'my-content',
 *         cascadingKeys: ['theme'],   // ← required for mosaic-web sites
 *       }),
 *     }),
 *   }),
 * };
 * ```
 */
export function mosaicLoader(options: MosaicLoaderOptions): AstroLoader {
  if (!options) {
    throw new TypeError('mosaicLoader: options object is required.');
  }
  const hasRoot = typeof options.root === 'string' && options.root.length > 0;
  const hasSource = typeof options.source === 'function';
  if (hasRoot === hasSource) {
    throw new TypeError(
      'mosaicLoader: pass exactly one of `root` (filesystem) or `source` ' +
        '(custom async function returning a mosaic-core Resolution).',
    );
  }

  const includeNonRouteRecords = options.includeNonRouteRecords ?? true;

  return {
    name: options.name ?? 'mosaic',

    async load(context: LoaderContext): Promise<void> {
      const { store, logger, parseData, generateDigest, watcher } = context;

      let absoluteRoot: string | null = null;
      let read: () => Promise<MosaicCoreReadResult>;

      if (hasRoot) {
        absoluteRoot = pathResolve(process.cwd(), options.root!);
        logger.info(
          `mosaic-astro: loading collection "${context.collection}" from ${absoluteRoot}`,
        );
        read = () => readFolder(absoluteRoot!, { cascadingKeys: ['theme'] });
      } else {
        logger.info(
          `mosaic-astro: loading collection "${context.collection}" from custom source`,
        );
        read = options.source!;
      }

      await loadOnce({
        store,
        logger,
        parseData,
        generateDigest,
        read,
        includeNonRouteRecords,
      });

      // Filesystem mode: wire Astro's watcher. Custom sources opt into
      // their own reload (e.g. polling), keeping this loader source-agnostic.
      if (absoluteRoot && watcher && typeof watcher.on === 'function') {
        const trigger = (path: string) => {
          if (!path.startsWith(absoluteRoot!)) return;
          logger.info(`mosaic-astro: change detected (${path}); reloading`);
          loadOnce({
            store,
            logger,
            parseData,
            generateDigest,
            read,
            includeNonRouteRecords,
          }).catch((err: unknown) => {
            logger.error(
              `mosaic-astro: reload failed: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          });
        };
        watcher.on('change', trigger);
        watcher.on('add', trigger);
        watcher.on('unlink', (path: string) => {
          // Identity is path-derived; without a fresh read we can't be
          // sure which id was dropped. Cheapest correct move: re-read.
          trigger(path);
        });
      }
    },
  };
}

// --- internals -----------------------------------------------------------

interface LoadOnceArgs {
  store: DataStore;
  logger: AstroLogger;
  parseData: LoaderContext['parseData'];
  generateDigest: LoaderContext['generateDigest'];
  /**
   * Bound read function — closes over whichever source the caller picked
   * (filesystem `readFolder` or custom adapter like `readBucket`). The
   * filesystem path in the public factory wires the `theme` cascading key;
   * custom sources pre-wire whatever they want in their own factory.
   */
  read: () => Promise<MosaicCoreReadResult>;
  includeNonRouteRecords: boolean;
}

async function loadOnce(args: LoadOnceArgs): Promise<void> {
  const {
    store,
    logger,
    parseData,
    generateDigest,
    read,
    includeNonRouteRecords,
  } = args;

  const { records, manifest } = await read();
  const profileRoot = getWebProfileRoot(manifest);

  if (!profileRoot) {
    logger.info(
      'mosaic-astro: mosaic-web profile not declared in mosaic.json; ' +
        'records will be emitted without URLs.',
    );
  }

  // Replace the collection contents wholesale on each load. Astro's
  // DataStore.clear scopes to the current collection.
  store.clear();

  let emitted = 0;
  let skipped = 0;

  for (const [identity, variantsOrRecord] of records) {
    // Skip the root collection record — its identity is "" (per §7.1
    // path normalisation) and Astro's DataStore requires non-empty IDs.
    // Root records exist for cascade-source purposes only; they never
    // become entries in any collection.
    if (identity === '') continue;
    // Path A: mosaic-core returns Map<Identity, Record[]>; older shapes
    // (used by some test stubs / legacy fixtures) hand back a single
    // Record. Normalise either into the variant array form.
    const variants: Array<{
      data: Record<string, unknown>;
      body?: string;
      bodyExt?: string;
      filePath?: string;
      modifiers?: string[];
    }> = Array.isArray(variantsOrRecord)
      ? (variantsOrRecord as Array<{
          data: Record<string, unknown>;
          body?: string;
          bodyExt?: string;
          filePath?: string;
          modifiers?: string[];
        }>)
      : [variantsOrRecord as {
          data: Record<string, unknown>;
          body?: string;
          bodyExt?: string;
          filePath?: string;
          modifiers?: string[];
        }];

    for (const record of variants) {
      const modifiers = Array.isArray(record.modifiers) ? record.modifiers : [];
      const isCanonical = modifiers.length === 0;

      // Each variant emits ONE Astro entry. Canonical variant uses the
      // identity itself as the id; non-canonical variants get a
      // `<identity>::<modifiers.join('.')>` id so they don't collide.
      const entryId = isCanonical
        ? identity
        : `${identity}::${modifiers.join('.')}`;

      // §11 / Mosaic Web §3: only the canonical variant gets the route URL.
      // Non-canonical variants are surfaced as non-route data entries; a
      // future locale profile can promote them to localised URLs.
      const url =
        profileRoot && isCanonical ? deriveUrl(identity, profileRoot) : null;

      if (url === null && !includeNonRouteRecords) {
        skipped++;
        continue;
      }

      const baseData: Record<string, unknown> = {
        ...record.data,
        // The slug + identity are part of the addressable shape we hand
        // Astro. They live alongside user data; downstream Zod schemas can
        // pick them up if declared. `slug` stays identity-only so adapters
        // can group variants by identity.
        slug: identity,
        modifiers,
      };
      if (url !== null) baseData.url = url;
      // `bodyExt` rides alongside `body` so consumers can dispatch on body
      // format (markdown vs HTML vs txt). Astro's DataStore strips unknown
      // top-level entry fields, so we pin it onto `data` where the
      // passthrough schema keeps it. Mirror at the entry level too for
      // typed-entry consumers.
      if (record.bodyExt !== undefined) baseData.bodyExt = record.bodyExt;

      let validated: Record<string, unknown>;
      try {
        validated = await parseData({
          id: entryId,
          data: baseData,
          filePath: record.filePath,
        });
      } catch (err) {
        logger.error(
          `mosaic-astro: parseData failed for "${entryId}": ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        continue;
      }

      const digestSource = record.body
        ? JSON.stringify(validated) + '\n' + record.body
        : JSON.stringify(validated);
      const digest = generateDigest(digestSource);

      const entry: MosaicEntry = {
        id: entryId,
        slug: identity,
        data: validated,
        digest,
      };
      if (record.body !== undefined) entry.body = record.body;
      if (record.bodyExt !== undefined) entry.bodyExt = record.bodyExt;
      if (record.filePath) entry.filePath = record.filePath;
      if (url !== null) entry.url = url;

      // Pre-render the body to sanitised HTML so consumers can use
      //   const { Content } = await render(entry); <Content />
      // — the canonical Astro idiom — instead of reaching for `set:html`
      // with an ad-hoc renderer. Dispatches on `bodyExt` (md / html / txt).
      if (record.body) {
        try {
          const html = renderBody(record.body, record.bodyExt);
          if (html) entry.rendered = { html };
        } catch (err) {
          logger.warn(
            `mosaic-astro: renderBody failed for "${entryId}": ${
              err instanceof Error ? err.message : String(err)
            } (entry.body is still available raw)`,
          );
        }
      }

      store.set(entry);
      emitted++;
    }
  }

  logger.info(
    `mosaic-astro: emitted ${emitted} entries` +
      (skipped > 0 ? ` (skipped ${skipped} non-route records)` : ''),
  );
}

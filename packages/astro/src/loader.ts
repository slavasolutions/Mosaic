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
import type {
  MosaicCoreReadFolder,
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
 * @example
 * ```ts
 * import { defineCollection } from 'astro:content';
 * import { mosaicLoader } from '@ssolu/mosaic-astro';
 *
 * export const collections = {
 *   pages: defineCollection({ loader: mosaicLoader({ root: './content' }) }),
 * };
 * ```
 */
export function mosaicLoader(options: MosaicLoaderOptions): AstroLoader {
  if (!options || typeof options.root !== 'string' || options.root.length === 0) {
    throw new TypeError(
      'mosaicLoader: `root` is required and must be a non-empty path string.',
    );
  }

  const includeNonRouteRecords = options.includeNonRouteRecords ?? true;
  const rootInput = options.root;

  return {
    name: options.name ?? 'mosaic',

    async load(context: LoaderContext): Promise<void> {
      const { store, logger, parseData, generateDigest, watcher } = context;

      // Resolve `root` against the process cwd if it's relative. Astro runs
      // loaders with cwd set to the Astro project root.
      const absoluteRoot = pathResolve(process.cwd(), rootInput);

      logger.info(
        `mosaic-astro: loading collection "${context.collection}" from ${absoluteRoot}`,
      );

      await loadOnce({
        absoluteRoot,
        store,
        logger,
        parseData,
        generateDigest,
        readFolder,
        includeNonRouteRecords,
      });

      // Dev-mode hot reload: watch the folder and re-run the load on
      // change. mosaic-core handles the read; we just trigger.
      if (watcher && typeof watcher.on === 'function') {
        const trigger = (path: string) => {
          if (!path.startsWith(absoluteRoot)) return;
          logger.info(`mosaic-astro: change detected (${path}); reloading`);
          loadOnce({
            absoluteRoot,
            store,
            logger,
            parseData,
            generateDigest,
            readFolder,
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
  absoluteRoot: string;
  store: DataStore;
  logger: AstroLogger;
  parseData: LoaderContext['parseData'];
  generateDigest: LoaderContext['generateDigest'];
  readFolder: MosaicCoreReadFolder;
  includeNonRouteRecords: boolean;
}

async function loadOnce(args: LoadOnceArgs): Promise<void> {
  const {
    absoluteRoot,
    store,
    logger,
    parseData,
    generateDigest,
    readFolder,
    includeNonRouteRecords,
  } = args;

  // `theme` is the cascading key the design-tokens profile declares; pass it
  // through so themes flow from root collection record's `defaults.theme`
  // down to every descendant page. Other cascading keys (like profile-
  // declared layout keys) would be added here too.
  const { records, manifest } = await readFolder(absoluteRoot, {
    cascadingKeys: ['theme'],
  });
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
      filePath?: string;
      modifiers?: string[];
    }> = Array.isArray(variantsOrRecord)
      ? (variantsOrRecord as Array<{
          data: Record<string, unknown>;
          body?: string;
          filePath?: string;
          modifiers?: string[];
        }>)
      : [variantsOrRecord as {
          data: Record<string, unknown>;
          body?: string;
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
      if (record.filePath) entry.filePath = record.filePath;
      if (url !== null) entry.url = url;

      store.set(entry);
      emitted++;
    }
  }

  logger.info(
    `mosaic-astro: emitted ${emitted} entries` +
      (skipped > 0 ? ` (skipped ${skipped} non-route records)` : ''),
  );
}

/**
 * Content collections — every page on mosaic.ssolu.dev is a Mosaic record
 * under ../site/. The Astro adapter (@ssolu/mosaic-astro) reads the folder,
 * resolves refs + cascade, and hands Astro typed entries via its Zod
 * schemas. We use those schemas verbatim so renaming a field anywhere is
 * a compile error.
 */

import { defineCollection } from 'astro:content';
import { mosaicLoader, pageSchema } from '@ssolu/mosaic-astro';

export const collections = {
  pages: defineCollection({
    // Pages collection only — tokens are emitted to CSS at build time and
    // don't need to live in a runtime collection. `includeNonRouteRecords:
    // false` drops anything outside the mosaic-web profile root (`/pages`)
    // so snippets, tokens, and the manifest don't try to validate as pages.
    loader: mosaicLoader({
      root: '../site',
      includeNonRouteRecords: false,
    }),
    schema: pageSchema,
  }),
};

import { defineCollection, z } from 'astro:content';
import { mosaicLoader } from '@ssolu/mosaic-astro';

// Astro 5+ picks this file up automatically as `src/content.config.ts`.
// Schema is permissive: the loader always sets `slug` and (for routed
// records) `url`. .passthrough() preserves unknown keys.
//
// `MOSAIC_CONTENT_DIR` selects the content folder under examples/ —
// content-single, content-blog, or content-full. Default content-blog so
// `astro dev` works without env-var ceremony.
const contentDir = process.env.MOSAIC_CONTENT_DIR ?? 'content-blog';
const pages = defineCollection({
  loader: mosaicLoader({ root: `../../../../examples/${contentDir}` }),
  schema: z
    .object({
      slug: z.string(),
      url: z.string().optional(),
      title: z.string().optional(),
    })
    .passthrough(),
});

export const collections = { pages };

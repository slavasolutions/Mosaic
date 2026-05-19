import { defineCollection, z } from 'astro:content';
import { mosaicLoader } from '@ssolu/mosaic-astro';

// Astro 5+ picks this file up automatically as `src/content.config.ts`.
// Schema is permissive: the loader always sets `slug` and (for routed records)
// `url`. Every other field comes from the Mosaic record verbatim — we don't
// want the schema to strip them. .passthrough() preserves unknown keys.
//
// `MOSAIC_CONTENT_DIR` selects the content folder under examples/ —
// default `content`, dark variant `content-dark`, minimal `content-minimal`.
const contentDir = process.env.MOSAIC_CONTENT_DIR ?? 'content';
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

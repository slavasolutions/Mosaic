import { defineCollection, z } from 'astro:content';
import { mosaicLoader } from 'mosaic-astro';

// Astro 5 picks this file up automatically as `src/content.config.ts`.
// On Astro 4.14+ the same content lives at `src/content/config.ts`.
const pages = defineCollection({
  loader: mosaicLoader({ root: './content' }),
  schema: z.object({
    title: z.string().optional(),
    slug: z.string(),
    url: z.string().optional(),
  }),
});

export const collections = { pages };

/**
 * Zod schemas for the Mosaic Web profile.
 *
 * Mosaic-core validates records against the format spec (§§5–9) at read
 * time — those checks live in `@ssolu/mosaic-core/validate`. THIS module
 * exposes the same shape as Zod schemas so Astro Content Collections get
 * typed `entry.data` without forcing example sites to redeclare the shape
 * by hand.
 *
 * Usage:
 *
 * ```ts
 * import { defineCollection } from 'astro:content';
 * import { mosaicLoader, pageSchema } from '@ssolu/mosaic-astro';
 *
 * export const collections = {
 *   pages: defineCollection({
 *     loader: mosaicLoader({ root: '../../site' }),
 *     schema: pageSchema,
 *   }),
 * };
 * ```
 *
 * The schemas use `z.object({...}).passthrough()` so adapter-side fields
 * (`slug`, `modifiers`, `url`, `bodyExt`) the loader injects ride along
 * without forcing the user to re-declare them.
 *
 * NOTE on imports: Astro's `astro:content` re-exports a Zod instance that
 * is wired into its content collection machinery. To keep this package
 * usable outside Astro (tests, generators) we import from plain `zod`. The
 * shapes are interchangeable — Astro accepts any ZodType as a schema.
 */

import { z } from 'zod';

// --- primitives ---------------------------------------------------------

/** A reference to another record, e.g. `"ref:/snippets/hero-home"`. */
export const refSchema = z
  .string()
  .regex(/^ref:\/.+/, 'must start with `ref:/`');

/** Body-format discriminator. Mirrors `TEXT_BODY_EXTENSIONS` in mosaic-core. */
export const bodyExtSchema = z.enum(['md', 'html', 'txt', 'adoc']);

/** Brand-token palette colour. Hex string `#rrggbb` or `#rgb`. */
export const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);

// --- block schemas (used inside `sections` after ref resolution) --------

/** Hero block — title, lede, CTAs, optional art. */
export const heroSchema = z.object({
  '@type': z.literal('hero'),
  title: z.string(),
  titleHighlight: z.string().optional(),
  lede: z.string().optional(),
  eyebrow: z.string().optional(),
  ctas: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        primary: z.boolean().optional(),
      }),
    )
    .optional(),
  art: z
    .object({
      src: z.string(),
      alt: z.string().default(''),
      anchor: z
        .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'centre'])
        .optional(),
      overflow: z
        .object({
          top: z.number().optional(),
          right: z.number().optional(),
          bottom: z.number().optional(),
          left: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

/** Rule-cards block — eyebrow, heading, list of titled items. */
export const ruleCardsSchema = z.object({
  '@type': z.literal('rule-cards'),
  eyebrow: z.string().optional(),
  heading: z.string(),
  items: z.array(
    z.object({
      label: z.string().optional(),
      title: z.string(),
      body: z.string(),
    }),
  ),
});

/** Journal preview — eyebrow, heading, list of dated items + view-all link. */
export const journalPreviewSchema = z.object({
  '@type': z.literal('journal-preview'),
  eyebrow: z.string().optional(),
  heading: z.string(),
  viewAllLabel: z.string().optional(),
  viewAllHref: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string(),
      date: z.string(),
      href: z.string(),
      summary: z.string().optional(),
    }),
  ),
});

/** Discriminated union over every known block `@type`. */
export const blockSchema = z.discriminatedUnion('@type', [
  heroSchema,
  ruleCardsSchema,
  journalPreviewSchema,
]);

// --- page-level schemas -------------------------------------------------

/**
 * A page record under `/pages/`. The `sections` field is an array of refs
 * to block records under `/snippets/`; the adapter resolves refs at read
 * time, so consumers see resolved blocks. The schema accepts either form
 * (refs OR resolved blocks) for flexibility.
 */
export const pageSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    shape: z.enum(['home', 'single', 'blog', 'full']).optional(),
    sections: z.array(z.union([refSchema, blockSchema])).optional(),
    body: z.string().optional(),
    bodyExt: bodyExtSchema.optional(),
    // Adapter-injected fields — let them ride along untyped.
    slug: z.string().optional(),
    url: z.string().optional(),
    modifiers: z.array(z.string()).optional(),
  })
  .passthrough();

/** Tokens record at `/tokens/index.json`. */
export const tokensSchema = z
  .object({
    color: z.record(z.string(), colorSchema).optional(),
    font: z.record(z.string(), z.string()).optional(),
    radius: z.record(z.string(), z.string()).optional(),
    space: z.record(z.string(), z.string()).optional(),
    layout: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

/** `mosaic.json` manifest. */
export const manifestSchema = z
  .object({
    version: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    site: z.string().optional(),
    locales: z
      .object({
        default: z.string(),
        supported: z.array(z.string()),
      })
      .optional(),
    nav: z
      .array(
        z.object({
          href: z.string(),
          label: z.string(),
          external: z.boolean().optional(),
        }),
      )
      .optional(),
    brand: z
      .object({
        logo: z.string().optional(),
        wordmark: z.string().optional(),
        version: z.string().optional(),
      })
      .optional(),
    profiles: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

// --- inferred types -----------------------------------------------------

export type Ref = z.infer<typeof refSchema>;
export type BodyExt = z.infer<typeof bodyExtSchema>;
export type HeroBlock = z.infer<typeof heroSchema>;
export type RuleCardsBlock = z.infer<typeof ruleCardsSchema>;
export type JournalPreviewBlock = z.infer<typeof journalPreviewSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Page = z.infer<typeof pageSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
export type Manifest = z.infer<typeof manifestSchema>;

import z from 'zod';

export const SearchHitTypeSchema = z.enum([
  'plan',
  'fiche',
  'indicateur',
  'action',
  'document',
]);
export type SearchHitType = z.infer<typeof SearchHitTypeSchema>;

/**
 * A single normalized result row returned to the frontend.
 *
 * - `id` is numeric for plans / fiches / indicateurs / documents and a string
 *   composite (`${actionId}:${collectiviteId}`) for actions.
 * - `title` and `snippet` may carry `<mark>...</mark>` highlight markup from
 *   Meilisearch's `_formatted` payload — the consumer decides how to render it.
 * - `contextFields` is intentionally open-shape: each entity ships extras the UI
 *   row needs (parent_id, collectivite_id, type tier, filename, ...) without
 *   forcing every consumer to know the full per-entity document schema.
 */
export const SearchHitSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  snippet: z.string().nullable(),
  type: SearchHitTypeSchema,
  contextFields: z.record(z.string(), z.unknown()),
});
export type SearchHit = z.infer<typeof SearchHitSchema>;

export const BucketSchema = z.object({
  hits: z.array(SearchHitSchema),
  estimatedTotalHits: z.number().int().nonnegative(),
  processingTimeMs: z.number().int().nonnegative(),
});
export type Bucket = z.infer<typeof BucketSchema>;

export const SearchResponseSchema = z.object({
  buckets: z
    .object({
      plans: BucketSchema,
      fiches: BucketSchema,
      indicateurs: BucketSchema,
      actions: BucketSchema,
      documents: BucketSchema,
    })
    .partial(),
  totalHits: z.number().int().nonnegative(),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

import z from 'zod';

export const searchIndexNameSchema = z.enum([
  'plans',
  'fiches',
  'indicateurs',
  'actions',
  'documents',
]);
export type SearchIndexName = z.infer<typeof searchIndexNameSchema>;

export const ficheParentFilterSchema = z.enum([
  'all',
  'top-level',
  'sous-action',
]);
export type FicheParentFilter = z.infer<typeof ficheParentFilterSchema>;

/**
 * Filter for the `plans` bucket: `'all'` returns both root plans and sub-axes,
 * `'root'` only returns rows with `parentId IS NULL`, `'axe'` only returns
 * rows with `parentId IS NOT NULL`. Mirrors `ficheParentFilter`.
 */
export const planParentFilterSchema = z.enum(['all', 'root', 'axe']);
export type PlanParentFilter = z.infer<typeof planParentFilterSchema>;

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  collectiviteId: z.number().int().positive(),
  enabledIndexes: z.array(searchIndexNameSchema).min(1),
  exclusiveMode: z.boolean().default(false),
  ficheParentFilter: ficheParentFilterSchema.default('all'),
  planParentFilter: planParentFilterSchema.default('all'),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

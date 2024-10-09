import { z } from 'zod';
import { getQueryOptionsSchema } from '../../../shared/domain/query_options.schema';
import { filtreRessourceLieesSchema } from '../../../collectivites/shared/domain/filtre-ressource-liees.schema';

/**
 * Schema de filtre pour le fetch des plan actions.
 */
export const fetchFilterSchema = filtreRessourceLieesSchema.pick({
  planActionIds: true,
  utilisateurPiloteIds: true,
  personnePiloteIds: true,
});

export type FetchFilter = z.infer<typeof fetchFilterSchema>;

const sortValues = ['nom', 'created_at'] as const;

export type SortPlansActionValue = (typeof sortValues)[number];

const fetchSortSchema = z.object({
  field: z.enum(sortValues),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export type FetchSort = z.infer<typeof fetchSortSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema(sortValues).extend({
  filtre: fetchFilterSchema,
});

export type FetchOptions = z.input<typeof fetchOptionsSchema>;

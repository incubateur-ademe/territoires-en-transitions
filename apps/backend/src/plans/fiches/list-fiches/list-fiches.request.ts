import { FicheWithRelationsAndCollectivite } from '@/backend/plans/fiches/list-fiches/fiche-action-with-relations.dto';
import { limitSchema } from '@/backend/utils/pagination.schema';
import { z } from 'zod';
import { listFichesRequestFiltersSchema } from '../shared/filters/filters.request';

export const sortValues = [
  'modified_at',
  'created_at',
  'titre',
  'dateDebut',
] as const;

export type ListFichesSortValue = (typeof sortValues)[number];

const sortSchema = z
  .object({ field: z.enum(sortValues), direction: z.enum(['asc', 'desc']) })
  .array()
  .optional();

export type SortOptions = z.infer<typeof sortSchema>;

const commonQueryOptionsSchema = z.object({
  sort: sortSchema,
});

const DEFAULT_ITEMS_NUMBER_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

const pagination = z.union([
  z.object({
    limit: z.literal('all'),
  }),
  z.object({
    page: z.coerce.number().optional().default(DEFAULT_PAGE),
    limit: limitSchema.optional().default(DEFAULT_ITEMS_NUMBER_PER_PAGE),
  }),
]);
const queryOptionsSchema = commonQueryOptionsSchema.and(pagination);

export type QueryOptionsSchema = z.infer<typeof queryOptionsSchema>;

export const listFichesInputSchema = z.object({
  axesId: z.array(z.coerce.number()).optional(),
  collectiviteId: z.coerce.number(),
  filters: listFichesRequestFiltersSchema.optional(),
  queryOptions: queryOptionsSchema.optional(),
});

export type ListFichesOutput = {
  count: number;
  nextPage: number | null;
  numberOfPages: number;
  fiches: FicheWithRelationsAndCollectivite[];
};

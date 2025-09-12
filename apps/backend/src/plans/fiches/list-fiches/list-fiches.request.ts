import { FicheWithRelationsAndCollectivite } from '@/backend/plans/fiches/list-fiches/fiche-action-with-relations.dto';
import { limitSchema } from '@/domain/utils';
import { z } from 'zod';
import { listFichesRequestFiltersSchema } from '../shared/filters/filters.request';

export const sortValues = ['modified_at', 'created_at', 'titre'] as const;

export type ListFichesSortValue = (typeof sortValues)[number];

const sortSchema = z
  .object({ field: z.enum(sortValues), direction: z.enum(['asc', 'desc']) })
  .array()
  .optional();

export type SortOptions = z.infer<typeof sortSchema>;

const commonPaginationSchema = z.object({
  sort: sortSchema,
});

export type PaginationWithoutLimitSchema = z.infer<
  typeof commonPaginationSchema
>;

const paginationWithLimitSchema = commonPaginationSchema.extend({
  page: z.coerce.number().optional(),
  limit: limitSchema.optional(),
});

export type PaginationWithLimitSchema = z.infer<
  typeof paginationWithLimitSchema
>;

export const listFichesRequestWithLimitSchema = z.object({
  axesId: z.array(z.coerce.number()).optional(),
  collectiviteId: z.coerce.number(),
  filters: listFichesRequestFiltersSchema.optional(),
  queryOptions: paginationWithLimitSchema.optional(),
});

export type ListFichesRequestWithLimit = z.infer<
  typeof listFichesRequestWithLimitSchema
>;

export type ListFichesResponse = {
  count: number;
  nextPage: number | null;
  numberOfPages: number;
  fiches: FicheWithRelationsAndCollectivite[];
};

export const listFichesRequestWithoutLimitSchema = z.object({
  axesId: z.array(z.coerce.number()).optional(),
  collectiviteId: z.coerce.number(),
  filters: listFichesRequestFiltersSchema.optional(),
  queryOptions: commonPaginationSchema.optional(),
});

export type ListFichesRequestWithoutLimit = z.infer<
  typeof listFichesRequestWithoutLimitSchema
>;

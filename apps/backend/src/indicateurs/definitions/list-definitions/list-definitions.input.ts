import { listDefinitionsInputFiltersSchema } from '@tet/domain/indicateurs';
import { getPaginationSchema, PAGE_DEFAULT } from '@tet/domain/utils';
import { z } from 'zod';

export const listDefinitionsInputSortValues = [
  'estRempli',
  'titre',
  'identifiantReferentiel',
] as const;

export type ListDefinitionsInputSort =
  (typeof listDefinitionsInputSortValues)[number];

const listDefinitionsInputQueryOptionsSchema = getPaginationSchema(
  listDefinitionsInputSortValues
);

export const listDefinitionsInputSchema = z.object({
  collectiviteId: z.number().optional(),
  filters: listDefinitionsInputFiltersSchema.optional().prefault({}),
  queryOptions: listDefinitionsInputQueryOptionsSchema.optional().prefault({
    page: PAGE_DEFAULT,
    limit: 50,
  }),
});

export type ListDefinitionsInput = z.output<typeof listDefinitionsInputSchema>;

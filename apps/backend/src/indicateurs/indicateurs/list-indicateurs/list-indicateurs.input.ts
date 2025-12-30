import { listDefinitionsInputFiltersSchema } from '@tet/domain/indicateurs';
import { getPaginationSchema, PAGE_DEFAULT } from '@tet/domain/utils';
import { z } from 'zod';

export const listIndicateursInputSortValues = [
  'estRempli',
  'titre',
  'identifiantReferentiel',
] as const;

export type ListIndicateursInputSort =
  (typeof listIndicateursInputSortValues)[number];

const listIndicateursInputQueryOptionsSchema = getPaginationSchema(
  listIndicateursInputSortValues
);

export const listIndicateursInputSchema = z.object({
  collectiviteId: z.number(),
  filters: listDefinitionsInputFiltersSchema.optional().prefault({}),
  queryOptions: listIndicateursInputQueryOptionsSchema.optional().prefault({
    page: PAGE_DEFAULT,
    limit: 50,
  }),
});

export type ListIndicateursInput = z.output<typeof listIndicateursInputSchema>;

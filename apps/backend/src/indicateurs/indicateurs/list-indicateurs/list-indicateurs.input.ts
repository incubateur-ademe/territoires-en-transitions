import {
  listIndicateursInputFiltersSchema,
  listIndicateursInputSortValues,
} from '@tet/domain/indicateurs';
import { getPaginationSchema, PAGE_DEFAULT } from '@tet/domain/utils';
import { z } from 'zod';

const listIndicateursInputQueryOptionsSchema = getPaginationSchema(
  listIndicateursInputSortValues
);

export const listIndicateursInputSchema = z.object({
  collectiviteId: z.number(),
  filters: listIndicateursInputFiltersSchema.optional().prefault({}),
  queryOptions: listIndicateursInputQueryOptionsSchema.optional().prefault({
    page: PAGE_DEFAULT,
    limit: 50,
  }),
});

export type ListIndicateursInput = z.output<typeof listIndicateursInputSchema>;

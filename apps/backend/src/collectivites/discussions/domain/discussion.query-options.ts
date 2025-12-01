import { discussionOrderByEnumSchema } from '@tet/domain/collectivites';
import { limitSchema } from '@tet/domain/utils';
import z from 'zod';

const DEFAULT_ITEMS_NUMBER_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

const sortSchema = z
  .object({
    field: discussionOrderByEnumSchema,
    direction: z.enum(['asc', 'desc']),
  })
  .array()
  .optional();

export type SortOptions = z.infer<typeof sortSchema>;

const commonQueryOptionsSchema = z.object({
  sort: sortSchema,
});

const pagination = z.union([
  z.object({
    limit: z.literal('all'),
  }),
  z.object({
    page: z.coerce.number().optional().default(DEFAULT_PAGE),
    limit: limitSchema.optional().default(DEFAULT_ITEMS_NUMBER_PER_PAGE),
  }),
]);

export const queryOptionsTypeSchema = commonQueryOptionsSchema.and(pagination);
export type QueryOptionsType = z.infer<typeof queryOptionsTypeSchema>;

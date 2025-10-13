import { limitSchema } from '@/backend/utils/pagination.schema';
import z from 'zod';

const DEFAULT_ITEMS_NUMBER_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

export const sortValues = ['actionId', 'created_at', 'status'] as const;

const sortSchema = z
  .object({ field: z.enum(sortValues), direction: z.enum(['asc', 'desc']) })
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

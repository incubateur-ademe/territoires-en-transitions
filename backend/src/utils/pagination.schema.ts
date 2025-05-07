import { z } from 'zod';

const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const paginationNoSortSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().min(1).max(1000),
});

export const paginationNoSortSchemaOptionalLimit =
  paginationNoSortSchema.partial({
    limit: true,
  });

const paginationSchema = paginationNoSortSchema.extend({
  sort: sortSchema.array().optional(),
  limit: z.coerce.number().min(1).max(1000).default(1000),
});

export function getPaginationSchema<
  U extends string,
  T extends Readonly<[U, ...U[]]>
>(sortFields: T) {
  return paginationSchema.extend({
    sort: sortSchema
      .extend({
        field: z.enum(sortFields),
      })
      .array()
      .optional(),
  });
}

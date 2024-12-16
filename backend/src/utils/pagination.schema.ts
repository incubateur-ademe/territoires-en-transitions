import { z } from 'zod';

const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

const paginationSchema = z.object({
  sort: sortSchema.array().optional(),
  page: z.number().optional().default(1),
  limit: z.number().min(1).max(1000).default(1000),
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

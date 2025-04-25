import { z } from 'zod';

const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const PAGE_DEFAULT = 1;
export const LIMIT_DEFAULT = 1000;

const paginationSchema = z.object({
  sort: sortSchema.array().optional(),
  page: z.number().optional().default(PAGE_DEFAULT),
  limit: z.number().min(1).max(LIMIT_DEFAULT).default(LIMIT_DEFAULT),
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

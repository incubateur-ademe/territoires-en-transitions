import { z } from 'zod';

export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const queryOptionsSchema = z.object({
  sort: sortSchema.array().optional(),
  page: z.number().optional().default(1),
  limit: z.number().min(1).max(1000).default(1000),
});

export function getQueryOptionsSchema<
  U extends string,
  T extends Readonly<[U, ...U[]]>
>(sortFields: T) {
  return queryOptionsSchema.extend({
    sort: sortSchema
      .extend({
        field: z.enum(sortFields),
      })
      .array()
      .optional(),
  });
}

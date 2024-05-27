import {z} from 'zod';

export const sortSchema = z.object({
  field: z.enum(['titre', 'modified_at']),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const queryOptionsSchema = z.object({
  sort: sortSchema.array().optional(),
  page: z.number().optional().default(1),
  limit: z.number().min(1).max(100).default(10),
});

import { z } from 'zod';

export const listPlansInputSchema = z.object({
  collectiviteId: z
    .number()
    .positive("L'ID de la collectivité doit être positif"),
  limit: z.number().min(1).max(1000).optional(),
  page: z.number().min(1).optional(),
  sort: z
    .object({
      field: z.enum(['nom', 'createdAt', 'type']),
      direction: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
});

export type ListPlansInput = z.infer<typeof listPlansInputSchema>;

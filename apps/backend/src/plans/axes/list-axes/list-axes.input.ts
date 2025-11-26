import { z } from 'zod';

export const listAxesInputSchema = z.object({
  parentId: z
    .number()
    .positive("L'ID de l'axe parent ou du plan doit être positif"),
  collectiviteId: z
    .number()
    .positive("L'ID de la collectivité doit être positif"),
  limit: z.number().min(1).max(1000).optional(),
  page: z.number().min(1).optional(),
  sort: z
    .object({
      field: z.enum(['nom', 'createdAt']),
      direction: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
});

export type ListAxesInput = z.infer<typeof listAxesInputSchema>;

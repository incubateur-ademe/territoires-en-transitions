import { z } from 'zod';

export const getDepotContextInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type GetDepotContextInput = z.infer<typeof getDepotContextInputSchema>;

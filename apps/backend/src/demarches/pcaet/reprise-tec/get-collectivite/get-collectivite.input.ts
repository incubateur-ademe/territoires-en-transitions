import { z } from 'zod';

export const getCollectiviteInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type GetCollectiviteInput = z.infer<typeof getCollectiviteInputSchema>;

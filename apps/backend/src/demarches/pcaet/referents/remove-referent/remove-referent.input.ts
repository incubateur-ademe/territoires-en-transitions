import { z } from 'zod';

export const removeReferentInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  referentId: z.number().int().positive(),
});

export type RemoveReferentInput = z.infer<typeof removeReferentInputSchema>;

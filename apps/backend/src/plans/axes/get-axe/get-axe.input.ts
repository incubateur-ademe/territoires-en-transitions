import { z } from 'zod';

export const getAxeInputSchema = z.object({
  axeId: z.number().positive("L'ID de l'axe doit être positif"),
});

export type GetAxeInput = z.infer<typeof getAxeInputSchema>;


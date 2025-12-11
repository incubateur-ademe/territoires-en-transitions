import { z } from 'zod';

export const deleteAxeInputSchema = z.object({
  axeId: z.number().positive("L'ID de l'axe doit être positif"),
});

export type DeleteAxeInput = z.infer<typeof deleteAxeInputSchema>;


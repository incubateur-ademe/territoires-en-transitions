import { z } from 'zod';

export const deleteAvisInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  avisId: z.string().uuid(),
});

export type DeleteAvisInput = z.infer<typeof deleteAvisInputSchema>;

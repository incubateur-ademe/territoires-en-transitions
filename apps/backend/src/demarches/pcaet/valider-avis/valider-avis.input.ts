import { z } from 'zod';

export const validerAvisInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  avisId: z.string().uuid(),
});

export type ValiderAvisInput = z.infer<typeof validerAvisInputSchema>;

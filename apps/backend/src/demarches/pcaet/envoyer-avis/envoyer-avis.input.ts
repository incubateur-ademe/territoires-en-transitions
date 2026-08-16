import { z } from 'zod';

export const envoyerAvisInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  avisId: z.string().uuid(),
  objet: z.string().min(1),
  message: z.string().min(1),
});

export type EnvoyerAvisInput = z.infer<typeof envoyerAvisInputSchema>;

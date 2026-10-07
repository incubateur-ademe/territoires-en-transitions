import { z } from 'zod';

export const getAvisFileUrlInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  avisId: z.string().uuid(),
});

export type GetAvisFileUrlInput = z.infer<typeof getAvisFileUrlInputSchema>;

import { z } from 'zod';

export const getDossierInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  tecDossierId: z.number().int().positive(),
});

export type GetDossierInput = z.infer<typeof getDossierInputSchema>;

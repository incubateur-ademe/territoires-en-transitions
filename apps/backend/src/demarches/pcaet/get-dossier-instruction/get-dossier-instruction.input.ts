import { z } from 'zod';

export const getDossierInstructionInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
});

export type GetDossierInstructionInput = z.infer<
  typeof getDossierInstructionInputSchema
>;

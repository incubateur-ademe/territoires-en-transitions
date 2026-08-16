import { z } from 'zod';

export const getDiagnosticInstructionInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
});

export type GetDiagnosticInstructionInput = z.infer<
  typeof getDiagnosticInstructionInputSchema
>;

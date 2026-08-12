import { z } from 'zod';

export const getDiagnosticInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type GetDiagnosticInput = z.infer<typeof getDiagnosticInputSchema>;

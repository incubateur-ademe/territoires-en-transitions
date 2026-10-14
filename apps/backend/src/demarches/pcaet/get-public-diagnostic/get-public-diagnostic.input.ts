import { z } from 'zod';

export const getPublicDiagnosticInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type GetPublicDiagnosticInput = z.infer<
  typeof getPublicDiagnosticInputSchema
>;

import { z } from 'zod';

export const updateDiagnosticIndicateursValeursInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  valeurs: z
    .array(
      z.object({
        indicateurId: z.number().int().positive(),
        year: z.number().int().positive(),
        field: z.enum(['resultat', 'objectif']),
        value: z.number().nullable(),
      })
    )
    .min(1),
});

export type UpdateDiagnosticIndicateursValeursInput = z.infer<
  typeof updateDiagnosticIndicateursValeursInputSchema
>;


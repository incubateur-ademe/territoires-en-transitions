import { INDICATEURS_OBJECTIFS_HORIZONS } from '@tet/domain/plans';
import { z } from 'zod';

// le filtre « Afficher » du bloc, tel que l'écran le propose
export const exportIndicateursObjectifsInputSchema = z.object({
  planId: z.number().int().positive(),
  horizon: z
    .number()
    .refine((annee) =>
      (INDICATEURS_OBJECTIFS_HORIZONS as readonly number[]).includes(annee)
    )
    .optional(),
  source: z.enum(['tous', 'reglementaires', 'plan']).default('tous'),
});

export type ExportIndicateursObjectifsInput = z.infer<
  typeof exportIndicateursObjectifsInputSchema
>;

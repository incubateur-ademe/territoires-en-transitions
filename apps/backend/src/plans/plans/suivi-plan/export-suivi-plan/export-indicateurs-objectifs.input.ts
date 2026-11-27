import { INDICATEURS_OBJECTIFS_HORIZONS } from '@tet/domain/plans';
import { z } from 'zod';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';

// les filtres du bloc (axes, thématiques, pilotes…) plus « Afficher » et l'horizon
export const exportIndicateursObjectifsInputSchema =
  suiviPlanBlocInputSchema.extend({
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

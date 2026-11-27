import { z } from 'zod';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';

// les filtres du bloc (axes, thématiques, pilotes…) restreignent fiches et axes
export const getIndicateursObjectifsInputSchema = suiviPlanBlocInputSchema;

export type GetIndicateursObjectifsInput = z.infer<
  typeof getIndicateursObjectifsInputSchema
>;

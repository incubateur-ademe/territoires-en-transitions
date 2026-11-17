import { z } from 'zod';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';

// le bloc ignore les filtres de fiches : il ne propose que « Afficher »
export const getIndicateursObjectifsInputSchema = suiviPlanBlocInputSchema.pick(
  { planId: true }
);

export type GetIndicateursObjectifsInput = z.infer<
  typeof getIndicateursObjectifsInputSchema
>;

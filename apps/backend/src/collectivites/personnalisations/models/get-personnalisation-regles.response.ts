import { z } from 'zod';
import { personnalisationRegleSchema } from './personnalisation-regle.table';

export const getPersonnalisationReglesResponseSchema = z
  .object({
    regles: z.array(personnalisationRegleSchema),
  })
  .describe('Liste des regles de personnalisation');
export type GetPersonnalisationReglesResponseType = z.infer<
  typeof getPersonnalisationReglesResponseSchema
>;

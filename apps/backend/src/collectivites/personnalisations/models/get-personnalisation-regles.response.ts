import { personnalisationRegleSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const getPersonnalisationReglesResponseSchema = z
  .object({
    regles: z.array(personnalisationRegleSchema),
  })
  .describe('Liste des regles de personnalisation');
export type GetPersonnalisationReglesResponseType = z.infer<
  typeof getPersonnalisationReglesResponseSchema
>;

import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { personnalisationRegleSchema } from '../../../../../packages/domain/src/referentiels/scores/personnalisations/models/personnalisation-regle.table';

export const getPersonnalisationReglesResponseSchema = extendApi(
  z.object({
    regles: z.array(personnalisationRegleSchema),
  })
).describe('Liste des regles de personnalisation');
export type GetPersonnalisationReglesResponseType = z.infer<
  typeof getPersonnalisationReglesResponseSchema
>;

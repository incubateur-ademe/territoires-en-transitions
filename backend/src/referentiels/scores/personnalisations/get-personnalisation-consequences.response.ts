import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { personnalisationConsequenceSchema } from '../../../../../packages/domain/src/referentiels/scores/personnalisations/models/personnalisation-consequence.dto';

export const getPersonnalitionConsequencesResponseSchema = extendApi(
  z.record(z.string(), personnalisationConsequenceSchema)
).describe('Conséquence des règles de personnalisation sur les actions');
export type GetPersonnalitionConsequencesResponseType = z.infer<
  typeof getPersonnalitionConsequencesResponseSchema
>;

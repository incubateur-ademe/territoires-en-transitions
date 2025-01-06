import { z } from 'zod';
import { personnalisationConsequenceSchema } from './personnalisation-consequence.dto';

export const getPersonnalitionConsequencesResponseSchema = z
  .record(z.string(), personnalisationConsequenceSchema)
  .describe('Conséquence des règles de personnalisation sur les actions');
export type GetPersonnalitionConsequencesResponseType = z.infer<
  typeof getPersonnalitionConsequencesResponseSchema
>;

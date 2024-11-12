import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { personnalisationConsequenceSchema } from './personnalisation-consequence.dto';

export const getPersonnalitionConsequencesResponseSchema = extendApi(
  z.record(z.string(), personnalisationConsequenceSchema),
).openapi({
  description: 'Conséquence des règles de personnalisation sur les actions',
  title: 'Conséquence des règles de personnalisation',
});
export type GetPersonnalitionConsequencesResponseType = z.infer<
  typeof getPersonnalitionConsequencesResponseSchema
>;

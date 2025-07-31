import { z } from 'zod';

export const personnalisationConsequenceSchema = z
  .object({
    desactive: z.boolean().nullable(),
    scoreFormule: z.string().nullable(),
    potentielPerso: z.number().nullable(),
  })
  .describe(
    'Consequence des règles de personnalisation pour une action donnée'
  );

export type PersonnalisationConsequence = z.infer<
  typeof personnalisationConsequenceSchema
>;

//
// Schema indexed by actionId
export const personnalisationConsequencesByActionIdSchema = z
  .record(z.string(), personnalisationConsequenceSchema)
  .describe('Conséquence des règles de personnalisation sur les actions');

export type PersonnalisationConsequencesByActionId = z.infer<
  typeof personnalisationConsequencesByActionIdSchema
>;

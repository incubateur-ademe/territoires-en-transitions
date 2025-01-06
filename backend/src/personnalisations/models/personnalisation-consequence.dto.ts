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

export type PersonnalisationConsequenceType = z.infer<
  typeof personnalisationConsequenceSchema
>;

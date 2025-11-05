import { referentielIdEnumSchema } from '@/domain/referentiels';
import { z } from 'zod';

export const getPersonnalisationReglesRequestSchema = z
  .object({
    referentiel: z.optional(referentielIdEnumSchema),
  })
  .describe(
    'Paramètres de la requête pour obtenir les règles de personnalisation'
  );
export type GetPersonnalisationReglesRequestType = z.infer<
  typeof getPersonnalisationReglesRequestSchema
>;

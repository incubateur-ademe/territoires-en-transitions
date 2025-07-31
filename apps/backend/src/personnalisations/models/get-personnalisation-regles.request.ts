import { z } from 'zod';
import { referentielIdEnumSchema } from '../../referentiels/models/referentiel-id.enum';

export const getPersonnalisationReglesRequestSchema = z
  .object({
    referentiel: referentielIdEnumSchema.optional(),
  })
  .describe(
    'Paramètres de la requête pour obtenir les règles de personnalisation'
  );
export type GetPersonnalisationReglesRequestType = z.infer<
  typeof getPersonnalisationReglesRequestSchema
>;

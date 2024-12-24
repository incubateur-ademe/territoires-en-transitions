import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { referentielIdEnumSchema } from '../../referentiels/models/referentiel.enum';

export const getPersonnalisationReglesRequestSchema = extendApi(
  z.object({
    referentiel: referentielIdEnumSchema.optional(),
  })
).describe(
  'Paramètres de la requête pour obtenir les règles de personnalisation'
);
export type GetPersonnalisationReglesRequestType = z.infer<
  typeof getPersonnalisationReglesRequestSchema
>;

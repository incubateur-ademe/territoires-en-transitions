import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { ReferentielType } from '../../referentiels/models/referentiel.enum';

export const getPersonnalisationReglesRequestSchema = extendApi(
  z.object({
    referentiel: z.nativeEnum(ReferentielType).optional(),
  })
).openapi({
  description:
    'Paramètres de la requête pour obtenir les règles de personnalisation',
});
export type GetPersonnalisationReglesRequestType = z.infer<
  typeof getPersonnalisationReglesRequestSchema
>;
